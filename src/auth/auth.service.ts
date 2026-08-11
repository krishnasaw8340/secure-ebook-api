import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/services/users.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RoleType } from '../common/enums/role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly passwordService: PasswordService,
        private readonly tokenService: TokenService,
        private readonly refreshTokenService: RefreshTokenService,
    ) { }

    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        // Step 1: Check Email
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }
        const existingUserName = await this.usersService.findByUsername(dto.username)
        if (existingUserName) {
            throw new ConflictException('UserName Already Exists')
        }

        // Step 2: Hash Password
        const hashedPassword = await this.passwordService.hash(dto.password);

        // Step 3: Create User
        const user = await this.usersService.createUser({
            email: dto.email,
            username: dto.username,
            fullName: dto.fullName,
            password: hashedPassword,
        });

        // Step 4: Assign Default Role
        await this.usersService.assignRole(user.id, dto.roleType);

        // Step 5: Build JWT Payloads
        const accessPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles: [dto.roleType],
            type: 'access',
        };
        const refreshPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles: [dto.roleType],
            type: 'refresh',
        };

        // Step 6: Generate Tokens
        const accessToken = await this.tokenService.generateAccessToken(accessPayload);
        const refreshToken = await this.tokenService.generateRefreshToken(refreshPayload);

        // Step 7: Save Refresh Token (Hashed)
        await this.refreshTokenService.save(user.id, refreshToken);

        // Step 8: Return Response
        // Destructure to remove password from the returned object
        const { password, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        // Step 1: Find user by email
        const user = await this.usersService.findByEmail(dto.email, true, true);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Step 2: Verify password
        const isPasswordValid = await this.passwordService.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        // Step 3: Build JWT Payloads
        const roles = user.userRoles?.map((r) => r.role?.name).filter(Boolean) as RoleType[] || [];
        const accessPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles,
            type: 'access',
        };
        const refreshPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles,
            type: 'refresh',
        };

        // Step 4: Generate Tokens
        const accessToken = await this.tokenService.generateAccessToken(accessPayload);
        const refreshToken = await this.tokenService.generateRefreshToken(refreshPayload);

        // Step 5: Save Refresh Token (Hashed)
        await this.refreshTokenService.save(user.id, refreshToken);

        // Step 6: Return Response
        // Destructure to remove password from the returned object
        const { password, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }

    async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        // 1. Verify JWT
        let payload: JwtPayload;
        try {
            payload = await this.tokenService.verifyRefreshToken(refreshToken);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // 2. Make sure this is actually a refresh token
        if (payload.type !== 'refresh') {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // 3. Validate stored refresh token
        const storedToken = await this.refreshTokenService.findValidToken(
            payload.sub,
            refreshToken,
        );

        if (!storedToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // 4. Revoke old refresh token (Consumption / Rotation)
        await this.refreshTokenService.revokeById(storedToken.id);

        // 5. Build payloads for new tokens
        const accessPayload: JwtPayload = {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles,
            type: 'access',
        };

        const refreshPayload: JwtPayload = {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles,
            type: 'refresh',
        };

        // 6. Generate new access token and new refresh token
        const accessToken = await this.tokenService.generateAccessToken(accessPayload);
        const newRefreshToken = await this.tokenService.generateRefreshToken(refreshPayload);

        // 7. Store new refresh token (hashed)
        await this.refreshTokenService.save(payload.sub, newRefreshToken);

        // 8. Return both new access token and rotated refresh token
        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
}

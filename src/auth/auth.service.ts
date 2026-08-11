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

        // Step 5: Build JWT Payload
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles: [dto.roleType],
        };

        // Step 6: Generate Tokens
        const accessToken = await this.tokenService.generateAccessToken(payload);
        const refreshToken = await this.tokenService.generateRefreshToken(payload);

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

    async login(dto: LoginDto): Promise<any> {
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

        // Step 3: Build JWT Payload
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles: user.userRoles?.map((r) => r.role?.name).filter(Boolean) as RoleType[] || [],
        };

        // Step 4: Generate Tokens
        const accessToken = await this.tokenService.generateAccessToken(payload);
        const refreshToken = await this.tokenService.generateRefreshToken(payload);

        // Step 5: Save Refresh Token (Hashed)
        await this.refreshTokenService.save(user.id, refreshToken);

        // Step 6: Return Response
        // Destructure to remove password from the returned object
        const { password, ...userWithoutPassword } = user;

        return {
            // user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }
}

import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from '../user/services/users.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RegisterDto } from './dto/register.dto';
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
    ) {}

    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        // Step 1: Check Email
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
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
        await this.usersService.assignRole(user.id, RoleType.USER);

        // Step 5: Build JWT Payload
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles: [RoleType.USER],
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
}

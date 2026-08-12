import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/services/users.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { OtpService } from './services/otp.service';
import { MailService } from '../common/mail/mail.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RoleType } from '../common/enums/role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OtpPurpose } from '../common/enums/otp-purpose.enum';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly passwordService: PasswordService,
        private readonly tokenService: TokenService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly otpService: OtpService,
        private readonly mailService: MailService,
    ) { }

    async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
        // Step 1: Check Email & Username
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }
        const existingUserName = await this.usersService.findByUsername(dto.username);
        if (existingUserName) {
            throw new ConflictException('UserName Already Exists');
        }

        // Step 2: Hash Password
        const hashedPassword = await this.passwordService.hash(dto.password);

        // Step 3: Create User (isEmailVerified defaults to false)
        const user = await this.usersService.createUser({
            email: dto.email,
            username: dto.username,
            fullName: dto.fullName,
            password: hashedPassword,
        });

        // Step 4: Assign Default Role
        await this.usersService.assignRole(user.id, dto.roleType);

        // Step 5: Generate & Store Hashed OTP
        const otp = await this.otpService.generateAndSaveOtp(
            user.id,
            user.email,
            OtpPurpose.REGISTER,
        );

        // Step 6: Send Verification OTP via Email
        await this.mailService.sendVerificationOtp(user.email, otp);

        // Step 7: Return Response requiring email verification
        return {
            message: 'Registration successful. Please verify your email using the OTP sent to your email.',
            email: user.email,
        };
    }

    async verifyEmail(email: string, otp: string): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new BadRequestException('Invalid verification request');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email already verified');
        }

        await this.otpService.verify(
            user.id,
            email,
            otp,
            OtpPurpose.REGISTER,
        );

        await this.usersService.verifyEmail(user.id);

        return {
            message: 'Email verified successfully',
        };
    }

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        // Step 1: Find user by email
        const user = await this.usersService.findByEmail(dto.email, true, true);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Step 2: Check if email is verified
        if (!user.isEmailVerified) {
            throw new UnauthorizedException('Please verify your email before logging in');
        }

        // Step 3: Verify password
        const isPasswordValid = await this.passwordService.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        // Step 4: Build JWT Payloads
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

        // Step 5: Generate Tokens
        const accessToken = await this.tokenService.generateAccessToken(accessPayload);
        const refreshToken = await this.tokenService.generateRefreshToken(refreshPayload);

        // Step 6: Save Refresh Token (Hashed)
        await this.refreshTokenService.save(user.id, refreshToken);

        // Step 7: Return Response
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

    async logout(userId: string, refreshToken: string): Promise<void> {
        await this.refreshTokenService.revoke(userId, refreshToken);
    }

    async logoutAll(userId: string): Promise<void> {
        await this.refreshTokenService.revokeAllForUser(userId);
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(email);

        // Prevent account enumeration by returning identical generic message
        if (!user) {
            return {
                message: 'If the email exists, a password reset code has been sent.',
            };
        }

        const otp = await this.otpService.generateAndSaveOtp(
            user.id,
            user.email,
            OtpPurpose.FORGOT_PASSWORD,
        );

        await this.mailService.sendPasswordResetOtp(user.email, otp);

        return {
            message: 'If the email exists, a password reset code has been sent.',
        };
    }

    async resetPassword(dto: { email: string; otp: string; newPassword: string }): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new BadRequestException('Invalid password reset request');
        }

        // Verify OTP for FORGOT_PASSWORD purpose
        await this.otpService.verify(
            user.id,
            user.email,
            dto.otp,
            OtpPurpose.FORGOT_PASSWORD,
        );

        // Hash new password
        const hashedPassword = await this.passwordService.hash(dto.newPassword);

        // Update password in DB
        await this.usersService.updatePassword(user.id, hashedPassword);

        // Revoke all existing sessions/refresh tokens for security
        await this.refreshTokenService.revokeAllForUser(user.id);

        return {
            message: 'Password reset successfully',
        };
    }
}

import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './interfaces/jwt-user.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @Public()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user' })
    @ApiCreatedResponse({
        description: 'User successfully registered. Verification OTP sent via email.',
    })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 409, description: 'Email already exists.' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('verify-email')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify user email address using OTP code' })
    @ApiResponse({ status: 200, description: 'Email successfully verified.' })
    @ApiResponse({ status: 400, description: 'Invalid, expired, or max-attempted OTP code.' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.email, dto.otp);
    }

    @Post('resend-verification-otp')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend email verification OTP code' })
    @ApiResponse({ status: 200, description: 'If email exists and is unverified, verification OTP is sent.' })
    @ApiResponse({ status: 400, description: 'Email already verified or invalid request.' })
    async resendVerificationOtp(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerificationOtp(dto.email);
    }

    @Post('forgot-password')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset OTP code via email' })
    @ApiResponse({ status: 200, description: 'If email exists, password reset OTP is sent.' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password using email, OTP code, and new password' })
    @ApiResponse({ status: 200, description: 'Password reset successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP code / request.' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @Post('login')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiCreatedResponse({
        description: 'User successfully logged in and tokens generated.',
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials or unverified email.' })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
    @ApiResponse({ status: 200, description: 'Access token refreshed successfully.' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    @Post('logout')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Logout current session (revoke refresh token)' })
    @ApiResponse({ status: 204, description: 'Successfully logged out current session.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async logout(@CurrentUser() user: JwtUser, @Body() dto: RefreshTokenDto): Promise<void> {
        await this.authService.logout(user.userId, dto.refreshToken);
    }

    @Post('logout-all')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Logout from all devices (revoke all active refresh tokens for user)' })
    @ApiResponse({ status: 204, description: 'Successfully logged out from all devices.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async logoutAll(@CurrentUser() user: JwtUser): Promise<void> {
        await this.authService.logoutAll(user.userId);
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current authenticated user profile' })
    getMe(@CurrentUser() user: JwtUser): JwtUser {
        return user;
    }
}

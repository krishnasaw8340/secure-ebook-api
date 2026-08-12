import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
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
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify user email address using OTP code' })
    @ApiResponse({ status: 200, description: 'Email successfully verified.' })
    @ApiResponse({ status: 400, description: 'Invalid, expired, or max-attempted OTP code.' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.email, dto.otp);
    }

    @Post('login')
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
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
    @ApiResponse({ status: 200, description: 'Access token refreshed successfully.' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Logout current session (revoke refresh token)' })
    @ApiResponse({ status: 204, description: 'Successfully logged out current session.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async logout(@Request() req, @Body() dto: RefreshTokenDto): Promise<void> {
        await this.authService.logout(req.user.userId, dto.refreshToken);
    }

    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Logout from all devices (revoke all active refresh tokens for user)' })
    @ApiResponse({ status: 204, description: 'Successfully logged out from all devices.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async logoutAll(@Request() req): Promise<void> {
        await this.authService.logoutAll(req.user.userId);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Request() req) {
        return req.user;
    }
}

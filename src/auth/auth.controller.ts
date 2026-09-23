import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
import { DeviceInfo } from './decorators/device-info.decorator';
import type { DeviceMetadata } from './interfaces/device-metadata.interface';
import type { JwtUser } from './interfaces/jwt-user.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description:
      'User successfully registered. Verification OTP sent via email.',
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
  @ApiResponse({
    status: 400,
    description: 'Invalid, expired, or max-attempted OTP code.',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.otp);
  }

  @Post('resend-verification-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification OTP code' })
  @ApiResponse({
    status: 200,
    description: 'If email exists and is unverified, verification OTP is sent.',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already verified or invalid request.',
  })
  async resendVerificationOtp(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationOtp(dto.email);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP code via email' })
  @ApiResponse({
    status: 200,
    description: 'If email exists, password reset OTP is sent.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using email, OTP code, and new password',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP code / request.',
  })
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
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or unverified email.',
  })
  async login(
    @Body() loginDto: LoginDto,
    @DeviceInfo() deviceInfo: DeviceMetadata,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refreshToken'>> {
    const result = await this.authService.login(loginDto, deviceInfo);

    // Set refresh token as HttpOnly cookie — inaccessible to JavaScript
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
      path: '/api/auth',
    });

    // Return only accessToken + user in body (refresh token is in cookie)
    const { refreshToken: _rt, ...safeResponse } = result;
    return safeResponse;
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  async refresh(
    @Req() req: Request,
    @DeviceInfo() deviceInfo: DeviceMetadata,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken: string | undefined = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refresh(refreshToken, deviceInfo);

    // Rotate cookie — replace old token with newly issued one
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout current session (revoke refresh token)' })
  @ApiResponse({
    status: 204,
    description: 'Successfully logged out current session.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken: string | undefined = req.cookies?.refresh_token;

    if (refreshToken) {
      // Revoke the specific session token in the database
      await this.authService.logout(user.userId, refreshToken);
    }

    // Always clear the cookie regardless of whether the token existed
    res.clearCookie('refresh_token', { path: '/api/auth' });
  }

  @Post('logout-all')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Logout from all devices (revoke all active refresh tokens for user)',
  })
  @ApiResponse({
    status: 204,
    description: 'Successfully logged out from all devices.',
  })
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

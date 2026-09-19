import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserProfileResponseDto } from '../dto/user-profile-response.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get profile of current logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'Safe user profile fetched successfully.',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getMe(@CurrentUser() user: JwtUser): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update profile information of current logged-in user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 409, description: 'Username is already taken.' })
  async updateMe(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Patch('me/password')
  @ApiOperation({
    summary: 'Change password of current logged-in user',
  })
  @ApiResponse({
    status: 200,
    description:
      'Password changed successfully. All active sessions invalidated.',
  })
  @ApiResponse({
    status: 400,
    description:
      'New password is identical to current password or validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect or unauthorized.',
  })
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(user.userId, dto);
  }
}

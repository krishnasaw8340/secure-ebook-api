import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../common/enums/user-status.enum';
import { RoleType } from '../../common/enums/role.enum';

export class UserProfileResponseDto {
  @ApiProperty({ example: '7b8e1f6e-9e2b-42b5-a3d8-55a5b5f25a3a' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'krishna' })
  username?: string;

  @ApiProperty({ example: 'Krishna Kumar' })
  fullName: string;

  @ApiPropertyOptional({
    example: 'https://cdn.kuroyomi.com/avatars/user-123.webp',
  })
  avatarUrl?: string;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ enum: RoleType, isArray: true, example: [RoleType.USER] })
  roles: RoleType[];

  @ApiProperty({ example: '2026-09-19T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-19T08:05:00.000Z' })
  updatedAt: Date;
}

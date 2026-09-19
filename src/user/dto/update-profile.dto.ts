import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User display / full name',
    example: 'Krishna Kumar',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Full name must be between 2 and 100 characters' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Unique username / handle',
    example: 'krishna_dev',
  })
  @IsOptional()
  @IsString()
  @Length(3, 30, { message: 'Username must be between 3 and 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain alphanumeric characters, underscores, and hyphens',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'URL to avatar image',
    example: 'https://cdn.kuroyomi.com/avatars/user-123.webp',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}

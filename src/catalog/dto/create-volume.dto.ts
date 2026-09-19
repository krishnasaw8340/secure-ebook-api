import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { VolumeStatus } from '../../common/enums/volume-status.enum';

export class CreateVolumeDto {
  @ApiProperty({
    description: 'Target franchise series UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'seriesId is required' })
  @IsUUID('4', { message: 'seriesId must be a valid UUID v4' })
  seriesId: string;

  @ApiProperty({
    description: 'Volume number (supports decimals like 0.5, 7.5)',
    example: 1,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'volumeNumber is required' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'volumeNumber must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'volumeNumber must be greater than or equal to 0' })
  volumeNumber: number;

  @ApiPropertyOptional({
    description: 'Volume subtitle or official title',
    example: 'Romance Dawn',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Volume URL identifier slug. If omitted, auto-generated from series slug and volumeNumber.',
    example: 'one-piece-vol-1',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Volume synopsis and storyline overview',
    example: 'Luffy begins his journey to find the legendary One Piece...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Display sequence order. If omitted, defaults based on volumeNumber.',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Official publication release date (YYYY-MM-DD)',
    example: '1997-12-24',
  })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({
    description: 'Publishing status',
    enum: VolumeStatus,
    default: VolumeStatus.DRAFT,
    example: VolumeStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(VolumeStatus)
  status?: VolumeStatus;

  @ApiPropertyOptional({
    description: 'Timestamp when the volume went live',
    example: '2026-09-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

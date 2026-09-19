import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { VolumeStatus } from '../../common/enums/volume-status.enum';

export class UpdateVolumeDto {
  @ApiPropertyOptional({
    description: 'Reassign to a different series UUID',
    example: 'a0000000-0000-0000-0000-000000000002',
  })
  @IsOptional()
  @IsUUID('4', { message: 'seriesId must be a valid UUID v4' })
  seriesId?: string;

  @ApiPropertyOptional({
    description: 'Updated volume number',
    example: 1.5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  volumeNumber?: number;

  @ApiPropertyOptional({
    description: 'Updated volume title',
    example: 'Romance Dawn - Special Edition',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated volume URL slug',
    example: 'one-piece-vol-1-special',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Updated volume synopsis',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated display sequence order',
    example: 1,
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
    description: 'Updated publishing status',
    enum: VolumeStatus,
    example: VolumeStatus.PUBLISHED,
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

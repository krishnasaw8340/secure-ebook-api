import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { VolumeStatus } from '../../common/enums/volume-status.enum';

export class QueryVolumeDto {
  @ApiPropertyOptional({
    description: 'Filter volumes by franchise series UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  seriesId?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of volumes per page (max: 100)',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Fuzzy search by volume title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by VolumeStatus (Admins can view DRAFT/ARCHIVED; Public is restricted to PUBLISHED)',
    enum: VolumeStatus,
  })
  @IsOptional()
  @IsEnum(VolumeStatus)
  status?: VolumeStatus;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['volumeNumber', 'sortOrder', 'createdAt', 'title'],
    default: 'sortOrder',
  })
  @IsOptional()
  @IsIn(['volumeNumber', 'sortOrder', 'createdAt', 'title'])
  sortBy?: 'volumeNumber' | 'sortOrder' | 'createdAt' | 'title' = 'sortOrder';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

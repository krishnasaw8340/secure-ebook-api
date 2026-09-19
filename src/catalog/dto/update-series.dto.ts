import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { SeriesStatus } from '../../common/enums/series-status.enum';

export class UpdateSeriesDto {
  @ApiPropertyOptional({
    description: 'Updated series name',
    example: 'One Piece (Color Edition)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Series name cannot exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated unique URL-friendly slug',
    example: 'one-piece-color',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric characters separated by single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Updated series synopsis',
    example: 'Follow Monkey D. Luffy and his swashbuckling pirate crew...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated publishing status',
    enum: SeriesStatus,
    example: SeriesStatus.ONGOING,
  })
  @IsOptional()
  @IsEnum(SeriesStatus, { message: 'Status must be a valid SeriesStatus enum value' })
  status?: SeriesStatus;
}

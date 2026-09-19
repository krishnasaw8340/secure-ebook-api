import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { SeriesStatus } from '../../common/enums/series-status.enum';

export class CreateSeriesDto {
  @ApiProperty({
    description: 'Franchise series name',
    example: 'One Piece',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Series name is required' })
  @IsString()
  @MaxLength(255, { message: 'Series name cannot exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Unique URL-friendly slug. If omitted, auto-generated from name.',
    example: 'one-piece',
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
    description: 'Series synopsis and background overview',
    example: 'Follow Monkey D. Luffy and his swashbuckling pirate crew in search of the ultimate treasure, the One Piece.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Publishing status of the series',
    enum: SeriesStatus,
    default: SeriesStatus.DRAFT,
    example: SeriesStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(SeriesStatus, { message: 'Status must be a valid SeriesStatus enum value' })
  status?: SeriesStatus;
}

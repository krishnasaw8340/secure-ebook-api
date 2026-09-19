import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
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
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';

export class UpdateChapterDto {
  @ApiPropertyOptional({
    description: 'Reassign to a different Book UUID',
    example: 'e0000000-0000-0000-0000-000000000002',
  })
  @IsOptional()
  @IsUUID('4', { message: 'bookId must be a valid UUID v4' })
  bookId?: string;

  @ApiPropertyOptional({
    description: 'Updated chapter number',
    example: 1.5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'chapterNumber must be a valid number with up to 2 decimal places' },
  )
  @Min(0, { message: 'chapterNumber must be greater than or equal to 0' })
  chapterNumber?: number;

  @ApiPropertyOptional({
    description: 'Updated chapter title or subtitle',
    example: 'Romance Dawn — Dawn of the Adventure (Special Edition)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated display and ordering sequence',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Updated pricing model',
    enum: ChapterPricingModel,
    example: ChapterPricingModel.PARTIAL_FREE,
  })
  @IsOptional()
  @IsEnum(ChapterPricingModel)
  pricingModel?: ChapterPricingModel;

  @ApiPropertyOptional({
    description: 'Updated number of free preview pages (Required > 0 when pricingModel is PARTIAL_FREE)',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  freePageCount?: number;

  @ApiPropertyOptional({
    description: 'Updated coin cost (Required > 0 when pricingModel is PAID)',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  coinCost?: number;

  @ApiPropertyOptional({
    description: 'Updated total page count',
    example: 28,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageCount?: number;

  @ApiPropertyOptional({
    description: 'Updated publication status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    description: 'Updated publication timestamp',
    example: '2026-09-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

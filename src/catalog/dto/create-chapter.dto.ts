import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
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
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';

export class CreateChapterDto {
  @ApiProperty({
    description: 'Target Book UUID that this chapter belongs to',
    example: 'e0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'bookId is required' })
  @IsUUID('4', { message: 'bookId must be a valid UUID v4' })
  bookId: string;

  @ApiProperty({
    description: 'Chapter number (supports decimals like 1, 1.5, 10.1)',
    example: 1,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'chapterNumber is required' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'chapterNumber must be a valid number with up to 2 decimal places' },
  )
  @Min(0, { message: 'chapterNumber must be greater than or equal to 0' })
  chapterNumber: number;

  @ApiPropertyOptional({
    description: 'Chapter title or subtitle',
    example: 'Romance Dawn — Dawn of the Adventure',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Display and ordering sequence. If omitted, defaults based on chapterNumber * 10.',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Monetization pricing model for this chapter',
    enum: ChapterPricingModel,
    default: ChapterPricingModel.FREE,
    example: ChapterPricingModel.FREE,
  })
  @IsOptional()
  @IsEnum(ChapterPricingModel)
  pricingModel?: ChapterPricingModel;

  @ApiPropertyOptional({
    description: 'Number of initial free preview pages (Required > 0 when pricingModel is PARTIAL_FREE)',
    example: 3,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  freePageCount?: number;

  @ApiPropertyOptional({
    description: 'Coin cost to unlock/purchase this chapter (Required > 0 when pricingModel is PAID)',
    example: 50,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  coinCost?: number;

  @ApiPropertyOptional({
    description: 'Total page count in this chapter',
    example: 24,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageCount?: number;

  @ApiPropertyOptional({
    description: 'Whether chapter is publicly published and accessible',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when chapter went live (ISO 8601 string)',
    example: '2026-09-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

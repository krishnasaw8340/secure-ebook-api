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
import { ChapterContentStatus } from '../../common/enums/chapter-content-status.enum';

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
    {
      message:
        'chapterNumber must be a valid number with up to 2 decimal places',
    },
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
    description: 'Updated monetization pricing model (FREE or PAID)',
    enum: ChapterPricingModel,
    example: ChapterPricingModel.PAID,
  })
  @IsOptional()
  @IsEnum(ChapterPricingModel)
  pricingModel?: ChapterPricingModel;

  @ApiPropertyOptional({
    description: 'Updated coin cost for chapter access',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  coinCost?: number;

  @ApiPropertyOptional({
    description: 'Internal PDF object storage key in R2 / S3',
    example: 'books/b001/chapters/c001/chapter.pdf',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pdfStorageKey?: string;

  @ApiPropertyOptional({
    description: 'Original PDF file name',
    example: 'chapter-001.pdf',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pdfFileName?: string;

  @ApiPropertyOptional({
    description: 'PDF file size in bytes',
    example: 15420000,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pdfFileSize?: number;

  @ApiPropertyOptional({
    description: 'Extracted PDF page count',
    example: 42,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pdfPageCount?: number;

  @ApiPropertyOptional({
    description: 'Integrity checksum for uploaded PDF asset',
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  pdfChecksum?: string;

  @ApiPropertyOptional({
    description: 'Content lifecycle status',
    enum: ChapterContentStatus,
  })
  @IsOptional()
  @IsEnum(ChapterContentStatus)
  contentStatus?: ChapterContentStatus;

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

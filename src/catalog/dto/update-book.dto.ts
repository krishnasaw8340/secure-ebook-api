import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BookStatus } from '../../common/enums/book-status.enum';
import { BookPricingModel } from '../../common/enums/book-pricing-model.enum';

export class UpdateBookDto {
  @ApiPropertyOptional({
    description: 'Franchise Series UUID that this book belongs to',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'seriesId must be a valid UUID v4' })
  seriesId?: string;

  @ApiPropertyOptional({
    description: 'Optional Volume UUID within the Series (pass null or empty string to remove volume association)',
    example: 'b0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  volumeId?: string | null;

  @ApiPropertyOptional({
    description: 'Primary book title',
    example: 'One Piece, Vol. 1: Romance Dawn (Revised)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Original Japanese or alternative title',
    example: 'ONE PIECE 1 ROMANCE DAWN —冒険の夜明け—',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  japaneseTitle?: string;

  @ApiPropertyOptional({
    description: 'Unique URL slug identifier',
    example: 'one-piece-vol-1-romance-dawn-special',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Detailed book synopsis and overview',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Author UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  authorId?: string | null;

  @ApiPropertyOptional({
    description: 'Artist / Illustrator UUID',
    example: 'd0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  artistId?: string | null;

  @ApiPropertyOptional({
    description: 'Language UUID',
    example: 'e0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'languageId must be a valid UUID v4' })
  languageId?: string;

  @ApiPropertyOptional({
    description: 'Primary Category UUID (e.g., Manga, Light Novel, Comic)',
    example: 'f0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId must be a valid UUID v4' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Array of Genre UUIDs associated with the book (replaces existing associations if provided)',
    example: ['g0000000-0000-0000-0000-000000000001'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each genreId must be a valid UUID v4' })
  genreIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of Tag UUIDs associated with the book (replaces existing associations if provided)',
    example: ['t0000000-0000-0000-0000-000000000001'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each tagId must be a valid UUID v4' })
  tagIds?: string[];

  @ApiPropertyOptional({
    description: 'Publication status of the book',
    enum: BookStatus,
    example: BookStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @ApiPropertyOptional({
    description: 'Monetization and pricing model for this book',
    enum: BookPricingModel,
    example: BookPricingModel.FREE,
  })
  @IsOptional()
  @IsEnum(BookPricingModel)
  pricingModel?: BookPricingModel;

  @ApiPropertyOptional({
    description: 'Default coin cost per page when using PER_PAGE pricing',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultCoinPerPage?: number;

  @ApiPropertyOptional({
    description: 'Number of initial chapters accessible for free',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultFreeChapters?: number;

  @ApiPropertyOptional({
    description: 'Number of initial preview pages accessible for free per chapter',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultFreePages?: number;

  @ApiPropertyOptional({
    description: 'Whether this book requires premium tier membership or purchase',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Official release date (YYYY-MM-DD)',
    example: '1997-12-24',
  })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when the book went live',
    example: '2026-09-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

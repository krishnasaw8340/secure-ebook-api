import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BookStatus } from '../../common/enums/book-status.enum';
import { BookPricingModel } from '../../common/enums/book-pricing-model.enum';

export class CreateBookDto {
  @ApiProperty({
    description: 'Franchise Series UUID that this book belongs to',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'seriesId is required' })
  @IsUUID('4', { message: 'seriesId must be a valid UUID v4' })
  seriesId: string;

  @ApiPropertyOptional({
    description: 'Optional Volume UUID within the Series',
    example: 'b0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'volumeId must be a valid UUID v4' })
  volumeId?: string;

  @ApiProperty({
    description: 'Primary book title',
    example: 'One Piece, Vol. 1: Romance Dawn',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'title is required' })
  @IsString()
  @MaxLength(255)
  title: string;

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
    description: 'Unique URL slug identifier. Auto-generated from title if omitted.',
    example: 'one-piece-vol-1-romance-dawn',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Detailed book synopsis and overview',
    example: 'As a child, Monkey D. Luffy was inspired to become a pirate...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Author UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'authorId must be a valid UUID v4' })
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Artist / Illustrator UUID',
    example: 'd0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'artistId must be a valid UUID v4' })
  artistId?: string;

  @ApiProperty({
    description: 'Language UUID',
    example: 'e0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'languageId is required' })
  @IsUUID('4', { message: 'languageId must be a valid UUID v4' })
  languageId: string;

  @ApiProperty({
    description: 'Primary Category UUID (e.g., Manga, Light Novel, Comic)',
    example: 'f0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'categoryId is required' })
  @IsUUID('4', { message: 'categoryId must be a valid UUID v4' })
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Array of Genre UUIDs associated with the book',
    example: ['g0000000-0000-0000-0000-000000000001'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each genreId must be a valid UUID v4' })
  genreIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of Tag UUIDs associated with the book',
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
    default: BookStatus.DRAFT,
    example: BookStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @ApiPropertyOptional({
    description: 'Monetization and pricing model for this book',
    enum: BookPricingModel,
    default: BookPricingModel.FREE,
    example: BookPricingModel.FREE,
  })
  @IsOptional()
  @IsEnum(BookPricingModel)
  pricingModel?: BookPricingModel;

  @ApiPropertyOptional({
    description: 'Default coin cost per page when using PER_PAGE pricing',
    default: 0,
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultCoinPerPage?: number;

  @ApiPropertyOptional({
    description: 'Number of initial chapters accessible for free',
    default: 0,
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
    default: 0,
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
    default: false,
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

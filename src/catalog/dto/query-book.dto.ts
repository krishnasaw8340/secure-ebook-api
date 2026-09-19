import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { BookStatus } from '../../common/enums/book-status.enum';
import { BookPricingModel } from '../../common/enums/book-pricing-model.enum';

export class QueryBookDto {
  @ApiPropertyOptional({
    description: 'Filter books by series UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  seriesId?: string;

  @ApiPropertyOptional({
    description: 'Filter books by volume UUID',
    example: 'b0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  volumeId?: string;

  @ApiPropertyOptional({
    description: 'Filter books by author UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Filter books by artist UUID',
    example: 'd0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  artistId?: string;

  @ApiPropertyOptional({
    description: 'Filter books by language UUID',
    example: 'e0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  languageId?: string;

  @ApiPropertyOptional({
    description: 'Filter books by category UUID',
    example: 'f0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter books containing specific genre UUID',
    example: 'g0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  genreId?: string;

  @ApiPropertyOptional({
    description: 'Filter books containing specific tag UUID',
    example: 't0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  tagId?: string;

  @ApiPropertyOptional({
    description: 'Filter by BookStatus (Admins can view DRAFT/UNPUBLISHED/ARCHIVED; Public is restricted to PUBLISHED)',
    enum: BookStatus,
  })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @ApiPropertyOptional({
    description: 'Filter by pricing model',
    enum: BookPricingModel,
  })
  @IsOptional()
  @IsEnum(BookPricingModel)
  pricingModel?: BookPricingModel;

  @ApiPropertyOptional({
    description: 'Filter by premium requirement',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Fuzzy search by title, japanese title, or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

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
    description: 'Number of books per page (max: 100)',
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
    description: 'Sort field',
    enum: ['createdAt', 'title', 'averageRating', 'totalViews', 'releaseDate'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'title', 'averageRating', 'totalViews', 'releaseDate'])
  sortBy?: 'createdAt' | 'title' | 'averageRating' | 'totalViews' | 'releaseDate' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

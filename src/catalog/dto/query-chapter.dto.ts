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
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';

export class QueryChapterDto {
  @ApiPropertyOptional({
    description: 'Filter chapters by parent Book UUID',
    example: 'e0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  bookId?: string;

  @ApiPropertyOptional({
    description: 'Filter by chapter monetization pricing model',
    enum: ChapterPricingModel,
  })
  @IsOptional()
  @IsEnum(ChapterPricingModel)
  pricingModel?: ChapterPricingModel;

  @ApiPropertyOptional({
    description: 'Filter by publication status (Admins only for false; Public is restricted to true)',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    description: 'Fuzzy search by chapter title',
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
    description: 'Number of chapters per page (max: 100)',
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
    enum: ['chapterNumber', 'sortOrder', 'createdAt', 'title'],
    default: 'sortOrder',
  })
  @IsOptional()
  @IsIn(['chapterNumber', 'sortOrder', 'createdAt', 'title'])
  sortBy?: 'chapterNumber' | 'sortOrder' | 'createdAt' | 'title' = 'sortOrder';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

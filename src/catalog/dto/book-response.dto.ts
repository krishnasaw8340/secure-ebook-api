import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookStatus } from '../../common/enums/book-status.enum';
import { BookPricingModel } from '../../common/enums/book-pricing-model.enum';

export class BookGenreItemDto {
  @ApiProperty({ example: 'g0000000-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: 'Action' })
  name: string;

  @ApiProperty({ example: 'action' })
  slug: string;
}

export class BookTagItemDto {
  @ApiProperty({ example: 't0000000-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: 'Pirates' })
  name: string;

  @ApiProperty({ example: 'pirates' })
  slug: string;
}

export class BookItemDto {
  @ApiProperty({ example: 'e0000000-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  seriesId: string;

  @ApiPropertyOptional({ example: 'b0000000-0000-0000-0000-000000000001' })
  volumeId?: string;

  @ApiProperty({ example: 'One Piece, Vol. 1: Romance Dawn' })
  title: string;

  @ApiPropertyOptional({ example: 'ONE PIECE 1 ROMANCE DAWN —冒険の夜明け—' })
  japaneseTitle?: string;

  @ApiProperty({ example: 'one-piece-vol-1-romance-dawn' })
  slug: string;

  @ApiPropertyOptional({ example: 'Luffy begins his journey...' })
  description?: string;

  @ApiPropertyOptional({ example: 'c0000000-0000-0000-0000-000000000001' })
  authorId?: string;

  @ApiPropertyOptional({ example: 'd0000000-0000-0000-0000-000000000001' })
  artistId?: string;

  @ApiProperty({ example: 'e0000000-0000-0000-0000-000000000001' })
  languageId: string;

  @ApiProperty({ example: 'f0000000-0000-0000-0000-000000000001' })
  categoryId: string;

  @ApiProperty({ enum: BookStatus, example: BookStatus.PUBLISHED })
  status: BookStatus;

  @ApiProperty({ enum: BookPricingModel, example: BookPricingModel.FREE })
  pricingModel: BookPricingModel;

  @ApiProperty({ example: 0 })
  defaultCoinPerPage: number;

  @ApiProperty({ example: 0 })
  defaultFreeChapters: number;

  @ApiProperty({ example: 0 })
  defaultFreePages: number;

  @ApiProperty({ example: false })
  isPremium: boolean;

  @ApiProperty({ example: 0 })
  totalChapters: number;

  @ApiProperty({ example: 0 })
  totalPages: number;

  @ApiProperty({ example: 0.0 })
  averageRating: number;

  @ApiProperty({ example: 0 })
  totalViews: number;

  @ApiPropertyOptional({ example: '1997-12-24' })
  releaseDate?: Date;

  @ApiPropertyOptional({ example: '2026-09-20T00:00:00.000Z' })
  publishedAt?: Date;

  @ApiPropertyOptional({ example: 'u0000000-0000-0000-0000-000000000001' })
  createdBy?: string;

  @ApiPropertyOptional({ example: 'u0000000-0000-0000-0000-000000000001' })
  updatedBy?: string;

  @ApiProperty({ example: '2026-09-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class BookPaginationMetaDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class PaginatedBookResponseDto {
  @ApiProperty({ type: [BookItemDto] })
  data: BookItemDto[];

  @ApiProperty({ type: BookPaginationMetaDto })
  meta: BookPaginationMetaDto;
}

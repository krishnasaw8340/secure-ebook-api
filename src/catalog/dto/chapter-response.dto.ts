import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';

export class ChapterItemDto {
  @ApiProperty({ example: 'c0000000-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: 'e0000000-0000-0000-0000-000000000001' })
  bookId: string;

  @ApiProperty({ example: 1.0 })
  chapterNumber: number;

  @ApiPropertyOptional({ example: 'Romance Dawn — Dawn of the Adventure' })
  title?: string;

  @ApiProperty({ example: 10 })
  sortOrder: number;

  @ApiProperty({
    enum: ChapterPricingModel,
    example: ChapterPricingModel.FREE,
  })
  pricingModel: ChapterPricingModel;

  @ApiProperty({ example: 0 })
  freePageCount: number;

  @ApiProperty({ example: 0 })
  coinCost: number;

  @ApiProperty({ example: 24 })
  pageCount: number;

  @ApiProperty({ example: true })
  published: boolean;

  @ApiPropertyOptional({ example: '2026-09-20T00:00:00.000Z' })
  publishedAt?: Date;

  @ApiProperty({ example: '2026-09-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class ChapterPaginationMetaDto {
  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class PaginatedChapterResponseDto {
  @ApiProperty({ type: [ChapterItemDto] })
  data: ChapterItemDto[];

  @ApiProperty({ type: ChapterPaginationMetaDto })
  meta: ChapterPaginationMetaDto;
}

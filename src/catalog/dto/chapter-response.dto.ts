import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';
import { ChapterContentStatus } from '../../common/enums/chapter-content-status.enum';

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
  coinCost: number;

  @ApiPropertyOptional({ example: 'books/b001/chapters/c001/chapter.pdf' })
  pdfStorageKey?: string;

  @ApiPropertyOptional({ example: 'chapter-001.pdf' })
  pdfFileName?: string;

  @ApiPropertyOptional({ example: 15420000 })
  pdfFileSize?: number;

  @ApiPropertyOptional({ example: 42 })
  pdfPageCount?: number;

  @ApiPropertyOptional({
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  pdfChecksum?: string;

  @ApiProperty({
    enum: ChapterContentStatus,
    example: ChapterContentStatus.READY,
  })
  contentStatus: ChapterContentStatus;

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

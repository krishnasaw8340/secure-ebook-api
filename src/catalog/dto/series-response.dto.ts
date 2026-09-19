import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SeriesStatus } from '../../common/enums/series-status.enum';

export class SeriesItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'One Piece' })
  name: string;

  @ApiProperty({ example: 'one-piece' })
  slug: string;

  @ApiPropertyOptional({ example: 'Follow Monkey D. Luffy...' })
  description?: string;

  @ApiProperty({ enum: SeriesStatus, example: SeriesStatus.ONGOING })
  status: SeriesStatus;

  @ApiProperty({ example: '2026-09-19T20:42:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-19T20:42:00.000Z' })
  updatedAt: Date;
}

export class SeriesPaginationMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class PaginatedSeriesResponseDto {
  @ApiProperty({ type: [SeriesItemDto] })
  data: SeriesItemDto[];

  @ApiProperty({ type: SeriesPaginationMetaDto })
  meta: SeriesPaginationMetaDto;
}

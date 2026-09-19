import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VolumeStatus } from '../../common/enums/volume-status.enum';

export class VolumeItemDto {
  @ApiProperty({ example: 'b0000000-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  seriesId: string;

  @ApiProperty({ example: 1.0 })
  volumeNumber: number;

  @ApiPropertyOptional({ example: 'Romance Dawn' })
  title?: string;

  @ApiProperty({ example: 'one-piece-vol-1' })
  slug: string;

  @ApiPropertyOptional({ example: 'Luffy sets out to sea...' })
  description?: string;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiPropertyOptional({ example: '1997-12-24' })
  releaseDate?: Date;

  @ApiProperty({ enum: VolumeStatus, example: VolumeStatus.PUBLISHED })
  status: VolumeStatus;

  @ApiPropertyOptional({ example: '2026-09-20T00:00:00.000Z' })
  publishedAt?: Date;

  @ApiProperty({ example: '2026-09-19T20:42:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-19T20:42:00.000Z' })
  updatedAt: Date;
}

export class VolumePaginationMetaDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ example: false })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class PaginatedVolumeResponseDto {
  @ApiProperty({ type: [VolumeItemDto] })
  data: VolumeItemDto[];

  @ApiProperty({ type: VolumePaginationMetaDto })
  meta: VolumePaginationMetaDto;
}

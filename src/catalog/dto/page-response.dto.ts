import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PageResponseDto {
  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: 'c0000000-0000-0000-0000-000000000001' })
  chapterId: string;

  @ApiProperty({ example: 1 })
  pageNumber: number;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ example: 'https://storage.kuroyomi.com/chapters/c1/p1.webp' })
  storageKey: string;

  @ApiProperty({ example: 'https://storage.kuroyomi.com/chapters/c1/p1.webp' })
  imageUrl: string;

  @ApiPropertyOptional({ example: null })
  encryptedKey?: string;

  @ApiProperty({ example: false })
  isDrmProtected: boolean;

  @ApiPropertyOptional({ example: 1080 })
  width?: number;

  @ApiPropertyOptional({ example: 1920 })
  height?: number;

  @ApiPropertyOptional({ example: 'image/webp' })
  mimeType?: string;

  @ApiPropertyOptional({ example: 204800 })
  fileSize?: number;

  @ApiPropertyOptional({ example: 'a1b2c3d4e5f67890...' })
  checksum?: string;

  @ApiProperty({ example: '2026-09-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-20T00:00:00.000Z' })
  updatedAt: Date;
}

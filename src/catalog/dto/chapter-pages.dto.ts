import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ChapterPageUploadRequestDto {
  @ApiProperty({ example: 'page-001.webp', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Matches(/\.webp$/i, { message: 'Only WebP chapter pages are supported' })
  fileName: string;

  @ApiProperty({ example: 420000, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize: number;

  @ApiProperty({ example: 'image/webp' })
  @IsString()
  @Matches(/^image\/webp$/i, { message: 'contentType must be image/webp' })
  contentType: string;
}

export class ChapterPagesUploadUrlsDto {
  @ApiProperty({ type: [ChapterPageUploadRequestDto], minItems: 1, maxItems: 500 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ChapterPageUploadRequestDto)
  pages: ChapterPageUploadRequestDto[];
}

export class ChapterPageUploadUrlDto {
  @ApiProperty({ example: 1 })
  pageNumber: number;

  @ApiProperty({ example: 'chapters/id/pages/uuid.webp' })
  storageKey: string;

  @ApiProperty({ example: 'https://bucket.s3.amazonaws.com/...' })
  uploadUrl: string;

  @ApiProperty({ example: 600 })
  expiresIn: number;
}

export class ChapterPagesUploadUrlsResponseDto {
  @ApiProperty({ example: 'c0000000-0000-0000-0000-000000000001' })
  chapterId: string;

  @ApiProperty({ type: [ChapterPageUploadUrlDto] })
  pages: ChapterPageUploadUrlDto[];
}

export class ChapterPageDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber: number;

  @ApiProperty({ example: 'chapters/id/pages/uuid.webp', maxLength: 500 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  storageKey: string;

  @ApiPropertyOptional({ example: 1200, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ example: 2400, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height?: number;
}

export class SaveChapterPagesDto {
  @ApiProperty({ type: [ChapterPageDto], minItems: 1, maxItems: 500 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ChapterPageDto)
  pages: ChapterPageDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class ChapterPdfUploadUrlDto {
  @ApiProperty({
    description: 'Original PDF file name to be uploaded',
    example: 'chapter-001.pdf',
  })
  @IsNotEmpty({ message: 'fileName is required' })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 15420000,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'fileSize is required' })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'fileSize must be greater than 0 bytes' })
  fileSize: number;

  @ApiPropertyOptional({
    description: 'MIME type of the uploaded asset (must be application/pdf)',
    example: 'application/pdf',
    default: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  @Matches(/^application\/pdf$/i, {
    message: 'contentType must be application/pdf',
  })
  contentType?: string = 'application/pdf';

  @ApiPropertyOptional({
    description: 'Alias for contentType for backward compatibility',
    example: 'application/pdf',
    default: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

// Alias ChapterPdfUploadInitDto to ChapterPdfUploadUrlDto for full backwards compatibility
export class ChapterPdfUploadInitDto extends ChapterPdfUploadUrlDto {}

export class ChapterPdfUploadUrlResponseDto {
  @ApiProperty({
    description: 'Unique upload operation UUID',
    example: 'd0000000-0000-0000-0000-000000000001',
  })
  uploadId: string;

  @ApiProperty({
    description: 'Target Chapter UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  chapterId: string;

  @ApiProperty({
    description: 'Unique version UUID for immutable object storage',
    example: 'v0000000-0000-0000-0000-000000000001',
  })
  versionId: string;

  @ApiProperty({
    description: 'Immutable S3 object key',
    example:
      'chapters/c0000000-0000-0000-0000-000000000001/versions/v0000000-0000-0000-0000-000000000001/chapter.pdf',
  })
  objectKey: string;

  @ApiPropertyOptional({
    description: 'Alias for objectKey for backwards compatibility',
    example:
      'chapters/c0000000-0000-0000-0000-000000000001/versions/v0000000-0000-0000-0000-000000000001/chapter.pdf',
  })
  storageKey?: string;

  @ApiProperty({
    description: 'Direct S3 presigned PUT URL with temporary credentials',
    example:
      'https://ebook-platform-pdfs-prod.s3.ap-south-1.amazonaws.com/chapters/.../chapter.pdf?...',
  })
  uploadUrl: string;

  @ApiProperty({
    description: 'Presigned URL expiration in seconds',
    example: 600,
  })
  expiresIn: number;

  @ApiPropertyOptional({
    description: 'Alias for expiresIn in seconds',
    example: 600,
  })
  expiresInSeconds?: number;
}

// Alias ChapterPdfUploadInitResponseDto for backward compatibility
export class ChapterPdfUploadInitResponseDto extends ChapterPdfUploadUrlResponseDto {}

export class ChapterPdfUploadCompleteDto {
  @ApiPropertyOptional({
    description: 'Unique upload operation UUID returned by upload-url',
    example: 'd0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsString()
  uploadId?: string;

  @ApiPropertyOptional({
    description: 'Unique version UUID returned by upload-url',
    example: 'v0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsString()
  versionId?: string;

  @ApiPropertyOptional({
    description: 'Target immutable S3 object key returned by upload-url',
    example:
      'chapters/c0000000-0000-0000-0000-000000000001/versions/v0000000-0000-0000-0000-000000000001/chapter.pdf',
  })
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional({
    description: 'Alias for objectKey for backwards compatibility',
  })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiProperty({
    description: 'Sanitized PDF file name recorded in catalog metadata',
    example: 'chapter-001.pdf',
  })
  @IsNotEmpty({ message: 'fileName is required' })
  @IsString()
  fileName: string;

  @ApiPropertyOptional({
    description: 'File size in bytes (verified directly from S3 HeadObject)',
    example: 15420000,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'fileSize must be greater than 0 bytes' })
  fileSize?: number;

  @ApiPropertyOptional({
    description:
      'Total number of internal PDF pages extracted after upload validation',
    example: 42,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageCount?: number;

  @ApiPropertyOptional({
    description: 'SHA-256 or MD5 integrity checksum of the uploaded PDF',
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  @IsOptional()
  @IsString()
  checksum?: string;
}

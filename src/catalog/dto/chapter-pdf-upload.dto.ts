import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ChapterPdfUploadInitDto {
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
    description: 'MIME type of the uploaded asset',
    example: 'application/pdf',
    default: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mimeType?: string = 'application/pdf';
}

export class ChapterPdfUploadInitResponseDto {
  @ApiProperty({
    description: 'Target Chapter UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  chapterId: string;

  @ApiProperty({
    description: 'Deterministic internal object storage key in R2 / S3',
    example:
      'books/b0000000-0000-0000-0000-000000000001/chapters/c0000000-0000-0000-0000-000000000001/chapter.pdf',
  })
  storageKey: string;

  @ApiProperty({
    description:
      'Direct-to-storage presigned upload URL for direct browser PUT',
    example:
      'https://storage-placeholder.local/upload/chapter.pdf?token=presigned',
  })
  uploadUrl: string;

  @ApiProperty({
    description: 'Presigned URL expiration in seconds',
    example: 3600,
  })
  expiresInSeconds: number;
}

export class ChapterPdfUploadCompleteDto {
  @ApiProperty({
    description: 'Sanitized PDF file name recorded in catalog metadata',
    example: 'chapter-001.pdf',
  })
  @IsNotEmpty({ message: 'fileName is required' })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Verified PDF file size in bytes',
    example: 15420000,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'fileSize is required' })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'fileSize must be greater than 0 bytes' })
  fileSize: number;

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

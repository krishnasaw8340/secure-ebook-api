import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChapterAccessResponseDto {
  @ApiProperty({
    description: 'Chapter UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  chapterId: string;

  @ApiProperty({
    description: 'Parent Book UUID',
    example: 'e0000000-0000-0000-0000-000000000001',
  })
  bookId: string;

  @ApiProperty({
    description: 'Chapter number',
    example: 1.0,
  })
  chapterNumber: number;

  @ApiPropertyOptional({
    description: 'Chapter title',
    example: 'Romance Dawn',
  })
  title?: string;

  @ApiProperty({
    description:
      'Short-lived presigned GET URL for downloading the Chapter PDF',
    example:
      'https://ebook-platform-pdfs-prod.s3.ap-south-1.amazonaws.com/chapters/.../chapter.pdf?...',
  })
  pdfUrl: string;

  @ApiProperty({
    description: 'Presigned URL expiration duration in seconds',
    example: 600,
  })
  expiresIn: number;

  @ApiPropertyOptional({
    description: 'Total number of pages in the PDF',
    example: 42,
  })
  pageCount?: number;

  @ApiPropertyOptional({
    description: 'Original PDF file name',
    example: 'chapter-001.pdf',
  })
  fileName?: string;

  @ApiPropertyOptional({
    description: 'PDF file size in bytes',
    example: 15420000,
  })
  fileSize?: number;
}

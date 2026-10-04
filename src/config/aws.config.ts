import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
  bucket: process.env.AWS_S3_BUCKET || 'ebook-platform-pdfs-prod',
  maxChapterPdfSizeMb: Number(process.env.MAX_CHAPTER_PDF_SIZE_MB || 200),
  maxBookCoverSizeMb: Number(process.env.MAX_BOOK_COVER_SIZE_MB || 10),
}));

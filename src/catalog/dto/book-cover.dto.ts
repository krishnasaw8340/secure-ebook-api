import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const ALLOWED_COVER_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export class BookCoverUploadUrlDto {
  @ApiProperty({ example: 'the-last-ember-cover.jpg' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ example: 245678, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize: number;

  @ApiProperty({ enum: ALLOWED_COVER_CONTENT_TYPES, example: 'image/jpeg' })
  @IsString()
  @IsIn(ALLOWED_COVER_CONTENT_TYPES as unknown as string[], {
    message: 'contentType must be one of image/jpeg, image/png, image/webp',
  })
  contentType: string;
}

export class BookCoverUploadUrlResponseDto {
  @ApiProperty()
  bookId: string;

  @ApiProperty({ example: 'books/<bookId>/cover/cover' })
  objectKey: string;

  @ApiProperty()
  uploadUrl: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty({ example: 600 })
  expiresIn: number;
}

/** The object key is NEVER accepted from the client; it is derived server-side. */
export class BookCoverCompleteDto {
  @ApiProperty({ example: 'the-last-ember-cover.jpg' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fileName: string;
}

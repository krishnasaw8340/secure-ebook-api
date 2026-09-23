import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreatePagesDto {
  @ApiProperty({
    type: [String],
    description: 'Array of image URLs or storage keys for pages',
    example: [
      'https://storage.kuroyomi.com/chapters/c1/p1.webp',
      'https://storage.kuroyomi.com/chapters/c1/p2.webp',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  imageUrls: string[];
}

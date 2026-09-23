import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderPagesDto {
  @ApiProperty({
    type: [String],
    description: 'Array of page UUIDs in the desired display order',
    example: [
      'c0000000-0000-0000-0000-000000000002',
      'c0000000-0000-0000-0000-000000000001',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  pageIds: string[];
}

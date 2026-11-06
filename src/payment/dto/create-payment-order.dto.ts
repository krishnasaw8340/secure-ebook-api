import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiProperty({ description: 'Coin package to purchase' })
  @IsUUID()
  packageId: string;
}

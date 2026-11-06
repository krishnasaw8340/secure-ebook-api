import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders/create')
  createOrder(
    @Body() dto: CreatePaymentOrderDto,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.paymentService.createOrder(
      this.requireUserId(user),
      dto.packageId,
    );
  }

  @Get('orders/:id/status')
  getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.paymentService.getOrderStatus(this.requireUserId(user), id);
  }

  private requireUserId(user?: JwtUser): string {
    if (!user?.userId) throw new UnauthorizedException();
    return user.userId;
  }
}

import {
  Controller,
  Get,
  Logger,
  Query,
  ParseUUIDPipe,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from '../payment.service';

@Public()
@Controller('payment/paypal')
export class PayPalReturnController {
  private readonly logger = new Logger(PayPalReturnController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly config: ConfigService,
  ) {}

  @Get('return')
  async captureApprovedPayment(
    @Query('orderId', ParseUUIDPipe) orderId: string,
    @Query('token') providerOrderId: string,
    @Res() response: Response,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('payment.returnUrl');
    if (!frontendUrl) {
      throw new ServiceUnavailableException(
        'Payment return URL is not configured.',
      );
    }

    try {
      if (!orderId || !providerOrderId) {
        throw new Error('PayPal return is missing its order reference');
      }
      await this.paymentService.captureApprovedOrder(orderId, providerOrderId);
      const redirectUrl = new URL(frontendUrl);
      redirectUrl.searchParams.set('payment', 'success');
      response.redirect(303, redirectUrl.toString());
    } catch (error) {
      this.logger.error(
        `Could not capture PayPal return for order ${orderId || 'unknown'}`,
        error instanceof Error ? error.stack : String(error),
      );
      const redirectUrl = new URL(frontendUrl);
      redirectUrl.searchParams.set('payment', 'processing');
      response.redirect(303, redirectUrl.toString());
    }
  }
}

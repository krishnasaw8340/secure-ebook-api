import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { PaymentWebhookService } from '../services/payment-webhook.service';

/**
 * POST /api/payment/webhook/:provider
 * Public (providers cannot send our JWT); authenticity is established by the
 * provider adapter's signature verification, not by the route.
 */
@Public()
@ApiExcludeController()
@Controller('payment/webhook')
export class PaymentWebhookController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  @Post(':provider')
  @HttpCode(200)
  handle(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody) throw new BadRequestException('Missing request body');
    return this.webhookService.handle(provider, {
      headers: req.headers,
      rawBody: req.rawBody,
    });
  }
}

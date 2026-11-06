import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './controllers/payment-webhook.controller';
import { PaymentWebhookService } from './services/payment-webhook.service';
import { PaymentSettlementService } from './services/payment-settlement.service';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { PAYMENT_PROVIDERS } from './providers/payment-provider.interface';
import { PaymentOrder } from './entities/payment-orders.entity';
import { WalletModule } from '../wallet/wallet.module';

/**
 * To plug in a gateway, implement PaymentProvider and add it to the
 * PAYMENT_PROVIDERS list below (use useFactory to inject ConfigService).
 * No adapter ships by default, so order creation returns 503 until one is
 * registered; webhooks for unknown providers return 404.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrder]), WalletModule],
  providers: [
    PaymentService,
    PaymentWebhookService,
    PaymentSettlementService,
    PaymentProviderRegistry,
    { provide: PAYMENT_PROVIDERS, useValue: [] },
  ],
  controllers: [PaymentController, PaymentWebhookController],
  exports: [PaymentProviderRegistry],
})
export class PaymentModule {}

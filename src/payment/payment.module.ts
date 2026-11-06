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
import { PayPalPaymentProvider } from './providers/paypal-payment.provider';
import { DiscordPaymentService } from './services/discord-payment.service';
import { DiscordInteractionController } from './controllers/discord-interaction.controller';
import { PayPalReturnController } from './controllers/paypal-return.controller';

/**
 * The PayPal adapter is registered here. Discord interactions provide a
 * one-time order-code entry point; all coin settlement remains server-side.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrder]), WalletModule],
  providers: [
    PaymentService,
    PaymentWebhookService,
    PaymentSettlementService,
    PaymentProviderRegistry,
    DiscordPaymentService,
    PayPalPaymentProvider,
    {
      provide: PAYMENT_PROVIDERS,
      useFactory: (paypal: PayPalPaymentProvider) => [paypal],
      inject: [PayPalPaymentProvider],
    },
  ],
  controllers: [
    PaymentController,
    PaymentWebhookController,
    DiscordInteractionController,
    PayPalReturnController,
  ],
  exports: [PaymentProviderRegistry],
})
export class PaymentModule {}

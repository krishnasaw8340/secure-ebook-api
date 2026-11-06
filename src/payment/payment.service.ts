import {
  BadRequestException,
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, QueryFailedError, Repository } from 'typeorm';
import {
  PaymentOrder,
  PaymentOrderStatus,
} from './entities/payment-orders.entity';
import { CoinPackage } from '../wallet/entities/coin-package.entity';
import {
  CheckoutCaptureProvider,
  PaymentProvider,
} from './providers/payment-provider.interface';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { PaymentSettlementService } from './services/payment-settlement.service';
import { DiscordPaymentService } from './services/discord-payment.service';

export interface PaymentOrderView {
  id: string;
  status: PaymentOrderStatus;
  coinsAmount: number;
  priceAmount: string;
  currency: string;
  checkoutUrl: string | null;
  orderCode: string | null;
  discordUrl: string | null;
  expiresAt: Date;
  completedAt: Date | null;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentOrder)
    private readonly orders: Repository<PaymentOrder>,
    @InjectRepository(CoinPackage)
    private readonly packages: Repository<CoinPackage>,
    private readonly registry: PaymentProviderRegistry,
    private readonly config: ConfigService,
    private readonly settlement: PaymentSettlementService,
    private readonly discord: DiscordPaymentService,
  ) {}

  async createOrder(
    userId: string,
    packageId: string,
  ): Promise<PaymentOrderView> {
    const provider = this.registry.getActive();
    if (!provider || provider.name !== 'paypal') {
      throw new ServiceUnavailableException(
        'PayPal payments are not available right now.',
      );
    }
    if (
      !this.config.get<string>('payment.publicApiUrl') ||
      !this.config.get<string>('payment.returnUrl') ||
      !this.config.get<string>('payment.paypalClientId') ||
      !this.config.get<string>('payment.paypalClientSecret') ||
      !this.config.get<string>('payment.paypalWebhookId')
    ) {
      throw new ServiceUnavailableException(
        'Payment setup is incomplete. Please contact support.',
      );
    }

    const pkg = await this.packages.findOne({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) throw new NotFoundException('Coin package not found');

    const ttlMinutes = this.config.get<number>('payment.orderTtlMinutes', 20);
    const maxPending = this.config.get<number>(
      'payment.maxPendingOrdersPerUser',
      5,
    );

    // Throttle abandoned checkouts per user.
    const now = new Date();
    const pending = await this.orders.count({
      where: { userId, status: PaymentOrderStatus.PENDING },
    });
    if (pending >= maxPending) {
      await this.expireStale(userId, now);
      const stillPending = await this.orders.count({
        where: { userId, status: PaymentOrderStatus.PENDING },
      });
      if (stillPending >= maxPending) {
        throw new HttpException(
          'Too many pending orders. Complete or wait for them to expire.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    await this.discord.ensurePaymentMessage();
    const orderData = {
      userId,
      packageId: pkg.id,
      coinsAmount: pkg.coins,
      priceAmount: pkg.priceAmount,
      currency: pkg.currency.toUpperCase(),
      provider: provider.name,
      status: PaymentOrderStatus.PENDING,
      expiresAt: new Date(now.getTime() + ttlMinutes * 60_000),
      providerOrderId: null,
      providerPaymentId: null,
      checkoutUrl: null,
      orderCode: null,
      codeRedeemedAt: null,
      failureReason: null,
      completedAt: null,
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderCode = this.generateOrderCode();
      try {
        const order = await this.orders.save(
          this.orders.create({ ...orderData, orderCode }),
        );
        return this.toView(order);
      } catch (error) {
        if (this.isOrderCodeConflict(error)) continue;
        throw error;
      }
    }
    throw new ServiceUnavailableException(
      'Could not create a unique payment code. Please retry.',
    );
  }

  async redeemOrderCode(rawCode: string): Promise<PaymentOrderView> {
    const orderCode = rawCode.trim().toUpperCase();
    if (!/^KY-[0-9A-F]{12}$/.test(orderCode)) {
      throw new NotFoundException('Payment order code not found');
    }
    const provider = this.registry.get('paypal');
    if (!provider || !this.isCaptureProvider(provider)) {
      throw new ServiceUnavailableException(
        'PayPal payments are not available right now.',
      );
    }

    const outcome = await this.orders.manager.transaction(async (manager) => {
      const order = await manager.findOne(PaymentOrder, {
        where: { orderCode },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) return { error: 'not-found' as const };
      if (order.status !== PaymentOrderStatus.PENDING) {
        return { error: 'not-pending' as const };
      }
      if (order.expiresAt.getTime() <= Date.now()) {
        order.status = PaymentOrderStatus.EXPIRED;
        await manager.save(PaymentOrder, order);
        return { error: 'expired' as const };
      }
      if (order.codeRedeemedAt) return { error: 'redeemed' as const };

      try {
        const apiUrl = this.config.get<string>('payment.publicApiUrl');
        const frontendUrl = this.config.get<string>('payment.returnUrl');
        if (!apiUrl || !frontendUrl) {
          throw new ServiceUnavailableException(
            'Payment return URLs are not configured.',
          );
        }
        const returnUrl = new URL('/api/payment/paypal/return', apiUrl);
        returnUrl.searchParams.set('orderId', order.id);
        const session = await provider.createCheckout({
          orderId: order.id,
          amount: order.priceAmount,
          currency: order.currency,
          description: `${order.coinsAmount} coins`,
          returnUrl: returnUrl.toString(),
          cancelUrl: frontendUrl,
          expiresAt: order.expiresAt,
        });
        order.providerOrderId = session.providerOrderId;
        order.checkoutUrl = session.checkoutUrl;
        order.codeRedeemedAt = new Date();
        await manager.save(PaymentOrder, order);
        return { order };
      } catch (error) {
        this.logger.error(
          `PayPal checkout creation failed for order ${order.id}`,
          error instanceof Error ? error.stack : String(error),
        );
        if (error instanceof HttpException) throw error;
        throw new BadGatewayException(
          'Could not start PayPal checkout. Please retry.',
        );
      }
    });

    if ('error' in outcome) {
      if (outcome.error === 'expired') {
        throw new BadRequestException('This payment code has expired.');
      }
      if (outcome.error === 'redeemed') {
        throw new BadRequestException(
          'This payment code has already been used.',
        );
      }
      if (outcome.error === 'not-pending') {
        throw new BadRequestException(
          'This payment order is no longer active.',
        );
      }
      throw new NotFoundException('Payment order code not found');
    }
    return this.toView(outcome.order);
  }

  async captureApprovedOrder(
    orderId: string,
    providerOrderId: string,
  ): Promise<PaymentOrderView> {
    const order = await this.orders.findOne({
      where: { id: orderId, provider: 'paypal' },
    });
    if (!order || order.providerOrderId !== providerOrderId) {
      throw new NotFoundException('Payment order not found');
    }
    if (order.status === PaymentOrderStatus.COMPLETED) {
      return this.toView(order);
    }
    if (
      order.status !== PaymentOrderStatus.PENDING &&
      order.status !== PaymentOrderStatus.EXPIRED
    ) {
      throw new BadRequestException('This payment order is no longer active.');
    }

    const provider = this.registry.get(order.provider);
    if (!provider || !this.isCaptureProvider(provider)) {
      throw new ServiceUnavailableException(
        'PayPal payments are not available right now.',
      );
    }

    const event = await provider.captureCheckout(providerOrderId, order.id);
    await this.settlement.settle(provider.name, event);
    const settledOrder = await this.orders.findOneOrFail({
      where: { id: order.id },
    });
    if (settledOrder.status !== PaymentOrderStatus.COMPLETED) {
      throw new BadGatewayException(
        'PayPal confirmed an unexpected payment result.',
      );
    }
    return this.toView(settledOrder);
  }

  async getOrderStatus(
    userId: string,
    orderId: string,
  ): Promise<PaymentOrderView> {
    let order = await this.orders.findOne({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');

    if (
      order.status === PaymentOrderStatus.PENDING &&
      order.expiresAt.getTime() < Date.now()
    ) {
      // Conditional update: never overwrites a status the webhook just set.
      await this.orders.update(
        { id: order.id, status: PaymentOrderStatus.PENDING },
        { status: PaymentOrderStatus.EXPIRED },
      );
      order = await this.orders.findOneOrFail({
        where: { id: orderId, userId },
      });
    }
    return this.toView(order);
  }

  private async expireStale(userId: string, now: Date): Promise<void> {
    await this.orders.update(
      { userId, status: PaymentOrderStatus.PENDING, expiresAt: LessThan(now) },
      { status: PaymentOrderStatus.EXPIRED },
    );
  }

  private toView(order: PaymentOrder): PaymentOrderView {
    return {
      id: order.id,
      status: order.status,
      coinsAmount: order.coinsAmount,
      priceAmount: order.priceAmount,
      currency: order.currency,
      checkoutUrl: order.checkoutUrl,
      orderCode: order.orderCode,
      discordUrl: this.discord.getPaymentChannelUrl(),
      expiresAt: order.expiresAt,
      completedAt: order.completedAt,
    };
  }

  private generateOrderCode(): string {
    return `KY-${randomBytes(6).toString('hex').toUpperCase()}`;
  }

  private isOrderCodeConflict(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error.driverError as { constraint?: string }).constraint ===
        'UQ_payment_orders_order_code'
    );
  }

  private isCaptureProvider(
    provider: PaymentProvider,
  ): provider is CheckoutCaptureProvider {
    return 'captureCheckout' in provider;
  }
}

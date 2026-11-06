import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  PaymentOrder,
  PaymentOrderStatus,
} from './entities/payment-orders.entity';
import { CoinPackage } from '../wallet/entities/coin-package.entity';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

export interface PaymentOrderView {
  id: string;
  status: PaymentOrderStatus;
  coinsAmount: number;
  priceAmount: string;
  currency: string;
  checkoutUrl: string | null;
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
  ) {}

  async createOrder(
    userId: string,
    packageId: string,
  ): Promise<PaymentOrderView> {
    const provider = this.registry.getActive();
    if (!provider) {
      throw new ServiceUnavailableException(
        'Payments are not available right now.',
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

    const order = await this.orders.save(
      this.orders.create({
        userId,
        packageId: pkg.id,
        coinsAmount: pkg.coins,
        priceAmount: pkg.priceAmount,
        currency: pkg.currency.toUpperCase(),
        provider: provider.name,
        status: PaymentOrderStatus.PENDING,
        expiresAt: new Date(now.getTime() + ttlMinutes * 60_000),
      }),
    );

    try {
      const session = await provider.createCheckout({
        orderId: order.id,
        amount: order.priceAmount,
        currency: order.currency,
        description: `${pkg.name} (${pkg.coins} coins)`,
        returnUrl: this.config.get<string>('payment.returnUrl'),
        expiresAt: order.expiresAt,
      });
      order.providerOrderId = session.providerOrderId;
      order.checkoutUrl = session.checkoutUrl;
      await this.orders.save(order);
    } catch (err) {
      this.logger.error(`Checkout creation failed for order ${order.id}`, err);
      order.status = PaymentOrderStatus.FAILED;
      order.failureReason = 'Checkout creation failed';
      await this.orders.save(order);
      throw new BadGatewayException('Could not start checkout. Please retry.');
    }

    return this.toView(order);
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
      expiresAt: order.expiresAt,
      completedAt: order.completedAt,
    };
  }
}

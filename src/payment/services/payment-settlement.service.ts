import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  PaymentOrder,
  PaymentOrderStatus,
} from '../entities/payment-orders.entity';
import { CoinTransactionType } from '../../wallet/entities/coin-transaction.entity';
import { WalletService } from '../../wallet/wallet.service';
import { NormalizedPaymentEvent } from '../providers/payment-provider.interface';
import { amountsEqual } from '../utils/money.util';

export type SettlementOutcome =
  | 'COMPLETED'
  | 'DUPLICATE'
  | 'UNKNOWN_ORDER'
  | 'MISMATCH'
  | 'FAILED_RECORDED'
  | 'IGNORED';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Statuses from which a verified successful payment may still be credited. */
const CREDITABLE: PaymentOrderStatus[] = [
  PaymentOrderStatus.PENDING,
  // Buyer paid just after our local TTL elapsed: money was taken, so credit.
  PaymentOrderStatus.EXPIRED,
];

@Injectable()
export class PaymentSettlementService {
  private readonly logger = new Logger(PaymentSettlementService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly walletService: WalletService,
  ) {}

  async settle(
    providerName: string,
    event: NormalizedPaymentEvent,
  ): Promise<SettlementOutcome> {
    if (!UUID_RE.test(event.orderId)) {
      this.logger.warn(`Event ${event.eventId}: malformed order id`);
      return 'UNKNOWN_ORDER';
    }
    return event.type === 'PAYMENT_SUCCEEDED'
      ? this.settleSuccess(providerName, event)
      : this.recordFailure(providerName, event);
  }

  /**
   * One ACID transaction:
   *   lock order row -> idempotency check -> validate amount/currency/provider
   *   -> mark COMPLETED -> credit wallet + ledger row (unique idempotency key).
   * Any thrown error rolls the whole thing back, so there is never a
   * COMPLETED order without coins, or coins without a COMPLETED order.
   */
  private settleSuccess(
    providerName: string,
    event: NormalizedPaymentEvent,
  ): Promise<SettlementOutcome> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(PaymentOrder, {
        where: { id: event.orderId, provider: providerName },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) return 'UNKNOWN_ORDER';

      if (order.status === PaymentOrderStatus.COMPLETED) {
        return 'DUPLICATE';
      }
      if (!CREDITABLE.includes(order.status)) {
        this.logger.warn(
          `Order ${order.id} is ${order.status}; ignoring success event ${event.eventId}`,
        );
        return 'IGNORED';
      }

      const mismatch = this.findMismatch(order, event);
      if (mismatch) {
        this.logger.error(
          `Order ${order.id} NOT credited (event ${event.eventId}): ${mismatch}`,
        );
        order.status = PaymentOrderStatus.FAILED;
        order.failureReason = mismatch.slice(0, 255);
        await manager.save(PaymentOrder, order);
        return 'MISMATCH';
      }

      order.status = PaymentOrderStatus.COMPLETED;
      order.providerPaymentId = event.providerPaymentId;
      order.providerOrderId =
        order.providerOrderId ?? event.providerOrderId ?? null;
      order.completedAt = new Date();
      order.failureReason = null;
      await manager.save(PaymentOrder, order);

      await this.walletService.creditWithManager(manager, {
        userId: order.userId,
        amount: order.coinsAmount,
        type: CoinTransactionType.RECHARGE,
        orderId: order.id,
        idempotencyKey: `${providerName}:${event.providerPaymentId}`,
      });

      return 'COMPLETED';
    });
  }

  private recordFailure(
    providerName: string,
    event: NormalizedPaymentEvent,
  ): Promise<SettlementOutcome> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(PaymentOrder, {
        where: { id: event.orderId, provider: providerName },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) return 'UNKNOWN_ORDER';
      if (order.status !== PaymentOrderStatus.PENDING) return 'IGNORED';

      order.status = PaymentOrderStatus.FAILED;
      order.failureReason = (event.failureReason ?? 'Payment failed').slice(
        0,
        255,
      );
      await manager.save(PaymentOrder, order);
      return 'FAILED_RECORDED';
    });
  }

  private findMismatch(
    order: PaymentOrder,
    event: NormalizedPaymentEvent,
  ): string | null {
    if (!amountsEqual(order.priceAmount, event.amount)) {
      return `amount mismatch (expected ${order.priceAmount}, got ${event.amount})`;
    }
    if (order.currency.toUpperCase() !== event.currency.toUpperCase()) {
      return `currency mismatch (expected ${order.currency}, got ${event.currency})`;
    }
    if (
      order.providerOrderId &&
      event.providerOrderId &&
      order.providerOrderId !== event.providerOrderId
    ) {
      return 'provider order id mismatch';
    }
    if (!event.providerPaymentId) {
      return 'missing provider payment id';
    }
    return null;
  }
}

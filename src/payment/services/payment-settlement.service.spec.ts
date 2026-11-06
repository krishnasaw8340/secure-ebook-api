import { PaymentSettlementService } from './payment-settlement.service';
import {
  PaymentOrder,
  PaymentOrderStatus,
} from '../entities/payment-orders.entity';
import { NormalizedPaymentEvent } from '../providers/payment-provider.interface';

const ORDER_ID = '11111111-1111-4111-8111-111111111111';

function makeOrder(overrides: Partial<PaymentOrder> = {}): PaymentOrder {
  return {
    id: ORDER_ID,
    userId: 'user-1',
    coinsAmount: 500,
    priceAmount: '4.99',
    currency: 'USD',
    provider: 'fake',
    providerOrderId: 'po-1',
    status: PaymentOrderStatus.PENDING,
    ...overrides,
  } as PaymentOrder;
}

function makeEvent(
  overrides: Partial<NormalizedPaymentEvent> = {},
): NormalizedPaymentEvent {
  return {
    eventId: 'evt-1',
    type: 'PAYMENT_SUCCEEDED',
    orderId: ORDER_ID,
    providerOrderId: 'po-1',
    providerPaymentId: 'cap-1',
    amount: '4.99',
    currency: 'USD',
    ...overrides,
  };
}

function setup(order: PaymentOrder | null) {
  const manager = {
    findOne: jest.fn().mockResolvedValue(order),
    save: jest
      .fn()
      .mockImplementation((_e: unknown, o: unknown) => Promise.resolve(o)),
  };
  const dataSource = {
    transaction: (fn: (m: typeof manager) => Promise<unknown>) => fn(manager),
  };
  const wallet = {
    creditWithManager: jest
      .fn()
      .mockResolvedValue({ credited: true, balance: 500 }),
  };
  const service = new PaymentSettlementService(
    dataSource as never,
    wallet as never,
  );
  return { service, wallet, manager };
}

describe('PaymentSettlementService', () => {
  it('credits exactly once when the same event is delivered twice', async () => {
    const order = makeOrder();
    const { service, wallet } = setup(order);

    expect(await service.settle('fake', makeEvent())).toBe('COMPLETED');
    expect(await service.settle('fake', makeEvent())).toBe('DUPLICATE');

    expect(wallet.creditWithManager).toHaveBeenCalledTimes(1);
    expect(wallet.creditWithManager.mock.calls[0][1]).toMatchObject({
      amount: 500,
      idempotencyKey: 'fake:cap-1',
    });
  });

  it('does not credit when the amount differs', async () => {
    const order = makeOrder();
    const { service, wallet } = setup(order);
    expect(await service.settle('fake', makeEvent({ amount: '0.01' }))).toBe(
      'MISMATCH',
    );
    expect(order.status).toBe(PaymentOrderStatus.FAILED);
    expect(wallet.creditWithManager).not.toHaveBeenCalled();
  });

  it('does not credit when the currency differs', async () => {
    const { service, wallet } = setup(makeOrder());
    expect(await service.settle('fake', makeEvent({ currency: 'EUR' }))).toBe(
      'MISMATCH',
    );
    expect(wallet.creditWithManager).not.toHaveBeenCalled();
  });

  it('credits a late payment for an EXPIRED order', async () => {
    const { service, wallet } = setup(
      makeOrder({ status: PaymentOrderStatus.EXPIRED }),
    );
    expect(await service.settle('fake', makeEvent())).toBe('COMPLETED');
    expect(wallet.creditWithManager).toHaveBeenCalledTimes(1);
  });

  it('ignores unknown orders and malformed ids', async () => {
    const { service, wallet } = setup(null);
    expect(await service.settle('fake', makeEvent())).toBe('UNKNOWN_ORDER');
    expect(
      await service.settle('fake', makeEvent({ orderId: 'not-a-uuid' })),
    ).toBe('UNKNOWN_ORDER');
    expect(wallet.creditWithManager).not.toHaveBeenCalled();
  });
});

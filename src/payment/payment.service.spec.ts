import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import {
  PaymentOrder,
  PaymentOrderStatus,
} from './entities/payment-orders.entity';

describe('PaymentService', () => {
  it('returns 503 when no provider adapter is registered', async () => {
    const registry = {
      getActive: () => undefined,
    } as unknown as PaymentProviderRegistry;
    const service = new PaymentService(
      {} as never,
      {} as never,
      registry,
      {
        get: jest.fn(),
      } as never,
      {} as never,
      {} as never,
    );
    await expect(service.createOrder('u1', 'p1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('records the Discord user who redeems a website order code', async () => {
    const order = {
      id: 'order-1',
      orderCode: 'KY-0123456789AB',
      userId: 'user-1',
      coinsAmount: 500,
      priceAmount: '4.99',
      currency: 'USD',
      status: PaymentOrderStatus.PENDING,
      provider: 'paypal',
      providerOrderId: null,
      checkoutUrl: null,
      expiresAt: new Date(Date.now() + 60_000),
      codeRedeemedAt: null,
      completedAt: null,
      discordUserId: null,
    };
    const txManager = {
      findOne: jest.fn().mockResolvedValue(order),
      save: jest.fn().mockResolvedValue(order),
    };
    const provider = {
      createCheckout: jest.fn().mockResolvedValue({
        providerOrderId: 'paypal-order-1',
        checkoutUrl: 'https://paypal.example/checkout',
      }),
      captureCheckout: jest.fn(),
    };
    const registry = {
      get: jest.fn().mockReturnValue(provider),
    } as unknown as PaymentProviderRegistry;
    const service = new PaymentService(
      {
        manager: {
          transaction: (callback: (manager: typeof txManager) => unknown) =>
            callback(txManager),
        },
      } as never,
      {} as never,
      registry,
      {
        get: jest.fn((key: string) =>
          key === 'payment.publicApiUrl'
            ? 'https://api.example'
            : key === 'payment.returnUrl'
              ? 'https://example.com/wallet'
              : undefined,
        ),
      } as never,
      {} as never,
      {
        getPaymentChannelUrl: () => 'https://discord.com/channels/1/2',
      } as never,
    );

    const result = await service.redeemOrderCode(
      'KY-0123456789AB',
      '12345678901234567',
    );

    expect(result.checkoutUrl).toBe('https://paypal.example/checkout');
    expect(order.discordUserId).toBe('12345678901234567');
    expect(txManager.save).toHaveBeenCalledWith(PaymentOrder, order);
  });

  it('rejects invalid Discord user IDs for order-code redemption', async () => {
    const service = new PaymentService(
      {} as never,
      {} as never,
      {} as PaymentProviderRegistry,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.redeemOrderCode('KY-0123456789AB', 'invalid'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

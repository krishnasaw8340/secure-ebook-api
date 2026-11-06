import { ServiceUnavailableException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

describe('PaymentService', () => {
  it('returns 503 when no provider adapter is registered', async () => {
    const registry = {
      getActive: () => undefined,
    } as unknown as PaymentProviderRegistry;
    const service = new PaymentService({} as never, {} as never, registry, {
      get: jest.fn(),
    } as never);
    await expect(service.createOrder('u1', 'p1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

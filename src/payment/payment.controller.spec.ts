import { UnauthorizedException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  const controller = new PaymentController({} as PaymentService);

  it('rejects order creation without an authenticated user', () => {
    expect(() => controller.createOrder({ packageId: 'x' })).toThrow(
      UnauthorizedException,
    );
  });
});

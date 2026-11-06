import { PayPalPaymentProvider } from './paypal-payment.provider';
import { RawWebhookRequest } from './payment-provider.interface';

describe('PayPalPaymentProvider', () => {
  const provider = new PayPalPaymentProvider({ get: jest.fn() } as never);

  it('normalizes completed capture webhook events', () => {
    const request: RawWebhookRequest = {
      headers: {},
      rawBody: Buffer.from(
        JSON.stringify({
          id: 'WH-1',
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: 'CAP-1',
            custom_id: '11111111-1111-4111-8111-111111111111',
            amount: { value: '4.99', currency_code: 'USD' },
            supplementary_data: {
              related_ids: { order_id: 'PAYPAL-ORDER-1' },
            },
          },
        }),
      ),
    };

    expect(provider.parseWebhook(request)).toEqual({
      eventId: 'WH-1',
      type: 'PAYMENT_SUCCEEDED',
      orderId: '11111111-1111-4111-8111-111111111111',
      providerOrderId: 'PAYPAL-ORDER-1',
      providerPaymentId: 'CAP-1',
      amount: '4.99',
      currency: 'USD',
      failureReason: undefined,
    });
  });

  it('ignores events that are not capture success or denial', () => {
    const request: RawWebhookRequest = {
      headers: {},
      rawBody: Buffer.from(
        JSON.stringify({
          id: 'WH-2',
          event_type: 'CHECKOUT.ORDER.APPROVED',
          resource: {},
        }),
      ),
    };

    expect(provider.parseWebhook(request)).toBeNull();
  });
});

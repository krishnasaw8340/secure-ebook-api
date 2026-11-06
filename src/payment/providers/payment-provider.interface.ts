/**
 * Provider-agnostic contract. A concrete gateway adapter (hosted-checkout
 * provider, crypto gateway, ...) implements this interface and is registered
 * under the PAYMENT_PROVIDERS token in PaymentModule. Nothing else in the
 * payment core knows about any specific gateway.
 */

export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');

export interface CheckoutRequest {
  /** Our internal PaymentOrder id. Adapters MUST round-trip it to webhooks. */
  orderId: string;
  /** Decimal string with 2 fraction digits, e.g. "4.99". */
  amount: string;
  /** ISO-4217 uppercase, e.g. "USD". */
  currency: string;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
  expiresAt: Date;
}

export interface CheckoutSession {
  providerOrderId: string;
  checkoutUrl: string;
}

export interface RawWebhookRequest {
  /** Lower-cased header names. */
  headers: Record<string, string | string[] | undefined>;
  /** Exact bytes received; signatures must be computed over these. */
  rawBody: Buffer;
}

export type PaymentEventType = 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED';

export interface NormalizedPaymentEvent {
  /** Provider event id, for logging/audit. */
  eventId: string;
  type: PaymentEventType;
  /** Our internal PaymentOrder id (echoed back by the provider). */
  orderId: string;
  providerOrderId?: string;
  /** Provider's unique id for the money movement (capture/charge id). */
  providerPaymentId: string;
  /** Decimal string, e.g. "4.99". */
  amount: string;
  currency: string;
  failureReason?: string;
}

export interface PaymentProvider {
  /** Stable lowercase identifier, used in the webhook URL and DB column. */
  readonly name: string;

  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;

  /**
   * Cryptographically verify the request really came from the provider.
   * Must be constant-time and must return false (never throw) on mismatch.
   */
  verifyWebhook(request: RawWebhookRequest): Promise<boolean>;

  /**
   * Map a VERIFIED webhook to a normalized event, or null for event types we
   * do not act on.
   */
  parseWebhook(request: RawWebhookRequest): NormalizedPaymentEvent | null;
}

export interface CheckoutCaptureProvider extends PaymentProvider {
  /** Capture a buyer-approved checkout and normalize the verified API result. */
  captureCheckout(
    providerOrderId: string,
    orderId: string,
  ): Promise<NormalizedPaymentEvent>;
}

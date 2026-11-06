import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CheckoutCaptureProvider,
  CheckoutRequest,
  CheckoutSession,
  NormalizedPaymentEvent,
  RawWebhookRequest,
} from './payment-provider.interface';

interface PayPalCapture {
  id?: string;
  status?: string;
  amount?: { value?: string; currency_code?: string };
  custom_id?: string;
  invoice_id?: string;
  supplementary_data?: { related_ids?: { order_id?: string } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class PayPalPaymentProvider implements CheckoutCaptureProvider {
  readonly name = 'paypal';
  private readonly logger = new Logger(PayPalPaymentProvider.name);
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {}

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!request.returnUrl || !request.cancelUrl) {
      throw new Error('PayPal return and cancel URLs must be configured');
    }

    const result = await this.request<{
      id?: string;
      links?: { href?: string; rel?: string }[];
    }>('/v2/checkout/orders', {
      method: 'POST',
      headers: { 'PayPal-Request-Id': request.orderId },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: request.orderId,
            custom_id: request.orderId,
            invoice_id: request.orderId,
            description: request.description.slice(0, 127),
            amount: {
              currency_code: request.currency,
              value: request.amount,
            },
          },
        ],
        application_context: {
          return_url: request.returnUrl,
          cancel_url: request.cancelUrl,
          user_action: 'PAY_NOW',
        },
      }),
    });

    const approveUrl = result.links?.find(
      (link) => link.rel === 'approve',
    )?.href;
    if (!result.id || !approveUrl) {
      throw new Error('PayPal did not return an approval URL');
    }
    return { providerOrderId: result.id, checkoutUrl: approveUrl };
  }

  async captureCheckout(
    providerOrderId: string,
    orderId: string,
  ): Promise<NormalizedPaymentEvent> {
    const result = await this.request<{
      id?: string;
      status?: string;
      purchase_units?: {
        payments?: { captures?: PayPalCapture[] };
      }[];
    }>(`/v2/checkout/orders/${encodeURIComponent(providerOrderId)}/capture`, {
      method: 'POST',
      headers: { 'PayPal-Request-Id': `${providerOrderId}-capture` },
      body: '{}',
    });

    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    if (result.status !== 'COMPLETED' || capture?.status !== 'COMPLETED') {
      throw new Error('PayPal has not completed this payment');
    }
    const amount = capture.amount?.value;
    const currency = capture.amount?.currency_code;
    if (!capture.id || !amount || !currency) {
      throw new Error('PayPal returned an incomplete capture');
    }

    return {
      eventId: capture.id,
      type: 'PAYMENT_SUCCEEDED',
      orderId,
      providerOrderId: result.id ?? providerOrderId,
      providerPaymentId: capture.id,
      amount,
      currency,
    };
  }

  async verifyWebhook(request: RawWebhookRequest): Promise<boolean> {
    const webhookId = this.config.get<string>('payment.paypalWebhookId');
    if (!webhookId) {
      this.logger.error('PAYPAL_WEBHOOK_ID is not configured');
      return false;
    }

    const header = (name: string) => {
      const value = request.headers[name];
      return Array.isArray(value) ? value[0] : value;
    };
    const transmissionId = header('paypal-transmission-id');
    const transmissionSig = header('paypal-transmission-sig');
    const transmissionTime = header('paypal-transmission-time');
    const authAlgo = header('paypal-auth-algo');
    const certUrl = header('paypal-cert-url');

    if (
      !transmissionId ||
      !transmissionSig ||
      !transmissionTime ||
      !authAlgo ||
      !certUrl
    ) {
      return false;
    }
    let parsedCertUrl: URL;
    try {
      parsedCertUrl = new URL(certUrl);
    } catch {
      return false;
    }
    if (
      parsedCertUrl.protocol !== 'https:' ||
      !parsedCertUrl.hostname.toLowerCase().endsWith('.paypal.com') ||
      !parsedCertUrl.pathname.startsWith('/v1/notifications/certs/')
    ) {
      return false;
    }

    let webhookEvent: unknown;
    try {
      webhookEvent = JSON.parse(request.rawBody.toString('utf8'));
    } catch {
      return false;
    }

    try {
      const result = await this.request<{ verification_status?: string }>(
        '/v1/notifications/verify-webhook-signature',
        {
          method: 'POST',
          body: JSON.stringify({
            auth_algo: authAlgo,
            cert_url: certUrl,
            transmission_id: transmissionId,
            transmission_sig: transmissionSig,
            transmission_time: transmissionTime,
            webhook_id: webhookId,
            webhook_event: webhookEvent,
          }),
        },
      );
      return result.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error(
        'Could not verify PayPal webhook signature',
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  parseWebhook(request: RawWebhookRequest): NormalizedPaymentEvent | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(request.rawBody.toString('utf8'));
    } catch {
      return null;
    }
    if (!isRecord(parsed)) return null;

    const type =
      parsed.event_type === 'PAYMENT.CAPTURE.COMPLETED'
        ? 'PAYMENT_SUCCEEDED'
        : parsed.event_type === 'PAYMENT.CAPTURE.DENIED'
          ? 'PAYMENT_FAILED'
          : null;
    const resource = isRecord(parsed.resource) ? parsed.resource : null;
    const amountRecord = isRecord(resource?.amount) ? resource.amount : null;
    const relatedIds = isRecord(resource?.supplementary_data)
      ? resource.supplementary_data.related_ids
      : null;
    const relatedOrderId = isRecord(relatedIds)
      ? relatedIds.order_id
      : undefined;
    const eventId = typeof parsed.id === 'string' ? parsed.id : null;
    const captureId = typeof resource?.id === 'string' ? resource.id : null;
    const orderId =
      typeof resource?.custom_id === 'string'
        ? resource.custom_id
        : typeof resource?.invoice_id === 'string'
          ? resource.invoice_id
          : null;
    const amount =
      typeof amountRecord?.value === 'string' ? amountRecord.value : null;
    const currency =
      typeof amountRecord?.currency_code === 'string'
        ? amountRecord.currency_code
        : null;
    if (!type || !eventId || !orderId || !captureId || !amount || !currency) {
      return null;
    }

    return {
      eventId,
      type,
      orderId,
      providerOrderId:
        typeof relatedOrderId === 'string' ? relatedOrderId : undefined,
      providerPaymentId: captureId,
      amount,
      currency,
      failureReason:
        type === 'PAYMENT_FAILED' ? 'PayPal capture denied' : undefined,
    };
  }

  private async request<T>(
    path: string,
    init: { method: string; body: string; headers?: Record<string, string> },
  ): Promise<T> {
    const baseUrl =
      this.config.get<string>('payment.paypalBaseUrl') ??
      'https://api-m.sandbox.paypal.com';
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      this.logger.error(
        `PayPal API request failed with status ${response.status}`,
      );
      throw new Error(`PayPal API request failed (${response.status})`);
    }
    return (await response.json()) as T;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt - 30_000) {
      return this.accessToken;
    }
    const clientId = this.config.get<string>('payment.paypalClientId');
    const clientSecret = this.config.get<string>('payment.paypalClientSecret');
    if (!clientId || !clientSecret) {
      throw new Error('PayPal client credentials are not configured');
    }

    const baseUrl =
      this.config.get<string>('payment.paypalBaseUrl') ??
      'https://api-m.sandbox.paypal.com';
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, '')}/v1/oauth2/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) {
      this.logger.error(
        `PayPal access-token request failed with status ${response.status}`,
      );
      throw new Error(`PayPal authentication failed (${response.status})`);
    }
    const token = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!token.access_token) throw new Error('PayPal returned no access token');
    this.accessToken = token.access_token;
    this.accessTokenExpiresAt =
      Date.now() + Math.max(0, token.expires_in ?? 0) * 1000;
    return this.accessToken;
  }
}

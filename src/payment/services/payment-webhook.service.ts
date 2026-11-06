import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentProviderRegistry } from '../providers/payment-provider.registry';
import { RawWebhookRequest } from '../providers/payment-provider.interface';
import {
  PaymentSettlementService,
  SettlementOutcome,
} from './payment-settlement.service';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly registry: PaymentProviderRegistry,
    private readonly settlement: PaymentSettlementService,
  ) {}

  async handle(
    providerName: string,
    request: RawWebhookRequest,
  ): Promise<{
    received: true;
    outcome: SettlementOutcome | 'NOT_ACTIONABLE';
  }> {
    const provider = this.registry.get(providerName);
    if (!provider) throw new NotFoundException('Unknown payment provider');

    // 1. Authenticate first. Nothing below runs for a spoofed request.
    let verified = false;
    try {
      verified = await provider.verifyWebhook(request);
    } catch (err) {
      this.logger.error(`Webhook verification threw for ${providerName}`, err);
    }
    if (!verified) {
      this.logger.warn(
        `Rejected webhook with invalid signature (${providerName})`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Normalize, then 3. settle atomically and idempotently.
    const event = provider.parseWebhook(request);
    if (!event) return { received: true, outcome: 'NOT_ACTIONABLE' };

    const outcome = await this.settlement.settle(provider.name, event);
    this.logger.log(`Webhook ${event.eventId} (${providerName}) -> ${outcome}`);
    return { received: true, outcome };
  }
}

import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_PROVIDERS,
  PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers = new Map<string, PaymentProvider>();

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(PAYMENT_PROVIDERS)
    providers: PaymentProvider[] = [],
  ) {
    for (const provider of providers) {
      this.providers.set(provider.name.toLowerCase(), provider);
    }
  }

  get(name: string): PaymentProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  /** Provider used for new orders: PAYMENT_PROVIDER, or the only one registered. */
  getActive(): PaymentProvider | undefined {
    const configured = this.config.get<string>('payment.provider');
    if (configured) return this.get(configured);
    return this.providers.size === 1
      ? [...this.providers.values()][0]
      : undefined;
  }

  hasProviders(): boolean {
    return this.providers.size > 0;
  }
}

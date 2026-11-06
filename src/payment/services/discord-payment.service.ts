import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DISCORD_API = 'https://discord.com/api/v10';
const ENTER_CODE_BUTTON_ID = 'enter_order_code';

@Injectable()
export class DiscordPaymentService {
  private readonly logger = new Logger(DiscordPaymentService.name);
  private paymentMessageReady = false;

  constructor(private readonly config: ConfigService) {}

  getPaymentChannelUrl(): string | null {
    const serverId = this.config.get<string>('payment.discordServerId');
    const channelId = this.config.get<string>(
      'payment.discordPaymentChannelId',
    );
    if (!serverId || !channelId) return null;
    return `https://discord.com/channels/${serverId}/${channelId}`;
  }

  async ensurePaymentMessage(): Promise<void> {
    if (this.paymentMessageReady) return;
    if (
      !this.config.get<string>('payment.discordApplicationId') ||
      !this.config.get<string>('payment.discordApplicationPublicKey')
    ) {
      throw new ServiceUnavailableException(
        'Discord application is not configured.',
      );
    }
    const channelId = this.config.get<string>(
      'payment.discordPaymentChannelId',
    );
    if (!channelId || !this.getPaymentChannelUrl()) {
      throw new ServiceUnavailableException(
        'Discord payment channel is not configured.',
      );
    }

    const messages = await this.request<
      { id: string; components?: { components?: { custom_id?: string }[] }[] }[]
    >(`/channels/${channelId}/messages?limit=100`, { method: 'GET' });
    const existing = messages.find((message) =>
      message.components?.some((row) =>
        row.components?.some(
          (component) => component.custom_id === ENTER_CODE_BUTTON_ID,
        ),
      ),
    );
    const body = {
      content:
        '**KuroYomi Coin Payments**\nCreate an order on the website, then enter its one-time code here to receive a private PayPal checkout link.',
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: 'Enter Order Code',
              custom_id: ENTER_CODE_BUTTON_ID,
              emoji: { name: '💳' },
            },
          ],
        },
      ],
    };

    if (existing) {
      await this.request(`/channels/${channelId}/messages/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    } else {
      await this.request(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    this.paymentMessageReady = true;
  }

  async updateInteractionResponse(
    interactionToken: string,
    body: {
      content: string;
      components?: {
        type: number;
        components: {
          type: number;
          style: number;
          label: string;
          url: string;
        }[];
      }[];
    },
  ): Promise<void> {
    const applicationId = this.config.get<string>(
      'payment.discordApplicationId',
    );
    if (!applicationId) {
      throw new ServiceUnavailableException(
        'Discord application is not configured.',
      );
    }
    await this.request(
      `/webhooks/${applicationId}/${encodeURIComponent(interactionToken)}/messages/@original`,
      { method: 'PATCH', body: JSON.stringify(body), auth: false },
    );
  }

  private async request<T = void>(
    path: string,
    init: { method: string; body?: string; auth?: boolean },
  ): Promise<T> {
    const { auth, ...requestInit } = init;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth !== false) {
      const token = this.config.get<string>('payment.discordBotToken');
      if (!token) {
        throw new ServiceUnavailableException(
          'Discord payment bot is not configured.',
        );
      }
      headers.Authorization = `Bot ${token}`;
    }
    const response = await fetch(`${DISCORD_API}${path}`, {
      ...requestInit,
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      this.logger.error(
        `Discord API request failed with status ${response.status}`,
      );
      throw new ServiceUnavailableException(
        'Discord payment setup is unavailable.',
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

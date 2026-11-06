import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import type { Request } from 'express';
import { createPublicKey, verify } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from '../payment.service';
import { DiscordPaymentService } from '../services/discord-payment.service';

interface DiscordInteraction {
  type?: number;
  token?: string;
  data?: {
    custom_id?: string;
    components?: {
      components?: { custom_id?: string; value?: string }[];
    }[];
  };
}

@Public()
@Controller('payment/discord')
export class DiscordInteractionController {
  private readonly logger = new Logger(DiscordInteractionController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly paymentService: PaymentService,
    private readonly discord: DiscordPaymentService,
  ) {}

  @Post('interactions')
  @HttpCode(200)
  handle(
    @Req() req: RawBodyRequest<Request>,
    @Body() interaction: DiscordInteraction,
  ) {
    if (!req.rawBody) throw new BadRequestException('Missing request body');
    this.verifyRequest(req);

    if (interaction.type === 1) return { type: 1 };
    if (
      interaction.type === 3 &&
      interaction.data?.custom_id === 'enter_order_code'
    ) {
      return this.orderCodeModal();
    }
    if (
      interaction.type === 5 &&
      interaction.data?.custom_id === 'redeem_order_code' &&
      interaction.token
    ) {
      const code = interaction.data.components
        ?.flatMap((row) => row.components ?? [])
        .find((component) => component.custom_id === 'order_code')?.value;
      if (!code) {
        return {
          type: 4,
          data: {
            flags: 64,
            content: 'Enter the order code from your wallet.',
          },
        };
      }

      void this.finishCodeRedemption(code, interaction.token);
      return { type: 5, data: { flags: 64 } };
    }

    return {
      type: 4,
      data: { flags: 64, content: 'This payment action is not supported.' },
    };
  }

  private orderCodeModal() {
    return {
      type: 9,
      data: {
        custom_id: 'redeem_order_code',
        title: 'Enter your order code',
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: 'order_code',
                style: 1,
                label: 'One-time code',
                min_length: 15,
                max_length: 15,
                placeholder: 'KY-A1B2C3D4E5F6',
                required: true,
              },
            ],
          },
        ],
      },
    };
  }

  private async finishCodeRedemption(
    rawCode: string,
    interactionToken: string,
  ): Promise<void> {
    try {
      const order = await this.paymentService.redeemOrderCode(rawCode);
      if (!order.checkoutUrl) {
        throw new Error('PayPal checkout URL was not created');
      }
      const amount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: order.currency,
      }).format(Number(order.priceAmount));
      await this.discord.updateInteractionResponse(interactionToken, {
        content: `Order #${order.orderCode}: ${order.coinsAmount} Coins (${amount})`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: 'Pay with PayPal',
                url: order.checkoutUrl,
              },
            ],
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        'Could not redeem a Discord payment code',
        error instanceof Error ? error.stack : String(error),
      );
      try {
        await this.discord.updateInteractionResponse(interactionToken, {
          content:
            'This code could not be used. Check it and make sure the order has not expired or already been redeemed.',
        });
      } catch (updateError) {
        this.logger.error(
          'Could not update the Discord interaction response',
          updateError instanceof Error
            ? updateError.stack
            : String(updateError),
        );
      }
    }
  }

  private verifyRequest(req: RawBodyRequest<Request>): void {
    if (!req.rawBody) throw new BadRequestException('Missing request body');
    const publicKeyHex = this.config.get<string>(
      'payment.discordApplicationPublicKey',
    );
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    if (
      !publicKeyHex ||
      typeof signature !== 'string' ||
      typeof timestamp !== 'string' ||
      !/^[0-9a-f]{128}$/i.test(signature) ||
      !/^\d+$/.test(timestamp) ||
      Math.abs(Date.now() - Number(timestamp) * 1000) > 5 * 60_000
    ) {
      throw new UnauthorizedException('Invalid Discord interaction signature');
    }

    const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
    const key = createPublicKey({
      key: Buffer.concat([spkiPrefix, Buffer.from(publicKeyHex, 'hex')]),
      format: 'der',
      type: 'spki',
    });
    const valid = verify(
      null,
      Buffer.concat([Buffer.from(timestamp), req.rawBody]),
      key,
      Buffer.from(signature, 'hex'),
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid Discord interaction signature');
    }
  }
}

import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  /** Name of the adapter used for new orders (optional if only one exists). */
  provider: process.env.PAYMENT_PROVIDER,
  orderTtlMinutes: Number(process.env.PAYMENT_ORDER_TTL_MINUTES || 20),
  maxPendingOrdersPerUser: Number(process.env.PAYMENT_MAX_PENDING_ORDERS || 5),
  /** Where the provider sends the buyer after checkout (frontend wallet page). */
  returnUrl: process.env.PAYMENT_RETURN_URL,
  publicApiUrl: process.env.PAYMENT_PUBLIC_API_URL,
  paypalBaseUrl:
    process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com',
  paypalClientId: process.env.PAYPAL_CLIENT_ID,
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID,
  discordBotToken: process.env.DISCORD_BOT_TOKEN,
  discordApplicationId: process.env.DISCORD_APPLICATION_ID,
  discordApplicationPublicKey: process.env.DISCORD_APPLICATION_PUBLIC_KEY,
  discordServerId: process.env.DISCORD_SERVER_ID,
  discordPaymentChannelId: process.env.DISCORD_PAYMENT_CHANNEL_ID,
  /** One-time free coins granted on a user's first login. 0 disables. */
  welcomeBonusCoins: Number(process.env.WELCOME_BONUS_COINS ?? 200),
}));

import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  /** Name of the adapter used for new orders (optional if only one exists). */
  provider: process.env.PAYMENT_PROVIDER,
  orderTtlMinutes: Number(process.env.PAYMENT_ORDER_TTL_MINUTES || 20),
  maxPendingOrdersPerUser: Number(process.env.PAYMENT_MAX_PENDING_ORDERS || 5),
  /** Where the provider sends the buyer after checkout (frontend wallet page). */
  returnUrl: process.env.PAYMENT_RETURN_URL,
  /** One-time free coins granted on a user's first login. 0 disables. */
  welcomeBonusCoins: Number(process.env.WELCOME_BONUS_COINS ?? 200),
}));

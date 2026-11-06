import * as Joi from 'joi';
const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .required(),
  APP_NAME: Joi.string().required(),
  PORT: Joi.number().default(3000),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

  // Mail
  MAIL_HOST: Joi.string().allow('').optional(),
  MAIL_PORT: Joi.number().optional(),
  MAIL_USER: Joi.string().allow('').optional(),
  MAIL_USERNAME: Joi.string().allow('').optional(),
  MAIL_PASSWORD: Joi.string().allow('').optional(),
  MAIL_SECURE: Joi.boolean().optional(),
  MAIL_FROM: Joi.string().allow('').optional(),

  // PayPal and Discord payment flow
  PAYMENT_PROVIDER: Joi.string().allow('').optional(),
  PAYMENT_ORDER_TTL_MINUTES: Joi.number().min(1).default(20),
  PAYMENT_MAX_PENDING_ORDERS: Joi.number().min(1).default(5),
  PAYMENT_RETURN_URL: Joi.string().uri().allow('').optional(),
  PAYMENT_PUBLIC_API_URL: Joi.string().uri().allow('').optional(),
  PAYPAL_BASE_URL: Joi.alternatives().conditional('NODE_ENV', {
    is: 'production',
    then: Joi.string().uri().required(),
    otherwise: Joi.string().uri().allow('').optional(),
  }),
  PAYPAL_CLIENT_ID: Joi.string().allow('').optional(),
  PAYPAL_CLIENT_SECRET: Joi.string().allow('').optional(),
  PAYPAL_WEBHOOK_ID: Joi.string().allow('').optional(),
  DISCORD_BOT_TOKEN: Joi.string().allow('').optional(),
  DISCORD_APPLICATION_ID: Joi.string().allow('').optional(),
  DISCORD_APPLICATION_PUBLIC_KEY: Joi.string()
    .allow('')
    .hex()
    .length(64)
    .optional(),
  DISCORD_SERVER_ID: Joi.string().allow('').optional(),
  DISCORD_PAYMENT_CHANNEL_ID: Joi.string().allow('').optional(),
  WELCOME_BONUS_COINS: Joi.number().integer().min(0).default(200),
  RAZORPAY_KEY: Joi.string().allow('').optional(),
  RAZORPAY_SECRET: Joi.string().allow('').optional(),

  // AWS S3
  AWS_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  AWS_REGION: Joi.string().default('ap-south-1'),
  AWS_S3_BUCKET: Joi.string().allow('').optional(),
  MAX_CHAPTER_PDF_SIZE_MB: Joi.number().default(200),
  MAX_BOOK_COVER_SIZE_MB: Joi.number().default(10),
});
export default validationSchema;

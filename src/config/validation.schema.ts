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
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().optional(),
  MAIL_USER: Joi.string().optional(),
  MAIL_USERNAME: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_SECURE: Joi.boolean().optional(),
  MAIL_FROM: Joi.string().optional(),

  // Payment (optional until implemented)
  RAZORPAY_KEY: Joi.string().optional(),
  RAZORPAY_SECRET: Joi.string().optional(),

  // AWS S3
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().default('ap-south-1'),
  AWS_S3_BUCKET: Joi.string().optional(),
  MAX_CHAPTER_PDF_SIZE_MB: Joi.number().default(200),
});
export default validationSchema;

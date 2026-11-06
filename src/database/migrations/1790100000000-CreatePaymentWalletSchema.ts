import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentWalletSchema1790100000000 implements MigrationInterface {
  name = 'CreatePaymentWalletSchema1790100000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE SCHEMA IF NOT EXISTS "wallet"`);
    await q.query(`CREATE SCHEMA IF NOT EXISTS "payment"`);

    await q.query(
      `CREATE TYPE "wallet"."coin_transactions_type_enum" AS ENUM('RECHARGE','UNLOCK','REFUND')`,
    );
    await q.query(
      `CREATE TYPE "payment"."payment_orders_status_enum" AS ENUM('PENDING','COMPLETED','FAILED','EXPIRED')`,
    );

    await q.query(`CREATE TABLE "wallet"."coin_packages" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "name" character varying(100) NOT NULL,
      "coins" integer NOT NULL,
      "price_amount" numeric(10,2) NOT NULL,
      "currency" character varying(3) NOT NULL,
      "is_active" boolean NOT NULL DEFAULT true,
      "sort_order" integer NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_coin_packages" PRIMARY KEY ("id"),
      CONSTRAINT "CHK_coin_packages_coins_positive" CHECK ("coins" > 0),
      CONSTRAINT "CHK_coin_packages_price_positive" CHECK ("price_amount" > 0)
    )`);

    await q.query(`CREATE TABLE "wallet"."wallets" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "user_id" uuid NOT NULL,
      "balance" integer NOT NULL DEFAULT 0,
      "version" integer NOT NULL DEFAULT 1,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_wallets" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_wallets_user_id" UNIQUE ("user_id"),
      CONSTRAINT "CHK_wallets_balance_non_negative" CHECK ("balance" >= 0),
      CONSTRAINT "FK_wallets_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
    )`);

    await q.query(`CREATE TABLE "payment"."payment_orders" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "user_id" uuid NOT NULL,
      "package_id" uuid NOT NULL,
      "coins_amount" integer NOT NULL,
      "price_amount" numeric(10,2) NOT NULL,
      "currency" character varying(3) NOT NULL,
      "status" "payment"."payment_orders_status_enum" NOT NULL DEFAULT 'PENDING',
      "provider" character varying(50) NOT NULL,
      "provider_order_id" character varying(128),
      "provider_payment_id" character varying(128),
      "checkout_url" text,
      "failure_reason" character varying(255),
      "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
      "completed_at" TIMESTAMP WITH TIME ZONE,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_payment_orders" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_payment_orders_provider_order" UNIQUE ("provider","provider_order_id"),
      CONSTRAINT "UQ_payment_orders_provider_payment" UNIQUE ("provider","provider_payment_id"),
      CONSTRAINT "CHK_payment_orders_coins_positive" CHECK ("coins_amount" > 0),
      CONSTRAINT "FK_payment_orders_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_payment_orders_package" FOREIGN KEY ("package_id") REFERENCES "wallet"."coin_packages"("id") ON DELETE RESTRICT
    )`);
    await q.query(
      `CREATE INDEX "IDX_payment_orders_user_id" ON "payment"."payment_orders" ("user_id")`,
    );
    await q.query(
      `CREATE INDEX "IDX_payment_orders_status" ON "payment"."payment_orders" ("status")`,
    );

    await q.query(`CREATE TABLE "wallet"."coin_transactions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "user_id" uuid NOT NULL,
      "order_id" uuid,
      "amount" integer NOT NULL,
      "balance_after" integer NOT NULL,
      "type" "wallet"."coin_transactions_type_enum" NOT NULL,
      "idempotency_key" character varying(191) NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_coin_transactions" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_coin_transactions_idempotency_key" UNIQUE ("idempotency_key"),
      CONSTRAINT "CHK_coin_transactions_balance_after" CHECK ("balance_after" >= 0),
      CONSTRAINT "FK_coin_transactions_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_coin_transactions_order" FOREIGN KEY ("order_id") REFERENCES "payment"."payment_orders"("id") ON DELETE SET NULL
    )`);
    await q.query(
      `CREATE INDEX "IDX_coin_transactions_user_id" ON "wallet"."coin_transactions" ("user_id", "created_at" DESC)`,
    );
    await q.query(
      `CREATE INDEX "IDX_coin_transactions_order_id" ON "wallet"."coin_transactions" ("order_id")`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "wallet"."coin_transactions"`);
    await q.query(`DROP TABLE "payment"."payment_orders"`);
    await q.query(`DROP TABLE "wallet"."wallets"`);
    await q.query(`DROP TABLE "wallet"."coin_packages"`);
    await q.query(`DROP TYPE "payment"."payment_orders_status_enum"`);
    await q.query(`DROP TYPE "wallet"."coin_transactions_type_enum"`);
    await q.query(`DROP SCHEMA "payment"`);
    await q.query(`DROP SCHEMA "wallet"`);
  }
}

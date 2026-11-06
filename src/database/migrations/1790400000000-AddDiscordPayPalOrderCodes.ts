import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscordPayPalOrderCodes1790400000000 implements MigrationInterface {
  name = 'AddDiscordPayPalOrderCodes1790400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment"."payment_orders"
        ADD COLUMN "order_code" character varying(15),
        ADD COLUMN "code_redeemed_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "payment"."payment_orders"
        ADD CONSTRAINT "UQ_payment_orders_order_code" UNIQUE ("order_code")
    `);

    await queryRunner.query(`
      INSERT INTO "wallet"."coin_packages"
        ("id", "name", "coins", "price_amount", "currency", "is_active", "sort_order")
      VALUES
        ('17903000-0000-4000-8000-000000000001', 'Starter', 500, 4.99, 'USD', true, 1),
        ('17903000-0000-4000-8000-000000000002', 'Popular', 1200, 9.99, 'USD', true, 2),
        ('17903000-0000-4000-8000-000000000003', 'Premium', 3500, 24.99, 'USD', true, 3),
        ('17903000-0000-4000-8000-000000000004', 'Ultimate', 8000, 49.99, 'USD', true, 4)
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "coins" = EXCLUDED."coins",
        "price_amount" = EXCLUDED."price_amount",
        "currency" = EXCLUDED."currency",
        "is_active" = EXCLUDED."is_active",
        "sort_order" = EXCLUDED."sort_order",
        "updated_at" = now()
    `);
  }

  public async down(): Promise<void> {
    // Keep package and order data so payment history and foreign keys remain valid.
  }
}

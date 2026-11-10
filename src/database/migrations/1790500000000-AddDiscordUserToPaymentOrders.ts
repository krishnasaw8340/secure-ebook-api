import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscordUserToPaymentOrders1790500000000 implements MigrationInterface {
  name = 'AddDiscordUserToPaymentOrders1790500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment"."payment_orders"
        ADD COLUMN IF NOT EXISTS "discord_user_id" character varying(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment"."payment_orders"
        DROP COLUMN IF EXISTS "discord_user_id"
    `);
  }
}

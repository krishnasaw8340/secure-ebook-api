import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBonusCoinTransactionType1790200000000 implements MigrationInterface {
  name = 'AddBonusCoinTransactionType1790200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "wallet"."coin_transactions_type_enum" ADD VALUE IF NOT EXISTS 'BONUS'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot drop an enum value; 'BONUS' is left in place (harmless).
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCoinPackages1790300000000 implements MigrationInterface {
  name = 'SeedCoinPackages1790300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "wallet"."coin_packages"
        ("id", "name", "coins", "price_amount", "currency", "is_active", "sort_order")
      VALUES
        ('17903000-0000-4000-8000-000000000001', 'Starter', 200, 8.99, 'USD', true, 1),
        ('17903000-0000-4000-8000-000000000002', 'Popular', 350, 10.99, 'USD', true, 2),
        ('17903000-0000-4000-8000-000000000003', 'Premium', 1000, 24.99, 'USD', true, 3),
        ('17903000-0000-4000-8000-000000000004', 'Ultimate', 2400, 49.99, 'USD', true, 4)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Keep package rows so existing payment orders retain their package references.
  }
}

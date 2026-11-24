import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChapterWebpPages1790500000000 implements MigrationInterface {
  name = 'AddChapterWebpPages1790500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "pages" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "page_count" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN "page_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN "pages"`,
    );
  }
}

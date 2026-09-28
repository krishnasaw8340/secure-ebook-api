import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateToChapterPdfContent1789900000000 implements MigrationInterface {
  name = 'MigrateToChapterPdfContent1789900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Safety check before dropping pages table
    const tableExists = await queryRunner.hasTable('catalog.pages');
    if (tableExists) {
      const pageCountResult = (await queryRunner.query(
        `SELECT COUNT(*) as count FROM "catalog"."pages"`,
      )) as Array<{ count?: string }>;
      const rawCount = pageCountResult[0]?.count ?? '0';
      const pageCount = parseInt(rawCount, 10);
      if (pageCount > 0) {
        throw new Error(
          `Migration aborted: "catalog.pages" contains ${pageCount} records. Manual backup or migration required.`,
        );
      }

      // Drop FK constraints & indexes on pages
      await queryRunner.query(
        `ALTER TABLE "catalog"."pages" DROP CONSTRAINT IF EXISTS "FK_87a6e61d6c13a63ffd7b225b627"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "catalog"."IDX_e606ad6d4964c257fe4a9595b9"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "catalog"."IDX_a11b53322cf9265d9c6e57853b"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "catalog"."IDX_87a6e61d6c13a63ffd7b225b62"`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS "catalog"."pages"`);
    }

    // 2. Revise catalog.chapters for PDF metadata & monetization
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN IF EXISTS "free_page_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN IF EXISTS "page_count"`,
    );

    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "pdf_storage_key" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "pdf_file_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "pdf_file_size" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "pdf_page_count" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "pdf_checksum" character varying(64)`,
    );

    await queryRunner.query(
      `CREATE TYPE "catalog"."chapters_content_status_enum" AS ENUM('PENDING', 'READY', 'FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "content_status" "catalog"."chapters_content_status_enum" NOT NULL DEFAULT 'PENDING'`,
    );

    // Update chapter pricing enum (remove PARTIAL_FREE)
    await queryRunner.query(
      `UPDATE "catalog"."chapters" SET "pricing_model" = 'PAID' WHERE "pricing_model"::text = 'PARTIAL_FREE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ALTER COLUMN "pricing_model" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ALTER COLUMN "pricing_model" TYPE text USING "pricing_model"::text`,
    );
    await queryRunner.query(
      `DROP TYPE "catalog"."chapters_pricing_model_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "catalog"."chapters_pricing_model_enum" AS ENUM('FREE', 'PAID')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ALTER COLUMN "pricing_model" TYPE "catalog"."chapters_pricing_model_enum" USING "pricing_model"::"catalog"."chapters_pricing_model_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ALTER COLUMN "pricing_model" SET DEFAULT 'FREE'`,
    );

    // 3. Revise catalog.books for chapter-based pricing
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN IF EXISTS "default_coin_per_page"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN IF EXISTS "default_free_pages"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN IF EXISTS "total_pages"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "default_chapter_coin_cost" integer NOT NULL DEFAULT 0`,
    );

    // Update book pricing enum (remove PER_PAGE)
    await queryRunner.query(
      `UPDATE "catalog"."books" SET "pricing_model" = 'PER_CHAPTER' WHERE "pricing_model"::text = 'PER_PAGE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ALTER COLUMN "pricing_model" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ALTER COLUMN "pricing_model" TYPE text USING "pricing_model"::text`,
    );
    await queryRunner.query(`DROP TYPE "catalog"."books_pricing_model_enum"`);
    await queryRunner.query(
      `CREATE TYPE "catalog"."books_pricing_model_enum" AS ENUM('FREE', 'PER_CHAPTER', 'PER_BOOK', 'SUBSCRIPTION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ALTER COLUMN "pricing_model" TYPE "catalog"."books_pricing_model_enum" USING "pricing_model"::"catalog"."books_pricing_model_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ALTER COLUMN "pricing_model" SET DEFAULT 'FREE'`,
    );

    // 4. Create catalog.chapter_unlocks table
    await queryRunner.query(
      `CREATE TABLE "catalog"."chapter_unlocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "chapter_id" uuid NOT NULL,
        "coins_paid" integer NOT NULL DEFAULT 0,
        "source" character varying(50) NOT NULL DEFAULT 'COIN_PURCHASE',
        "unlocked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_chapter_unlocks_user_chapter" UNIQUE ("user_id", "chapter_id"),
        CONSTRAINT "PK_chapter_unlocks_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_chapter_unlocks_user_id" ON "catalog"."chapter_unlocks" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chapter_unlocks_chapter_id" ON "catalog"."chapter_unlocks" ("chapter_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapter_unlocks" ADD CONSTRAINT "FK_chapter_unlocks_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapter_unlocks" ADD CONSTRAINT "FK_chapter_unlocks_chapter_id" FOREIGN KEY ("chapter_id") REFERENCES "catalog"."chapters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop chapter_unlocks
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapter_unlocks" DROP CONSTRAINT IF EXISTS "FK_chapter_unlocks_chapter_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapter_unlocks" DROP CONSTRAINT IF EXISTS "FK_chapter_unlocks_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "catalog"."IDX_chapter_unlocks_chapter_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "catalog"."IDX_chapter_unlocks_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "catalog"."chapter_unlocks"`);

    // 2. Revert book pricing fields
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN IF EXISTS "default_chapter_coin_cost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "total_pages" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "default_free_pages" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "default_coin_per_page" integer NOT NULL DEFAULT 0`,
    );

    // Revert book pricing enum
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ALTER COLUMN "pricing_model" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ALTER COLUMN "pricing_model" TYPE text USING "pricing_model"::text`,
    );
    await queryRunner.query(`DROP TYPE "catalog"."books_pricing_model_enum"`);
    await queryRunner.query(
      `CREATE TYPE "catalog"."books_pricing_model_enum" AS ENUM('FREE', 'PER_PAGE', 'PER_CHAPTER', 'PER_BOOK', 'SUBSCRIPTION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ALTER COLUMN "pricing_model" TYPE "catalog"."books_pricing_model_enum" USING "pricing_model"::"catalog"."books_pricing_model_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ALTER COLUMN "pricing_model" SET DEFAULT 'FREE'`,
    );

    // 3. Revert chapters fields
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN IF EXISTS "content_status"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "catalog"."chapters_content_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN IF EXISTS "pdf_checksum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN IF EXISTS "pdf_page_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN IF EXISTS "pdf_file_size"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN IF EXISTS "pdf_file_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" DROP COLUMN IF EXISTS "pdf_storage_key"`,
    );

    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "page_count" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ADD "free_page_count" integer NOT NULL DEFAULT 0`,
    );

    // Revert chapter pricing enum
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ALTER COLUMN "pricing_model" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ALTER COLUMN "pricing_model" TYPE text USING "pricing_model"::text`,
    );
    await queryRunner.query(
      `DROP TYPE "catalog"."chapters_pricing_model_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "catalog"."chapters_pricing_model_enum" AS ENUM('FREE', 'PARTIAL_FREE', 'PAID')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ALTER COLUMN "pricing_model" TYPE "catalog"."chapters_pricing_model_enum" USING "pricing_model"::"catalog"."chapters_pricing_model_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."chapters" ALTER COLUMN "pricing_model" SET DEFAULT 'FREE'`,
    );

    // 4. Recreate pages table
    await queryRunner.query(
      `CREATE TABLE "catalog"."pages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "chapter_id" uuid NOT NULL,
        "page_number" integer NOT NULL,
        "sort_order" integer NOT NULL DEFAULT '0',
        "storage_key" character varying(500) NOT NULL,
        "encrypted_key" character varying(500),
        "width" integer,
        "height" integer,
        "mime_type" character varying(50),
        "file_size" integer,
        "checksum" character varying(64),
        CONSTRAINT "UQ_c63f3da6bdfa01492b1b6b3ee2f" UNIQUE ("chapter_id", "page_number"),
        CONSTRAINT "PK_8f21ed625aa34c8391d636b7d3b" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87a6e61d6c13a63ffd7b225b62" ON "catalog"."pages" ("chapter_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a11b53322cf9265d9c6e57853b" ON "catalog"."pages" ("sort_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e606ad6d4964c257fe4a9595b9" ON "catalog"."pages" ("chapter_id", "sort_order")`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."pages" ADD CONSTRAINT "FK_87a6e61d6c13a63ffd7b225b627" FOREIGN KEY ("chapter_id") REFERENCES "catalog"."chapters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}

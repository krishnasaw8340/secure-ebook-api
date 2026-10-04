import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookCoverMetadata1790000000000 implements MigrationInterface {
  name = 'AddBookCoverMetadata1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "cover_storage_key" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "cover_file_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "cover_file_size" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "cover_content_type" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" ADD "cover_etag" character varying(128)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN "cover_etag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN "cover_content_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN "cover_file_size"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN "cover_file_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog"."books" DROP COLUMN "cover_storage_key"`,
    );
  }
}

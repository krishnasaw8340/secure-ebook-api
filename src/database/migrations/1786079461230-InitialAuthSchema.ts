import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialAuthSchema1786079461230 implements MigrationInterface {
    name = 'InitialAuthSchema1786079461230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "auth"`);
        await queryRunner.query(`CREATE TYPE "auth"."roles_name_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'USER')`);
        await queryRunner.query(`CREATE TABLE "auth"."roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" "auth"."roles_name_enum" NOT NULL, "description" character varying(255), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth"."user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "role_id" uuid NOT NULL, "assigned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_23ed6f04fe43066df08379fd034" UNIQUE ("user_id", "role_id"), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth"."refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "token_hash" character varying NOT NULL, "device_name" character varying(100), "ip_address" character varying(45), "user_agent" text, "last_used_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "auth"."refresh_tokens"  ("user_id") `);
        await queryRunner.query(`CREATE TYPE "auth"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TABLE "auth"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(150) NOT NULL, "username" character varying(150) NOT NULL, "password" character varying NOT NULL, "full_name" character varying(150) NOT NULL, "avatar_url" character varying, "is_email_verified" boolean NOT NULL DEFAULT false, "status" "auth"."users_status_enum" NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "auth"."otp_verifications_purpose_enum" AS ENUM('REGISTER', 'LOGIN', 'FORGOT_PASSWORD')`);
        await queryRunner.query(`CREATE TABLE "auth"."otp_verifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, "email" character varying(150) NOT NULL, "otp_code" character varying(255) NOT NULL, "purpose" "auth"."otp_verifications_purpose_enum" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "verified" boolean NOT NULL DEFAULT false, "verified_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_91d17e75ac3182dba6701869b39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c7f1d281e1acc51e2a37889f5a" ON "auth"."otp_verifications"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e13f2874d645c0cd9964d06008" ON "auth"."otp_verifications"  ("email") `);
        await queryRunner.query(`ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth"."otp_verifications" ADD CONSTRAINT "FK_c7f1d281e1acc51e2a37889f5a9" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth"."otp_verifications" DROP CONSTRAINT "FK_c7f1d281e1acc51e2a37889f5a9"`);
        await queryRunner.query(`ALTER TABLE "auth"."refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "auth"."user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "auth"."user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`DROP INDEX "auth"."IDX_e13f2874d645c0cd9964d06008"`);
        await queryRunner.query(`DROP INDEX "auth"."IDX_c7f1d281e1acc51e2a37889f5a"`);
        await queryRunner.query(`DROP TABLE "auth"."otp_verifications"`);
        await queryRunner.query(`DROP TYPE "auth"."otp_verifications_purpose_enum"`);
        await queryRunner.query(`DROP TABLE "auth"."users"`);
        await queryRunner.query(`DROP TYPE "auth"."users_status_enum"`);
        await queryRunner.query(`DROP INDEX "auth"."IDX_3ddc983c5f7bcf132fd8732c3f"`);
        await queryRunner.query(`DROP TABLE "auth"."refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "auth"."user_roles"`);
        await queryRunner.query(`DROP TABLE "auth"."roles"`);
        await queryRunner.query(`DROP TYPE "auth"."roles_name_enum"`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "auth"`);
    }

}

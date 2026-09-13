import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Login switches from email+password to name+password. Email is kept as an
 * optional field (still unique when actually given) - Postgres allows any
 * number of NULLs alongside a UNIQUE constraint, so "unique" and "optional"
 * aren't in conflict.
 */
export class MakeNameUniqueEmailOptional1787400000000 implements MigrationInterface {
  name = 'MakeNameUniqueEmailOptional1787400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_name" UNIQUE ("name")`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_name"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1787141896946 implements MigrationInterface {
    name = 'InitSchema1787141896946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."shopping_trips_status_enum" AS ENUM('active', 'done')`);
        await queryRunner.query(`CREATE TABLE "shopping_trips" ("id" uuid NOT NULL, "startedById" uuid NOT NULL, "status" "public"."shopping_trips_status_enum" NOT NULL, "startedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e2fd0333cdfff7e97654057ea0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."trip_stops_status_enum" AS ENUM('active', 'done')`);
        await queryRunner.query(`CREATE TABLE "trip_stops" ("id" uuid NOT NULL, "tripId" uuid NOT NULL, "shopId" uuid NOT NULL, "status" "public"."trip_stops_status_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_876633f878970267cb0dc525984" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shops" ("id" uuid NOT NULL, "name" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3c6aaa6607d287de99815e60b96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL, "name" text NOT NULL, "preferredShopId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('wishOnTrip', 'wishAddedToActiveTrip', 'wishRetracted', 'wishNotFound')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL, "wishId" uuid NOT NULL, "recipientId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e2f84f6c87460c75721bd93ac7" ON "notifications" ("recipientId", "read") `);
        await queryRunner.query(`CREATE TYPE "public"."wishes_status_enum" AS ENUM('open', 'onTrip', 'purchased', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "wishes" ("id" uuid NOT NULL, "productId" uuid NOT NULL, "createdById" uuid NOT NULL, "assignedTripStopId" uuid, "status" "public"."wishes_status_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c08d144e42ca0aa37a024597ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2641ef9cf450110188ba0dd32f" ON "wishes" ("status", "createdById") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "email" text NOT NULL, "name" text NOT NULL, "passwordHash" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shopping_trips" ADD CONSTRAINT "FK_97ecd9ca6d23d2edbd8d6b603b7" FOREIGN KEY ("startedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trip_stops" ADD CONSTRAINT "FK_37cc2e3103d3ad66b08b7ba220d" FOREIGN KEY ("tripId") REFERENCES "shopping_trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trip_stops" ADD CONSTRAINT "FK_394e28511377688e99e073a953d" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_25190c46f3b2a32f6a5938d790a" FOREIGN KEY ("preferredShopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_1b66fdb45664ade76cac7ccbd08" FOREIGN KEY ("wishId") REFERENCES "wishes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wishes" ADD CONSTRAINT "FK_95215d774cbe2079c9d90560dc5" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wishes" ADD CONSTRAINT "FK_2c4d2bafa7c2aa8e1601d7aa0e8" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wishes" ADD CONSTRAINT "FK_7caa8672ad03159a65ad60f358b" FOREIGN KEY ("assignedTripStopId") REFERENCES "trip_stops"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wishes" DROP CONSTRAINT "FK_7caa8672ad03159a65ad60f358b"`);
        await queryRunner.query(`ALTER TABLE "wishes" DROP CONSTRAINT "FK_2c4d2bafa7c2aa8e1601d7aa0e8"`);
        await queryRunner.query(`ALTER TABLE "wishes" DROP CONSTRAINT "FK_95215d774cbe2079c9d90560dc5"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_1b66fdb45664ade76cac7ccbd08"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_25190c46f3b2a32f6a5938d790a"`);
        await queryRunner.query(`ALTER TABLE "trip_stops" DROP CONSTRAINT "FK_394e28511377688e99e073a953d"`);
        await queryRunner.query(`ALTER TABLE "trip_stops" DROP CONSTRAINT "FK_37cc2e3103d3ad66b08b7ba220d"`);
        await queryRunner.query(`ALTER TABLE "shopping_trips" DROP CONSTRAINT "FK_97ecd9ca6d23d2edbd8d6b603b7"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2641ef9cf450110188ba0dd32f"`);
        await queryRunner.query(`DROP TABLE "wishes"`);
        await queryRunner.query(`DROP TYPE "public"."wishes_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e2f84f6c87460c75721bd93ac7"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "shops"`);
        await queryRunner.query(`DROP TABLE "trip_stops"`);
        await queryRunner.query(`DROP TYPE "public"."trip_stops_status_enum"`);
        await queryRunner.query(`DROP TABLE "shopping_trips"`);
        await queryRunner.query(`DROP TYPE "public"."shopping_trips_status_enum"`);
    }

}

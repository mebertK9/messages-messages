import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedShops1787300000000 implements MigrationInterface {
    name = 'SeedShops1787300000000'

    // Fixed ids so the seeded rows are reproducible across environments.
    private readonly shopIds = {
        rewe: '55555555-5555-4555-8555-555555555555',
        aldi: '66666666-6666-4666-8666-666666666666',
        dm: '77777777-7777-4777-8777-777777777777',
        edeka: '88888888-8888-4888-8888-888888888888',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO "shops" ("id", "name") VALUES
                ('${this.shopIds.rewe}', 'REWE'),
                ('${this.shopIds.aldi}', 'ALDI'),
                ('${this.shopIds.dm}', 'dm'),
                ('${this.shopIds.edeka}', 'EDEKA')`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "shops" WHERE "id" IN (
                '${this.shopIds.rewe}',
                '${this.shopIds.aldi}',
                '${this.shopIds.dm}',
                '${this.shopIds.edeka}'
            )`
        );
    }

}

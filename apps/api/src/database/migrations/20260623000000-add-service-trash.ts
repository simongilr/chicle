import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceTrash20260623000000 implements MigrationInterface {
  name = 'AddServiceTrash20260623000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE dynamic_services
        ADD COLUMN trashedAt datetime NULL,
        ADD COLUMN trashedByUserId varchar(180) NULL,
        ADD INDEX IDX_dynamic_services_tenant_trashed (tenantId, trashedAt)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE dynamic_services
        DROP INDEX IDX_dynamic_services_tenant_trashed,
        DROP COLUMN trashedByUserId,
        DROP COLUMN trashedAt
    `);
  }
}

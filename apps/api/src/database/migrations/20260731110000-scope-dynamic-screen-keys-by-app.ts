import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopeDynamicScreenKeysByApp20260731110000 implements MigrationInterface {
  name = 'ScopeDynamicScreenKeysByApp20260731110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const legacyIndex = await queryRunner.query(
      "SHOW INDEX FROM dynamic_screens WHERE Key_name = 'IDX_dynamic_screens_tenant_key'"
    );
    const scopedIndex = await queryRunner.query(
      "SHOW INDEX FROM dynamic_screens WHERE Key_name = 'IDX_dynamic_screens_tenant_app_key'"
    );
    if (legacyIndex.length) {
      await queryRunner.query('DROP INDEX IDX_dynamic_screens_tenant_key ON dynamic_screens');
    }
    if (!scopedIndex.length) {
      await queryRunner.query(
        'CREATE UNIQUE INDEX IDX_dynamic_screens_tenant_app_key ON dynamic_screens (tenantId, appId, `key`)'
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const scopedIndex = await queryRunner.query(
      "SHOW INDEX FROM dynamic_screens WHERE Key_name = 'IDX_dynamic_screens_tenant_app_key'"
    );
    const legacyIndex = await queryRunner.query(
      "SHOW INDEX FROM dynamic_screens WHERE Key_name = 'IDX_dynamic_screens_tenant_key'"
    );
    if (scopedIndex.length) {
      await queryRunner.query('DROP INDEX IDX_dynamic_screens_tenant_app_key ON dynamic_screens');
    }
    if (!legacyIndex.length) {
      await queryRunner.query(
        'CREATE UNIQUE INDEX IDX_dynamic_screens_tenant_key ON dynamic_screens (tenantId, `key`)'
      );
    }
  }
}

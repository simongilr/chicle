import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenFlowTemplateOwner20260702100000 implements MigrationInterface {
  name = 'HardenFlowTemplateOwner20260702100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE flow_templates ADD ownerKey varchar(36) NULL AFTER tenantId');
    await queryRunner.query(`
      UPDATE flow_templates
      SET ownerKey = COALESCE(tenantId, '00000000-0000-0000-0000-000000000000')
    `);
    await queryRunner.query('ALTER TABLE flow_templates MODIFY ownerKey varchar(36) NOT NULL');
    await queryRunner.query('DROP INDEX IDX_flow_templates_tenant_key ON flow_templates');
    await queryRunner.query('CREATE INDEX IDX_flow_templates_tenant_key ON flow_templates (tenantId, \`key\`)');
    await queryRunner.query('CREATE UNIQUE INDEX IDX_flow_templates_owner_key ON flow_templates (ownerKey, \`key\`)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IDX_flow_templates_owner_key ON flow_templates');
    await queryRunner.query('DROP INDEX IDX_flow_templates_tenant_key ON flow_templates');
    await queryRunner.query('CREATE UNIQUE INDEX IDX_flow_templates_tenant_key ON flow_templates (tenantId, \`key\`)');
    await queryRunner.query('ALTER TABLE flow_templates DROP COLUMN ownerKey');
  }
}

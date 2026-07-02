import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFlowTemplates20260702090000 implements MigrationInterface {
  name = 'CreateFlowTemplates20260702090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE flow_templates (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        description text NULL,
        category varchar(80) NULL,
        scope varchar(24) NOT NULL DEFAULT 'tenant',
        definition json NOT NULL,
        active tinyint NOT NULL DEFAULT 1,
        sourceFlowId varchar(36) NULL,
        createdByUserId varchar(180) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_flow_templates_tenant_key (tenantId, \`key\`),
        INDEX IDX_flow_templates_scope_active (scope, active),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE flow_templates');
  }
}

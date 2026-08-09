import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeclarativeComponents20260809120000 implements MigrationInterface {
  name = 'CreateDeclarativeComponents20260809120000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS component_definitions (
        id varchar(36) NOT NULL,
        componentKey varchar(140) NOT NULL,
        name varchar(180) NOT NULL,
        category varchar(80) NOT NULL,
        description text NULL,
        schemaVersion int NOT NULL DEFAULT 1,
        status varchar(24) NOT NULL DEFAULT 'active',
        propsSchema json NULL,
        eventsSchema json NULL,
        defaultProps json NULL,
        allowedChildren json NULL,
        documentation json NULL,
        metadata json NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_component_definitions_componentKey (componentKey),
        INDEX IDX_component_definitions_category (category),
        INDEX IDX_component_definitions_status (status),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS component_adapters (
        id varchar(36) NOT NULL,
        componentKey varchar(140) NOT NULL,
        kit varchar(32) NOT NULL,
        adapterStatus varchar(24) NOT NULL DEFAULT 'planned',
        technicalSelector varchar(180) NULL,
        importPath varchar(240) NULL,
        previewKey varchar(120) NULL,
        adapterMetadata json NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_component_adapters_key_kit (componentKey, kit),
        INDEX IDX_component_adapters_kit_status (kit, adapterStatus),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS dynamic_component_templates (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        description text NULL,
        category varchar(80) NULL,
        componentKey varchar(140) NOT NULL,
        contract json NOT NULL,
        version int NOT NULL DEFAULT 1,
        published tinyint NOT NULL DEFAULT 0,
        status varchar(24) NOT NULL DEFAULT 'draft',
        publishedVersionId varchar(36) NULL,
        metadata json NULL,
        tags json NULL,
        trashedAt datetime NULL,
        trashedByUserId varchar(180) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_dynamic_component_templates_tenant_key (tenantId, \`key\`),
        INDEX IDX_dynamic_component_templates_tenant_status (tenantId, status),
        INDEX IDX_dynamic_component_templates_tenant_trashed (tenantId, trashedAt),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS dynamic_component_template_versions (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        templateId varchar(36) NOT NULL,
        version int NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'draft',
        contract json NOT NULL,
        dependencySnapshot json NULL,
        createdByUserId varchar(180) NULL,
        publishedAt datetime NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_dynamic_component_template_versions_template_version (tenantId, templateId, version),
        INDEX IDX_dynamic_component_template_versions_template_status (tenantId, templateId, status),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS dynamic_component_template_versions');
    await queryRunner.query('DROP TABLE IF EXISTS dynamic_component_templates');
    await queryRunner.query('DROP TABLE IF EXISTS component_adapters');
    await queryRunner.query('DROP TABLE IF EXISTS component_definitions');
  }
}

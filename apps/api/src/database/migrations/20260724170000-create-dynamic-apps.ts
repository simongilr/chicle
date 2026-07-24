import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDynamicApps20260724170000 implements MigrationInterface {
  name = 'CreateDynamicApps20260724170000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE dynamic_apps (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        description text NULL,
        category varchar(80) NULL,
        targets json NOT NULL,
        manifest json NOT NULL,
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
        UNIQUE INDEX IDX_dynamic_apps_tenant_key (tenantId, \`key\`),
        INDEX IDX_dynamic_apps_tenant_status (tenantId, status),
        INDEX IDX_dynamic_apps_tenant_trashed (tenantId, trashedAt),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE dynamic_app_versions (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        appId varchar(36) NOT NULL,
        version int NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'draft',
        manifest json NOT NULL,
        dependencySnapshot json NULL,
        createdByUserId varchar(180) NULL,
        publishedAt datetime NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_dynamic_app_versions_app_version (appId, version),
        INDEX IDX_dynamic_app_versions_tenant_app (tenantId, appId),
        INDEX IDX_dynamic_app_versions_tenant_status (tenantId, status),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE dynamic_screens (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        appId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        title varchar(180) NOT NULL,
        description text NULL,
        route varchar(180) NULL,
        target varchar(32) NOT NULL DEFAULT 'multi',
        category varchar(80) NULL,
        sortOrder int NOT NULL DEFAULT 100,
        definition json NOT NULL,
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
        UNIQUE INDEX IDX_dynamic_screens_tenant_key (tenantId, \`key\`),
        INDEX IDX_dynamic_screens_tenant_app (tenantId, appId),
        INDEX IDX_dynamic_screens_tenant_status (tenantId, status),
        INDEX IDX_dynamic_screens_tenant_trashed (tenantId, trashedAt),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE dynamic_screen_versions (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        appId varchar(36) NOT NULL,
        screenId varchar(36) NOT NULL,
        version int NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'draft',
        definition json NOT NULL,
        dependencySnapshot json NULL,
        createdByUserId varchar(180) NULL,
        publishedAt datetime NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_dynamic_screen_versions_screen_version (screenId, version),
        INDEX IDX_dynamic_screen_versions_tenant_screen (tenantId, screenId),
        INDEX IDX_dynamic_screen_versions_tenant_app (tenantId, appId),
        INDEX IDX_dynamic_screen_versions_tenant_status (tenantId, status),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE dynamic_screen_versions');
    await queryRunner.query('DROP TABLE dynamic_screens');
    await queryRunner.query('DROP TABLE dynamic_app_versions');
    await queryRunner.query('DROP TABLE dynamic_apps');
  }
}

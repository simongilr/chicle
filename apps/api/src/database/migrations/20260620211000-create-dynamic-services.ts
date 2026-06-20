import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDynamicServices20260620211000 implements MigrationInterface {
  name = 'CreateDynamicServices20260620211000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE dynamic_services (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        type varchar(40) NOT NULL DEFAULT 'http_request',
        description text NULL,
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_dynamic_services_tenant_key (tenantId, \`key\`),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE dynamic_service_versions (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        serviceId varchar(36) NOT NULL,
        version int NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'draft',
        definition json NOT NULL,
        createdByUserId varchar(180) NULL,
        publishedAt datetime NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_dynamic_service_versions_service_version (serviceId, version),
        INDEX IDX_dynamic_service_versions_tenant_service (tenantId, serviceId),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE dynamic_service_runs (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        serviceId varchar(36) NOT NULL,
        versionId varchar(36) NOT NULL,
        triggerType varchar(24) NOT NULL DEFAULT 'manual_test',
        triggerEventId varchar(120) NULL,
        status varchar(24) NOT NULL DEFAULT 'pending',
        requestSnapshot json NULL,
        responseSnapshot json NULL,
        error text NULL,
        durationMs int NOT NULL DEFAULT 0,
        timeoutMs int NULL,
        actorUserId varchar(180) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX IDX_dynamic_service_runs_tenant_created (tenantId, createdAt),
        INDEX IDX_dynamic_service_runs_service_created (serviceId, createdAt),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE dynamic_service_runs');
    await queryRunner.query('DROP TABLE dynamic_service_versions');
    await queryRunner.query('DROP TABLE dynamic_services');
  }
}

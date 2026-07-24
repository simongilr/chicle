import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnvironmentDeployCenter20260724080000 implements MigrationInterface {
  name = 'CreateEnvironmentDeployCenter20260724080000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE environment_profiles (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        \`key\` varchar(80) NOT NULL,
        name varchar(160) NOT NULL,
        kind varchar(40) NOT NULL DEFAULT 'custom',
        active tinyint NOT NULL DEFAULT 1,
        isDefault tinyint NOT NULL DEFAULT 0,
        requiresReauth tinyint NOT NULL DEFAULT 0,
        metadata json NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_environment_profiles_tenant_key (tenantId, \`key\`),
        INDEX IDX_environment_profiles_tenant_default (tenantId, isDefault),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE environment_variables (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        environmentId varchar(36) NOT NULL,
        groupKey varchar(80) NOT NULL DEFAULT 'general',
        \`key\` varchar(160) NOT NULL,
        value text NOT NULL,
        valueType varchar(20) NOT NULL DEFAULT 'string',
        target varchar(40) NOT NULL DEFAULT 'api',
        editable tinyint NOT NULL DEFAULT 1,
        requiresRestart tinyint NOT NULL DEFAULT 0,
        description text NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_environment_variables_tenant_env_key (tenantId, environmentId, \`key\`),
        INDEX IDX_environment_variables_tenant_target (tenantId, environmentId, target),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE environment_secrets (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        environmentId varchar(36) NOT NULL,
        scopeType varchar(40) NOT NULL,
        scopeKey varchar(120) NOT NULL DEFAULT 'default',
        \`key\` varchar(160) NOT NULL,
        encryptedValue text NOT NULL,
        algorithm varchar(40) NOT NULL DEFAULT 'aes-256-gcm',
        iv varchar(80) NOT NULL,
        authTag varchar(80) NOT NULL,
        keyVersion varchar(80) NOT NULL DEFAULT 'local-v1',
        maskedPreview varchar(80) NULL,
        status varchar(30) NOT NULL DEFAULT 'active',
        lastRotatedAt datetime NULL,
        description text NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_environment_secrets_tenant_env_scope (tenantId, environmentId, scopeType, scopeKey, \`key\`),
        INDEX IDX_environment_secrets_tenant_status (tenantId, environmentId, status),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE service_registry (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        environmentId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        type varchar(40) NOT NULL DEFAULT 'microservice',
        baseUrl text NOT NULL,
        healthPath varchar(160) NOT NULL DEFAULT '/health',
        authMode varchar(40) NOT NULL DEFAULT 'none',
        secretRef varchar(260) NULL,
        timeoutMs int NOT NULL DEFAULT 8000,
        retryPolicy json NULL,
        tlsRequired tinyint NOT NULL DEFAULT 0,
        allowedOperations json NULL,
        active tinyint NOT NULL DEFAULT 1,
        description text NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_service_registry_tenant_env_key (tenantId, environmentId, \`key\`),
        INDEX IDX_service_registry_tenant_type (tenantId, environmentId, type),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE service_registry');
    await queryRunner.query('DROP TABLE environment_secrets');
    await queryRunner.query('DROP TABLE environment_variables');
    await queryRunner.query('DROP TABLE environment_profiles');
  }
}

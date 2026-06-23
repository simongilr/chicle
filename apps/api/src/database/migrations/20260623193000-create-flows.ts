import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFlows20260623193000 implements MigrationInterface {
  name = 'CreateFlows20260623193000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE flows (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        description text NULL,
        category varchar(80) NULL,
        status varchar(24) NOT NULL DEFAULT 'draft',
        publishedVersionId varchar(36) NULL,
        runtimeConfig json NULL,
        tags json NULL,
        metadata json NULL,
        trashedAt datetime NULL,
        trashedByUserId varchar(180) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_flows_tenant_key (tenantId, \`key\`),
        INDEX IDX_flows_tenant_status (tenantId, status),
        INDEX IDX_flows_tenant_trashed (tenantId, trashedAt),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_versions (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        flowId varchar(36) NOT NULL,
        version int NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'draft',
        definition json NOT NULL,
        inputSchema json NULL,
        outputSchema json NULL,
        runtimeConfig json NULL,
        createdByUserId varchar(180) NULL,
        publishedAt datetime NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_flow_versions_flow_version (flowId, version),
        INDEX IDX_flow_versions_tenant_flow (tenantId, flowId),
        INDEX IDX_flow_versions_tenant_status (tenantId, status),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_steps (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        flowId varchar(36) NOT NULL,
        versionId varchar(36) NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        type varchar(40) NOT NULL,
        position int NOT NULL DEFAULT 0,
        config json NULL,
        inputMap json NULL,
        outputKey varchar(120) NULL,
        nextStepKey varchar(120) NULL,
        onSuccessStepKey varchar(120) NULL,
        onErrorStepKey varchar(120) NULL,
        onTimeoutStepKey varchar(120) NULL,
        onTrueStepKey varchar(120) NULL,
        onFalseStepKey varchar(120) NULL,
        runtimeConfig json NULL,
        ui json NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_flow_steps_tenant_flow (tenantId, flowId),
        INDEX IDX_flow_steps_tenant_version (tenantId, versionId),
        INDEX IDX_flow_steps_flow_key (flowId, \`key\`),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_expressions (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        description text NULL,
        type varchar(40) NOT NULL,
        expression text NOT NULL,
        language varchar(40) NOT NULL DEFAULT 'chicle_expr',
        testCases json NULL,
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_flow_expressions_tenant_key (tenantId, \`key\`),
        INDEX IDX_flow_expressions_tenant_active (tenantId, active),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_decision_tables (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        description text NULL,
        hitPolicy varchar(24) NOT NULL DEFAULT 'first',
        inputs json NOT NULL,
        outputs json NOT NULL,
        rules json NOT NULL,
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_flow_decision_tables_tenant_key (tenantId, \`key\`),
        INDEX IDX_flow_decision_tables_tenant_active (tenantId, active),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_runs (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        flowId varchar(36) NOT NULL,
        versionId varchar(36) NOT NULL,
        triggerType varchar(24) NOT NULL DEFAULT 'manual',
        triggerKey varchar(180) NULL,
        status varchar(24) NOT NULL DEFAULT 'queued',
        input json NOT NULL,
        output json NULL,
        error json NULL,
        contextSnapshot json NULL,
        durationMs int NULL,
        startedAt datetime NULL,
        finishedAt datetime NULL,
        createdByUserId varchar(180) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_flow_runs_tenant_created (tenantId, createdAt),
        INDEX IDX_flow_runs_tenant_flow_created (tenantId, flowId, createdAt),
        INDEX IDX_flow_runs_tenant_status (tenantId, status),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_step_runs (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        runId varchar(36) NOT NULL,
        flowId varchar(36) NOT NULL,
        versionId varchar(36) NOT NULL,
        stepKey varchar(120) NOT NULL,
        stepName varchar(180) NOT NULL,
        stepType varchar(40) NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'pending',
        input json NULL,
        output json NULL,
        error json NULL,
        durationMs int NULL,
        startedAt datetime NULL,
        finishedAt datetime NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX IDX_flow_step_runs_tenant_run (tenantId, runId),
        INDEX IDX_flow_step_runs_tenant_flow_created (tenantId, flowId, createdAt),
        INDEX IDX_flow_step_runs_run_step (runId, stepKey),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_triggers (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        flowId varchar(36) NOT NULL,
        versionId varchar(36) NULL,
        type varchar(40) NOT NULL,
        \`key\` varchar(180) NOT NULL,
        config json NULL,
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_flow_triggers_tenant_flow (tenantId, flowId),
        INDEX IDX_flow_triggers_tenant_type_key (tenantId, type, \`key\`),
        INDEX IDX_flow_triggers_tenant_active (tenantId, active),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_action_catalog (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        category varchar(80) NOT NULL,
        description text NULL,
        inputSchema json NULL,
        outputSchema json NULL,
        configSchema json NULL,
        builtIn tinyint NOT NULL DEFAULT 0,
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_flow_action_catalog_tenant_key (tenantId, \`key\`),
        INDEX IDX_flow_action_catalog_tenant_active (tenantId, active),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_test_cases (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        flowId varchar(36) NOT NULL,
        versionId varchar(36) NULL,
        name varchar(180) NOT NULL,
        input json NOT NULL,
        expectedOutput json NULL,
        expectedStatus varchar(24) NOT NULL DEFAULT 'success',
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_flow_test_cases_tenant_flow (tenantId, flowId),
        INDEX IDX_flow_test_cases_tenant_active (tenantId, active),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE flow_test_cases');
    await queryRunner.query('DROP TABLE flow_action_catalog');
    await queryRunner.query('DROP TABLE flow_triggers');
    await queryRunner.query('DROP TABLE flow_step_runs');
    await queryRunner.query('DROP TABLE flow_runs');
    await queryRunner.query('DROP TABLE flow_decision_tables');
    await queryRunner.query('DROP TABLE flow_expressions');
    await queryRunner.query('DROP TABLE flow_steps');
    await queryRunner.query('DROP TABLE flow_versions');
    await queryRunner.query('DROP TABLE flows');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFlowRuntime20260630010000 implements MigrationInterface {
  name = 'CreateFlowRuntime20260630010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE flow_triggers
        ADD COLUMN nextFireAt datetime NULL AFTER active,
        ADD COLUMN lastFiredAt datetime NULL AFTER nextFireAt,
        ADD COLUMN createdByUserId varchar(180) NULL AFTER lastFiredAt
    `);

    await queryRunner.query(`
      ALTER TABLE flow_runs
        ADD COLUMN parentRunId varchar(36) NULL AFTER versionId,
        ADD COLUMN rootRunId varchar(36) NULL AFTER parentRunId,
        ADD INDEX IDX_flow_runs_parent (parentRunId),
        ADD INDEX IDX_flow_runs_root (rootRunId)
    `);

    await queryRunner.query(`
      CREATE TABLE flow_outbox_events (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        eventKey varchar(180) NOT NULL,
        aggregateType varchar(120) NULL,
        aggregateId varchar(180) NULL,
        idempotencyKey varchar(180) NOT NULL,
        payload json NOT NULL,
        headers json NULL,
        status varchar(24) NOT NULL DEFAULT 'pending',
        attempts int NOT NULL DEFAULT 0,
        availableAt datetime NOT NULL,
        processedAt datetime NULL,
        error text NULL,
        createdByUserId varchar(180) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_flow_outbox_tenant_idempotency (tenantId, idempotencyKey),
        INDEX IDX_flow_outbox_tenant_status_available (tenantId, status, availableAt),
        INDEX IDX_flow_outbox_tenant_event_created (tenantId, eventKey, createdAt),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE flow_jobs (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        flowId varchar(36) NOT NULL,
        triggerId varchar(36) NULL,
        triggerType varchar(24) NOT NULL,
        triggerKey varchar(180) NULL,
        idempotencyKey varchar(180) NOT NULL,
        input json NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'queued',
        priority int NOT NULL DEFAULT 0,
        attempts int NOT NULL DEFAULT 0,
        maxAttempts int NOT NULL DEFAULT 3,
        availableAt datetime NOT NULL,
        lockedAt datetime NULL,
        lockToken varchar(80) NULL,
        runId varchar(36) NULL,
        error text NULL,
        createdByUserId varchar(180) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_flow_jobs_tenant_idempotency (tenantId, idempotencyKey),
        INDEX IDX_flow_jobs_tenant_status_available (tenantId, status, availableAt),
        INDEX IDX_flow_jobs_tenant_flow_created (tenantId, flowId, createdAt),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE flow_jobs');
    await queryRunner.query('DROP TABLE flow_outbox_events');
    await queryRunner.query(`
      ALTER TABLE flow_runs
        DROP INDEX IDX_flow_runs_root,
        DROP INDEX IDX_flow_runs_parent,
        DROP COLUMN rootRunId,
        DROP COLUMN parentRunId
    `);
    await queryRunner.query(`
      ALTER TABLE flow_triggers
        DROP COLUMN createdByUserId,
        DROP COLUMN lastFiredAt,
        DROP COLUMN nextFireAt
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDynamicFormRuntime20260707100000 implements MigrationInterface {
  name = 'CreateDynamicFormRuntime20260707100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const addColumn = async (table: string, column: string, definition: string) => {
      if (!(await queryRunner.hasColumn(table, column))) {
        await queryRunner.query(`ALTER TABLE ${table} ADD ${definition}`);
      }
    };

    await addColumn('dynamic_forms', 'description', 'description text NULL');
    await addColumn('dynamic_forms', 'category', 'category varchar(80) NULL');
    await addColumn('dynamic_forms', 'status', "status varchar(24) NOT NULL DEFAULT 'draft'");
    await addColumn('dynamic_forms', 'publishedVersionId', 'publishedVersionId varchar(36) NULL');
    await addColumn('dynamic_forms', 'metadata', 'metadata json NULL');
    await addColumn('dynamic_forms', 'tags', 'tags json NULL');
    await addColumn('dynamic_forms', 'trashedAt', 'trashedAt datetime NULL');
    await addColumn('dynamic_forms', 'trashedByUserId', 'trashedByUserId varchar(180) NULL');
    await addColumn(
      'dynamic_forms',
      'createdAt',
      'createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'
    );
    await addColumn(
      'dynamic_forms',
      'updatedAt',
      'updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)'
    );

    await queryRunner.query(`
      CREATE TABLE dynamic_form_versions (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        formId varchar(36) NOT NULL,
        version int NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'draft',
        schema json NOT NULL,
        bindingsSnapshot json NULL,
        inputSchema json NULL,
        outputSchema json NULL,
        createdByUserId varchar(180) NULL,
        publishedAt datetime NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_dynamic_form_versions_form_version (formId, version),
        INDEX IDX_dynamic_form_versions_tenant_form (tenantId, formId),
        INDEX IDX_dynamic_form_versions_tenant_status (tenantId, status),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE dynamic_form_bindings (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        formId varchar(36) NOT NULL,
        formVersionId varchar(36) NULL,
        fieldKey varchar(120) NULL,
        bindingType varchar(40) NOT NULL,
        event varchar(40) NOT NULL,
        targetType varchar(40) NOT NULL,
        targetKey varchar(180) NULL,
        targetVersionId varchar(36) NULL,
        operation varchar(40) NULL,
        payloadMap json NULL,
        responseMap json NULL,
        cachePolicy json NULL,
        timeoutMs int NULL,
        required tinyint NOT NULL DEFAULT 0,
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_dynamic_form_bindings_tenant_form (tenantId, formId),
        INDEX IDX_dynamic_form_bindings_tenant_version (tenantId, formVersionId),
        INDEX IDX_dynamic_form_bindings_tenant_target (tenantId, targetType, targetKey),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE dynamic_form_write_policies (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        formId varchar(36) NOT NULL,
        formVersionId varchar(36) NULL,
        targetType varchar(40) NOT NULL,
        targetKey varchar(180) NULL,
        tableName varchar(120) NULL,
        allowedOperation varchar(40) NOT NULL,
        allowedColumns json NULL,
        requiredColumns json NULL,
        tenantColumn varchar(80) NULL,
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_dynamic_form_write_policies_tenant_form (tenantId, formId),
        INDEX IDX_dynamic_form_write_policies_tenant_version (tenantId, formVersionId),
        INDEX IDX_dynamic_form_write_policies_tenant_target (tenantId, targetType, targetKey),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE dynamic_form_runs (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        formId varchar(36) NOT NULL,
        formVersionId varchar(36) NULL,
        version int NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'success',
        idempotencyKey varchar(180) NOT NULL,
        input json NOT NULL,
        output json NULL,
        error json NULL,
        bindingsSnapshot json NULL,
        durationMs int NULL,
        actorUserId varchar(180) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_dynamic_form_runs_tenant_idempotency (tenantId, idempotencyKey),
        INDEX IDX_dynamic_form_runs_tenant_form_created (tenantId, formId, createdAt),
        INDEX IDX_dynamic_form_runs_tenant_version_created (tenantId, formVersionId, createdAt),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE dynamic_form_runs');
    await queryRunner.query('DROP TABLE dynamic_form_write_policies');
    await queryRunner.query('DROP TABLE dynamic_form_bindings');
    await queryRunner.query('DROP TABLE dynamic_form_versions');
  }
}

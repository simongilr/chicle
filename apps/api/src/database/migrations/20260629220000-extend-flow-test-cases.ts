import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendFlowTestCases20260629220000 implements MigrationInterface {
  name = 'ExtendFlowTestCases20260629220000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE flow_test_cases
        ADD COLUMN target varchar(24) NOT NULL DEFAULT 'draft' AFTER expectedStatus,
        ADD COLUMN throughStepKey varchar(120) NULL AFTER target,
        ADD COLUMN assertions json NULL AFTER throughStepKey,
        ADD COLUMN lastResult json NULL AFTER assertions,
        ADD COLUMN lastRunAt datetime NULL AFTER lastResult
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE flow_test_cases
        DROP COLUMN lastRunAt,
        DROP COLUMN lastResult,
        DROP COLUMN assertions,
        DROP COLUMN throughStepKey,
        DROP COLUMN target
    `);
  }
}

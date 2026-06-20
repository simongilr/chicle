import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemaChanges20260620000000 implements MigrationInterface {
  name = 'CreateSchemaChanges20260620000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`schema_changes\` (
        \`id\` varchar(36) NOT NULL,
        \`tenantId\` varchar(36) NOT NULL,
        \`actorUserId\` varchar(36) NULL,
        \`sequence\` int NOT NULL,
        \`operation\` varchar(40) NOT NULL,
        \`tableName\` varchar(80) NOT NULL,
        \`columnName\` varchar(80) NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'applied',
        \`request\` json NOT NULL,
        \`sql\` text NOT NULL,
        \`migrationName\` varchar(180) NOT NULL,
        \`migrationPath\` varchar(400) NULL,
        \`migrationSource\` longtext NOT NULL,
        \`error\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_schema_changes_tenant_sequence\` (\`tenantId\`, \`sequence\`),
        KEY \`IDX_schema_changes_tenant_table\` (\`tenantId\`, \`tableName\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `schema_changes`');
  }
}

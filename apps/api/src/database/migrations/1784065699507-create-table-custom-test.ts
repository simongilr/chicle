import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableCustomTest1784065699507 implements MigrationInterface {
  name = 'CreateTableCustomTest1784065699507';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`custom_test\` (
  \`id\` varchar(36) NOT NULL,
  \`tenantId\` varchar(36) NOT NULL,
  \`nombre\` varchar(160) NULL,
        \`email\` varchar(180) NULL,
        \`activo\` tinyint(1) NOT NULL DEFAULT 1,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_custom_test_tenantId\` (\`tenantId\`)
) ENGINE=InnoDB`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `custom_test`');
  }
}

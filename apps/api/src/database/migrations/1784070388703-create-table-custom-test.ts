import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableCustomTest1784070388703 implements MigrationInterface {
  name = 'CreateTableCustomTest1784070388703';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`custom_test\` (
  \`id\` varchar(36) NOT NULL,
  \`tenantId\` varchar(36) NOT NULL,
  \`son\` date NULL,
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

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableCustomPerson1785483888537 implements MigrationInterface {
  name = 'CreateTableCustomPerson1785483888537';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`custom_person\` (
  \`id\` varchar(36) NOT NULL,
  \`tenantId\` varchar(36) NOT NULL,
  \`name\` varchar(160) NULL,
        \`city\` varchar(160) NULL,
        \`ci\` varchar(160) NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_custom_person_tenantId\` (\`tenantId\`)
) ENGINE=InnoDB`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `custom_person`');
  }
}

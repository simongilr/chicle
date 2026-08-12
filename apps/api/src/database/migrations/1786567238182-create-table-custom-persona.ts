import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableCustomPersona1786567238182 implements MigrationInterface {
  name = 'CreateTableCustomPersona1786567238182';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`custom_persona\` (
  \`id\` varchar(36) NOT NULL,
  \`tenantId\` varchar(36) NOT NULL,
  \`nombre\` varchar(160) NULL,
        \`apellido\` varchar(160) NULL,
        \`cedula\` varchar(160) NULL,
        \`que\` varchar(160) NULL,
        \`guarde\` varchar(160) NULL,
        \`en\` varchar(160) NULL,
        \`tabla\` varchar(160) NULL,
        \`llamada\` varchar(160) NULL,
        \`persona\` varchar(160) NULL,
  \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_custom_persona_tenantId\` (\`tenantId\`)
) ENGINE=InnoDB`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `custom_persona`');
  }
}

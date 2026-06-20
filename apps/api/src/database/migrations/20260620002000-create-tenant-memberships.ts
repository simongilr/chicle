import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantMemberships20260620002000 implements MigrationInterface {
  name = 'CreateTenantMemberships20260620002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`tenant_memberships\` (
        \`id\` varchar(36) NOT NULL,
        \`tenantId\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`systemRole\` varchar(40) NOT NULL DEFAULT 'member',
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`primaryMembership\` tinyint NOT NULL DEFAULT 0,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_tenant_memberships_tenant_user\` (\`tenantId\`, \`userId\`),
        KEY \`IDX_tenant_memberships_user_active\` (\`userId\`, \`active\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`tenant_memberships\` (
        \`id\`,
        \`tenantId\`,
        \`userId\`,
        \`systemRole\`,
        \`active\`,
        \`primaryMembership\`,
        \`createdAt\`,
        \`updatedAt\`
      )
      SELECT UUID(),
             \`tenantId\`,
             \`id\`,
             \`systemRole\`,
             \`active\`,
             1,
             \`createdAt\`,
             \`updatedAt\`
      FROM \`users\`
      WHERE \`tenantId\` IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM \`tenant_memberships\` tm
          WHERE tm.\`tenantId\` = \`users\`.\`tenantId\`
            AND tm.\`userId\` = \`users\`.\`id\`
        )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `tenant_memberships`');
  }
}

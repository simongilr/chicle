import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoleResourceAccess20260701090000 implements MigrationInterface {
  name = 'CreateRoleResourceAccess20260701090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE role_resource_policies (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        roleId varchar(36) NOT NULL,
        resourceType varchar(40) NOT NULL,
        mode varchar(20) NOT NULL DEFAULT 'all',
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_role_resource_policy (tenantId, roleId, resourceType),
        INDEX IDX_role_resource_policy_role (roleId),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE role_resource_grants (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        roleId varchar(36) NOT NULL,
        resourceType varchar(40) NOT NULL,
        resourceId varchar(36) NOT NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_role_resource_grant (tenantId, roleId, resourceType, resourceId),
        INDEX IDX_role_resource_grant_resource (tenantId, resourceType, resourceId),
        INDEX IDX_role_resource_grant_role (roleId),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE role_resource_grants');
    await queryRunner.query('DROP TABLE role_resource_policies');
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Permission } from './permission.entity';
import { BASE_PERMISSIONS, BASE_ROLES } from './rbac.seed';
import { RolePermission } from './role-permission.entity';
import { Role } from './role.entity';
import { UserRole } from './user-role.entity';

export interface EffectiveAccess {
  roles: Array<{ key: string; name: string }>;
  permissions: string[];
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>
  ) {}

  async ensureTenantDefaults(tenantId: string, manager?: EntityManager) {
    const permissions = await this.ensurePermissions(manager);
    const roleMap = new Map<string, Role>();

    for (const roleSeed of BASE_ROLES) {
      let role = await this.repo(Role, manager).findOne({
        where: { tenantId, key: roleSeed.key }
      });

      if (!role) {
        role = await this.repo(Role, manager).save(
          this.repo(Role, manager).create({
            tenantId,
            key: roleSeed.key,
            name: roleSeed.name,
            description: roleSeed.description,
            builtIn: true
          })
        );
      }

      roleMap.set(role.key, role);
      const keys = roleSeed.permissions === 'all' ? BASE_PERMISSIONS.map((item) => item.key) : roleSeed.permissions;

      for (const key of keys) {
        const permission = permissions.get(key);
        if (!permission) {
          continue;
        }

        const exists = await this.repo(RolePermission, manager).exist({
          where: { roleId: role.id, permissionId: permission.id }
        });
        if (!exists) {
          await this.repo(RolePermission, manager).save(
            this.repo(RolePermission, manager).create({
              roleId: role.id,
              permissionId: permission.id
            })
          );
        }
      }
    }

    return roleMap;
  }

  async assignRoleToUser(tenantId: string, userId: string, roleKey: string, manager?: EntityManager) {
    const role = await this.repo(Role, manager).findOne({ where: { tenantId, key: roleKey } });
    if (!role) {
      throw new Error(`Role ${roleKey} not found for tenant ${tenantId}`);
    }

    const exists = await this.repo(UserRole, manager).exist({
      where: { tenantId, userId, roleId: role.id }
    });
    if (exists) {
      return;
    }

    await this.repo(UserRole, manager).save(
      this.repo(UserRole, manager).create({
        tenantId,
        userId,
        roleId: role.id
      })
    );
  }

  async getEffectiveAccess(tenantId: string, userId: string): Promise<EffectiveAccess> {
    const roleRows = await this.userRoles
      .createQueryBuilder('userRole')
      .innerJoin(Role, 'role', 'role.id = userRole.roleId')
      .where('userRole.tenantId = :tenantId', { tenantId })
      .andWhere('userRole.userId = :userId', { userId })
      .select(['role.id AS id', 'role.key AS `key`', 'role.name AS name'])
      .getRawMany<{ id: string; key: string; name: string }>();

    if (roleRows.length === 0) {
      return { roles: [], permissions: [] };
    }

    const roleIds = roleRows.map((role) => role.id);
    const permissionRows = await this.rolePermissions
      .createQueryBuilder('rolePermission')
      .innerJoin(Permission, 'permission', 'permission.id = rolePermission.permissionId')
      .where('rolePermission.roleId IN (:...roleIds)', { roleIds })
      .select('permission.key', 'key')
      .distinct(true)
      .getRawMany<{ key: string }>();

    return {
      roles: roleRows.map((role) => ({ key: role.key, name: role.name })),
      permissions: permissionRows.map((permission) => permission.key).sort()
    };
  }

  private async ensurePermissions(manager?: EntityManager) {
    const map = new Map<string, Permission>();

    for (const permissionSeed of BASE_PERMISSIONS) {
      let permission = await this.repo(Permission, manager).findOne({
        where: { key: permissionSeed.key }
      });

      if (!permission) {
        permission = await this.repo(Permission, manager).save(
          this.repo(Permission, manager).create(permissionSeed)
        );
      }

      map.set(permission.key, permission);
    }

    return map;
  }

  private repo<T extends object>(entity: new () => T, manager?: EntityManager): Repository<T> {
    return manager ? manager.getRepository(entity) : this.repositoryFor(entity);
  }

  private repositoryFor<T extends object>(entity: new () => T): Repository<T> {
    if (entity === Permission) {
      return this.permissions as Repository<T>;
    }
    if (entity === Role) {
      return this.roles as Repository<T>;
    }
    if (entity === RolePermission) {
      return this.rolePermissions as Repository<T>;
    }

    return this.userRoles as Repository<T>;
  }
}

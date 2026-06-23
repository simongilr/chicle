import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

export interface CreateRoleRequest {
  key?: string;
  name?: string;
  description?: string | null;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string | null;
  permissions?: string[];
}

export interface RbacSyncResult {
  permissionsCreated: number;
  permissionsUpdated: number;
  rolesCreated: number;
  rolesUpdated: number;
  rolePermissionsAdded: number;
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
    const { map: permissions } = await this.ensurePermissions(manager);
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

  async syncTenantDefaults(tenantId: string, manager?: EntityManager): Promise<RbacSyncResult> {
    const permissionResult = await this.ensurePermissions(manager);
    const permissions = permissionResult.map;
    const result: RbacSyncResult = {
      permissionsCreated: permissionResult.created,
      permissionsUpdated: permissionResult.updated,
      rolesCreated: 0,
      rolesUpdated: 0,
      rolePermissionsAdded: 0
    };

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
        result.rolesCreated += 1;
      } else {
        const updates: Partial<Role> = {};
        if (role.builtIn && role.name !== roleSeed.name) {
          updates.name = roleSeed.name;
        }
        if (role.builtIn && role.description !== roleSeed.description) {
          updates.description = roleSeed.description;
        }
        if (!role.builtIn) {
          updates.builtIn = true;
        }

        if (Object.keys(updates).length > 0) {
          await this.repo(Role, manager).update({ id: role.id }, updates);
          role = { ...role, ...updates };
          result.rolesUpdated += 1;
        }
      }

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
          result.rolePermissionsAdded += 1;
        }
      }
    }

    return result;
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

  listPermissions() {
    return this.permissions.find({ order: { category: 'ASC', key: 'ASC' } });
  }

  async listRoles(tenantId: string) {
    const roles = await this.roles.find({ where: { tenantId }, order: { key: 'ASC' } });
    const permissionRows = await this.rolePermissions
      .createQueryBuilder('rolePermission')
      .innerJoin(Permission, 'permission', 'permission.id = rolePermission.permissionId')
      .innerJoin(Role, 'role', 'role.id = rolePermission.roleId')
      .where('role.tenantId = :tenantId', { tenantId })
      .select(['role.id AS roleId', 'permission.key AS permissionKey'])
      .getRawMany<{ roleId: string; permissionKey: string }>();

    const permissionMap = new Map<string, string[]>();
    for (const row of permissionRows) {
      permissionMap.set(row.roleId, [...(permissionMap.get(row.roleId) ?? []), row.permissionKey]);
    }

    return roles.map((role) => ({
      ...role,
      permissions: (permissionMap.get(role.id) ?? []).sort()
    }));
  }

  async setRolePermissions(tenantId: string, roleId: string, permissionKeys: string[]) {
    const role = await this.roles.findOne({ where: { id: roleId, tenantId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.key === 'owner') {
      throw new BadRequestException('Owner role permissions are managed by the system');
    }

    const permissions = await this.permissions.find();
    const permissionMap = new Map(permissions.map((permission) => [permission.key, permission]));
    const selected = [...new Set(permissionKeys)]
      .map((key) => permissionMap.get(key))
      .filter((permission): permission is Permission => Boolean(permission));

    await this.rolePermissions.delete({ roleId: role.id });
    if (selected.length > 0) {
      await this.rolePermissions.save(
        selected.map((permission) =>
          this.rolePermissions.create({ roleId: role.id, permissionId: permission.id })
        )
      );
    }

    return { ...role, permissions: selected.map((permission) => permission.key).sort() };
  }

  async createRole(tenantId: string, request: CreateRoleRequest) {
    const key = this.normalizeRoleKey(request.key);
    const name = this.cleanRoleName(request.name);
    const exists = await this.roles.exist({ where: { tenantId, key } });
    if (exists) {
      throw new BadRequestException('Role already exists');
    }

    const role = await this.roles.save(
      this.roles.create({
        tenantId,
        key,
        name,
        description: request.description?.trim() || null,
        builtIn: false
      })
    );

    return this.setRolePermissions(tenantId, role.id, request.permissions ?? []);
  }

  async updateRole(tenantId: string, roleId: string, request: UpdateRoleRequest) {
    const role = await this.roles.findOne({ where: { id: roleId, tenantId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.key === 'owner') {
      throw new BadRequestException('Owner role metadata is managed by the system');
    }

    if (request.name !== undefined) {
      role.name = this.cleanRoleName(request.name);
    }
    if (request.description !== undefined) {
      role.description = request.description?.trim() || null;
    }
    await this.roles.save(role);

    if (request.permissions) {
      return this.setRolePermissions(tenantId, role.id, request.permissions);
    }

    return (await this.listRoles(tenantId)).find((item) => item.id === role.id);
  }

  async deleteRole(tenantId: string, roleId: string) {
    const role = await this.roles.findOne({ where: { id: roleId, tenantId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.builtIn) {
      throw new BadRequestException('Built-in roles cannot be deleted');
    }

    const assigned = await this.userRoles.exist({ where: { tenantId, roleId } });
    if (assigned) {
      throw new BadRequestException('Role is assigned to users');
    }

    await this.rolePermissions.delete({ roleId });
    await this.roles.delete({ id: roleId, tenantId });
    return { ok: true };
  }

  async getUserRoleKeys(tenantId: string, userId: string) {
    const rows = await this.userRoles
      .createQueryBuilder('userRole')
      .innerJoin(Role, 'role', 'role.id = userRole.roleId')
      .where('userRole.tenantId = :tenantId', { tenantId })
      .andWhere('userRole.userId = :userId', { userId })
      .select('role.key', 'key')
      .getRawMany<{ key: string }>();

    return rows.map((row) => row.key).sort();
  }

  async setUserRoles(tenantId: string, userId: string, roleKeys: string[]) {
    const roles = await this.roles.find({ where: { tenantId } });
    const roleMap = new Map(roles.map((role) => [role.key, role]));
    const selected = [...new Set(roleKeys)]
      .map((key) => roleMap.get(key))
      .filter((role): role is Role => Boolean(role));

    if (selected.length === 0) {
      throw new BadRequestException('User must have at least one role');
    }

    await this.userRoles.delete({ tenantId, userId });
    await this.userRoles.save(
      selected.map((role) => this.userRoles.create({ tenantId, userId, roleId: role.id }))
    );

    return selected.map((role) => role.key).sort();
  }

  private async ensurePermissions(manager?: EntityManager) {
    const map = new Map<string, Permission>();
    let created = 0;
    let updated = 0;

    for (const permissionSeed of BASE_PERMISSIONS) {
      let permission = await this.repo(Permission, manager).findOne({
        where: { key: permissionSeed.key }
      });

      if (!permission) {
        permission = await this.repo(Permission, manager).save(
          this.repo(Permission, manager).create(permissionSeed)
        );
        created += 1;
      } else {
        const updates: Partial<Permission> = {};
        if (permission.category !== permissionSeed.category) {
          updates.category = permissionSeed.category;
        }
        if (permission.description !== permissionSeed.description) {
          updates.description = permissionSeed.description;
        }

        if (Object.keys(updates).length > 0) {
          await this.repo(Permission, manager).update({ id: permission.id }, updates);
          permission = { ...permission, ...updates };
          updated += 1;
        }
      }

      map.set(permission.key, permission);
    }

    return { map, created, updated };
  }

  private normalizeRoleKey(value?: string) {
    const key = (value ?? '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9_]{2,79}$/.test(key)) {
      throw new BadRequestException('Role key must use snake_case and be 3-80 characters long');
    }
    return key;
  }

  private cleanRoleName(value?: string) {
    const name = (value ?? '').trim();
    if (name.length < 3 || name.length > 120) {
      throw new BadRequestException('Role name must be 3-120 characters long');
    }
    return name;
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

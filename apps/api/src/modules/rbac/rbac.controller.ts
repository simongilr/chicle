import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource, EntityManager } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { MenusService } from '../menus/menus.service';
import {
  CreateRoleRequest,
  RbacService,
  SetRoleResourceAccessRequest,
  UpdateRoleRequest
} from './rbac.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Security / RBAC')
@ApiBearerAuth('access-token')
export class RbacController {
  constructor(
    private readonly rbac: RbacService,
    private readonly menus: MenusService,
    private readonly audit: AuditService,
    private readonly dataSource: DataSource
  ) {}

  @Get('permissions')
  @RequirePermissions('permissions.read')
  @ApiOperation({
    summary: 'Listar permisos disponibles',
    description: 'Requiere permissions.read. Los permisos son globales y los roles los usan por tenant.'
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        { key: 'users.read', category: 'users', description: 'Ver usuarios.' },
        { key: 'roles.manage', category: 'roles', description: 'Administrar roles y permisos.' }
      ]
    }
  })
  listPermissions() {
    return this.rbac.listPermissions();
  }

  @Get('roles')
  @RequirePermissions('roles.read')
  @ApiOperation({
    summary: 'Listar roles del tenant',
    description: 'Requiere roles.read. Incluye permisos asignados a cada rol.'
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: 'role-id',
          key: 'admin',
          name: 'Admin',
          builtIn: true,
          permissions: ['users.read', 'users.create', 'roles.read']
        }
      ]
    }
  })
  listRoles(@CurrentAuth() auth: AuthContext) {
    return this.rbac.listRoles(auth.tenant.id);
  }

  @Post('roles')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Crear rol del tenant' })
  @ApiBody({
    schema: {
      example: {
        key: 'supervisor',
        name: 'Supervisor',
        description: 'Supervisa operaciones del tenant.',
        permissions: ['users.read', 'records.read']
      }
    }
  })
  async createRole(@CurrentAuth() auth: AuthContext, @Body() body: CreateRoleRequest) {
    const role = await this.rbac.createRole(auth.tenant.id, body);
    await this.audit.record({
      auth,
      action: 'role.created',
      resourceType: 'role',
      resourceId: role.id,
      metadata: { key: role.key, permissions: role.permissions }
    });
    return role;
  }

  @Patch('roles/:roleId')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Actualizar rol del tenant' })
  @ApiParam({ name: 'roleId', example: 'role-id' })
  async updateRole(
    @CurrentAuth() auth: AuthContext,
    @Param('roleId') roleId: string,
    @Body() body: UpdateRoleRequest
  ) {
    const role = await this.rbac.updateRole(auth.tenant.id, roleId, body);
    await this.audit.record({
      auth,
      action: 'role.updated',
      resourceType: 'role',
      resourceId: roleId,
      metadata: { name: role?.name, permissions: role?.permissions }
    });
    return role;
  }

  @Delete('roles/:roleId')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Eliminar rol custom del tenant' })
  @ApiParam({ name: 'roleId', example: 'role-id' })
  async deleteRole(@CurrentAuth() auth: AuthContext, @Param('roleId') roleId: string) {
    const result = await this.rbac.deleteRole(auth.tenant.id, roleId);
    await this.audit.record({
      auth,
      action: 'role.deleted',
      resourceType: 'role',
      resourceId: roleId
    });
    return result;
  }

  @Put('roles/:roleId/permissions')
  @RequirePermissions('roles.manage')
  @ApiOperation({
    summary: 'Actualizar permisos de un rol',
    description:
      'Requiere roles.manage. Los roles built-in pueden existir como base, pero esta ruta permite preparar administracion granular.'
  })
  @ApiParam({ name: 'roleId', example: 'role-id' })
  @ApiBody({
    schema: {
      example: {
        permissions: ['users.read', 'users.create', 'confisys.read']
      }
    }
  })
  async setRolePermissions(
    @CurrentAuth() auth: AuthContext,
    @Param('roleId') roleId: string,
    @Body() body: { permissions?: string[] }
  ) {
    const role = await this.rbac.setRolePermissions(auth.tenant.id, roleId, body.permissions ?? []);
    await this.audit.record({
      auth,
      action: 'role.permissions.updated',
      resourceType: 'role',
      resourceId: roleId,
      metadata: { permissions: role.permissions }
    });
    return role;
  }

  @Get('roles/:roleId/resources')
  @RequirePermissions('roles.read')
  @ApiOperation({
    summary: 'Consultar servicios y flows habilitados para un rol',
    description:
      'Devuelve el catálogo del tenant y las políticas all, selected o none para servicios dinámicos y flows.'
  })
  @ApiParam({ name: 'roleId', example: 'role-id' })
  getRoleResources(@CurrentAuth() auth: AuthContext, @Param('roleId') roleId: string) {
    return this.rbac.getRoleResourceAccess(auth.tenant.id, roleId);
  }

  @Put('roles/:roleId/resources/:resourceType')
  @RequirePermissions('roles.manage')
  @ApiOperation({
    summary: 'Actualizar acceso de un rol a servicios o flows',
    description:
      'El permiso general services.execute o flows.execute sigue siendo obligatorio. Esta política limita los recursos concretos.'
  })
  @ApiParam({ name: 'roleId', example: 'role-id' })
  @ApiParam({ name: 'resourceType', example: 'dynamic_service' })
  @ApiBody({
    schema: {
      example: {
        mode: 'selected',
        resourceIds: ['resource-id']
      }
    }
  })
  async setRoleResources(
    @CurrentAuth() auth: AuthContext,
    @Param('roleId') roleId: string,
    @Param('resourceType') resourceType: string,
    @Body() body: SetRoleResourceAccessRequest
  ) {
    const result = await this.rbac.setRoleResourceAccess(auth.tenant.id, roleId, resourceType, body);
    await this.audit.record({
      auth,
      action: 'role.resources.updated',
      resourceType: 'role',
      resourceId: roleId,
      metadata: {
        resourceType,
        mode: body.mode,
        resourceIds: body.resourceIds ?? []
      }
    });
    return result;
  }

  @Post('security/sync')
  @RequirePermissions('roles.manage')
  @ApiOperation({
    summary: 'Sincronizar seguridad base del tenant',
    description:
      'Repara permisos, roles built-in y menús base sin resetear la organización. Requiere roles.manage.'
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        ok: true,
        memberships: {
          membershipsCreated: 1
        },
        rbac: {
          permissionsCreated: 1,
          permissionsUpdated: 0,
          rolesCreated: 0,
          rolesUpdated: 0,
          rolePermissionsAdded: 2
        },
        menus: {
          menusCreated: 0,
          menusUpdated: 1
        }
      }
    }
  })
  async syncSecurity(@CurrentAuth() auth: AuthContext) {
    const result = await this.dataSource.transaction(async (manager) => {
      const memberships = await this.syncTenantMemberships(auth.tenant.id, manager);
      const rbac = await this.rbac.syncTenantDefaults(auth.tenant.id, manager);
      const menus = await this.menus.syncTenantDefaults(auth.tenant.id, manager);
      return { ok: true, memberships, rbac, menus };
    });

    await this.audit.record({
      auth,
      action: 'security.synced',
      resourceType: 'security',
      resourceId: auth.tenant.id,
      metadata: result
    });

    return result;
  }

  private async syncTenantMemberships(tenantId: string, manager: EntityManager) {
    const missingRows = await manager.query(
      `
        SELECT COUNT(*) AS total
        FROM users u
        WHERE u.tenantId = ?
          AND NOT EXISTS (
            SELECT 1
            FROM tenant_memberships tm
            WHERE tm.tenantId = u.tenantId
              AND tm.userId = u.id
          )
      `,
      [tenantId]
    );
    const membershipsCreated = Number(missingRows[0]?.total ?? 0);

    if (membershipsCreated > 0) {
      await manager.query(
        `
          INSERT INTO tenant_memberships (
            id,
            tenantId,
            userId,
            systemRole,
            active,
            primaryMembership,
            createdAt,
            updatedAt
          )
          SELECT UUID(),
                 tenantId,
                 id,
                 systemRole,
                 active,
                 1,
                 createdAt,
                 updatedAt
          FROM users u
          WHERE u.tenantId = ?
            AND NOT EXISTS (
              SELECT 1
              FROM tenant_memberships tm
              WHERE tm.tenantId = u.tenantId
                AND tm.userId = u.id
            )
        `,
        [tenantId]
      );
    }

    return { membershipsCreated };
  }

  @Get('audit')
  @RequirePermissions('audit.read')
  @ApiOperation({
    summary: 'Listar auditoria de seguridad del tenant',
    description: 'Requiere audit.read. Registra cambios sensibles de usuarios y roles.'
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          action: 'user.created',
          resourceType: 'user',
          resourceId: 'user-id',
          metadata: { email: 'operador@example.com', roles: ['operator'] },
          createdAt: '2026-06-19T18:00:00.000Z'
        }
      ]
    }
  })
  listAudit(@CurrentAuth() auth: AuthContext) {
    return this.audit.list(auth.tenant.id);
  }
}

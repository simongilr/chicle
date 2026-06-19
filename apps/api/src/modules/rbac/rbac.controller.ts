import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RbacService } from './rbac.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Security / RBAC')
@ApiBearerAuth('access-token')
export class RbacController {
  constructor(
    private readonly rbac: RbacService,
    private readonly audit: AuditService
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

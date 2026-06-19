import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RbacService } from './rbac.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RbacController {
  constructor(
    private readonly rbac: RbacService,
    private readonly audit: AuditService
  ) {}

  @Get('permissions')
  @RequirePermissions('permissions.read')
  listPermissions() {
    return this.rbac.listPermissions();
  }

  @Get('roles')
  @RequirePermissions('roles.read')
  listRoles(@CurrentAuth() auth: AuthContext) {
    return this.rbac.listRoles(auth.tenant.id);
  }

  @Put('roles/:roleId/permissions')
  @RequirePermissions('roles.manage')
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
  listAudit(@CurrentAuth() auth: AuthContext) {
    return this.audit.list(auth.tenant.id);
  }
}

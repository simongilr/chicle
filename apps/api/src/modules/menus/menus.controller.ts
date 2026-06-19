import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthContext } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { MenusService } from './menus.service';

@ApiTags('Menus')
@ApiBearerAuth()
@Controller('menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  @Get('current')
  @RequirePermissions('menus.read')
  @ApiOperation({
    summary: 'Menu visible para la sesión actual',
    description: 'Devuelve las opciones activas del tenant filtradas por permisos efectivos.'
  })
  current(@CurrentAuth() auth: AuthContext) {
    return this.menus.getCurrentMenu(auth);
  }
}

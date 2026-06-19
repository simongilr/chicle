import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateUserRequest, UpdateUserRequest, UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Security / Users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({
    summary: 'Listar usuarios del tenant actual',
    description: 'Requiere permiso users.read.'
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: 'user-id',
          tenantId: 'tenant-id',
          email: 'admin@example.com',
          name: 'Admin',
          systemRole: 'owner',
          active: true,
          roles: ['owner']
        }
      ]
    }
  })
  list(@CurrentAuth() auth: AuthContext) {
    return this.users.list(auth);
  }

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({
    summary: 'Crear usuario',
    description: 'Requiere users.create. La clave respeta security.password.minLength desde confisys.'
  })
  @ApiBody({
    schema: {
      example: {
        email: 'operador@example.com',
        name: 'Operador Uno',
        password: 'CambiaEstaClave123',
        roles: ['operator']
      }
    }
  })
  create(@CurrentAuth() auth: AuthContext, @Body() body: CreateUserRequest) {
    return this.users.create(auth, body);
  }

  @Patch(':userId')
  @RequirePermissions('users.update')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Requiere users.update. Permite cambiar nombre, rol de sistema o estado activo.'
  })
  @ApiParam({ name: 'userId', example: 'user-id' })
  @ApiBody({
    schema: {
      example: {
        name: 'Operador Principal',
        active: true
      }
    }
  })
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('userId') userId: string,
    @Body() body: UpdateUserRequest
  ) {
    return this.users.update(auth, userId, body);
  }

  @Put(':userId/roles')
  @RequirePermissions('roles.manage')
  @ApiOperation({
    summary: 'Asignar roles a usuario',
    description: 'Requiere roles.manage. Evita que un owner se quite su propio rol owner.'
  })
  @ApiParam({ name: 'userId', example: 'user-id' })
  @ApiBody({
    schema: {
      example: {
        roles: ['admin', 'operator']
      }
    }
  })
  setRoles(
    @CurrentAuth() auth: AuthContext,
    @Param('userId') userId: string,
    @Body() body: { roles?: string[] }
  ) {
    return this.users.setRoles(auth, userId, body.roles ?? []);
  }
}

import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateUserRequest, UpdateUserRequest, UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  list(@CurrentAuth() auth: AuthContext) {
    return this.users.list(auth);
  }

  @Post()
  @RequirePermissions('users.create')
  create(@CurrentAuth() auth: AuthContext, @Body() body: CreateUserRequest) {
    return this.users.create(auth, body);
  }

  @Patch(':userId')
  @RequirePermissions('users.update')
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('userId') userId: string,
    @Body() body: UpdateUserRequest
  ) {
    return this.users.update(auth, userId, body);
  }

  @Put(':userId/roles')
  @RequirePermissions('roles.manage')
  setRoles(
    @CurrentAuth() auth: AuthContext,
    @Param('userId') userId: string,
    @Body() body: { roles?: string[] }
  ) {
    return this.users.setRoles(auth, userId, body.roles ?? []);
  }
}

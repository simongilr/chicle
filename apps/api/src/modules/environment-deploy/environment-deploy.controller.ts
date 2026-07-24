import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthContext } from '../auth/auth.types';
import { EnvironmentDeployService } from './environment-deploy.service';
import {
  CreateEnvironmentProfileRequest,
  UpdateEnvironmentProfileRequest,
  UpsertEnvironmentSecretRequest,
  UpsertEnvironmentVariableRequest,
  UpsertServiceRegistryRequest
} from './environment-deploy.types';

@ApiTags('Environment Deploy')
@ApiBearerAuth()
@Controller('environment-deploy')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EnvironmentDeployController {
  constructor(private readonly service: EnvironmentDeployService) {}

  @Get('overview')
  @RequirePermissions('env.read')
  @ApiOperation({ summary: 'Environment center overview' })
  overview(@CurrentAuth() auth: AuthContext) {
    return this.service.overview(auth);
  }

  @Get('environments')
  @RequirePermissions('env.read')
  list(@CurrentAuth() auth: AuthContext) {
    return this.service.listProfiles(auth);
  }

  @Post('environments')
  @RequirePermissions('env.update')
  create(@CurrentAuth() auth: AuthContext, @Body() body: CreateEnvironmentProfileRequest) {
    return this.service.createProfile(auth, body);
  }

  @Get('environments/:key')
  @RequirePermissions('env.read')
  detail(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    return this.service.detail(auth, key);
  }

  @Patch('environments/:key')
  @RequirePermissions('env.update')
  update(@CurrentAuth() auth: AuthContext, @Param('key') key: string, @Body() body: UpdateEnvironmentProfileRequest) {
    return this.service.updateProfile(auth, key, body);
  }

  @Post('environments/:key/variables')
  @RequirePermissions('env.update')
  variable(@CurrentAuth() auth: AuthContext, @Param('key') key: string, @Body() body: UpsertEnvironmentVariableRequest) {
    return this.service.upsertVariable(auth, key, body);
  }

  @Post('environments/:key/secrets')
  @RequirePermissions('secrets.write')
  secret(@CurrentAuth() auth: AuthContext, @Param('key') key: string, @Body() body: UpsertEnvironmentSecretRequest) {
    return this.service.upsertSecret(auth, key, body);
  }

  @Post('environments/:key/service-registry')
  @RequirePermissions('service_registry.manage')
  registry(@CurrentAuth() auth: AuthContext, @Param('key') key: string, @Body() body: UpsertServiceRegistryRequest) {
    return this.service.upsertService(auth, key, body);
  }

  @Get('environments/:key/runtime-config')
  @RequirePermissions('env.read')
  runtimeConfig(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    return this.service.runtimeConfig(auth, key);
  }

  @Get('environments/:key/validate')
  @RequirePermissions('deploy.validate')
  validate(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    return this.service.validate(auth, key);
  }

  @Get('environments/:key/deployment-bundle')
  @RequirePermissions('deploy.generate')
  bundle(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    return this.service.deploymentBundle(auth, key);
  }
}

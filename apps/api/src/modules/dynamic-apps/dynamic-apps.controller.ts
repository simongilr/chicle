import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  CreateDynamicAppRequest,
  CreateDynamicScreenRequest,
  DynamicAppJsonAuthoringRequest,
  DynamicAppsService,
  DynamicScreenJsonAuthoringRequest,
  DryRunDynamicAppPackageRequest,
  InstallDynamicAppPackageRequest,
  RestoreArtifactRequest,
  UpdateDynamicAppRequest,
  UpdateDynamicScreenRequest
} from './dynamic-apps.service';
import { DynamicScreenTarget } from './dynamic-screen.entity';

@Controller('apps')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Apps / Screens')
@ApiBearerAuth('access-token')
export class DynamicAppsController {
  constructor(private readonly dynamicApps: DynamicAppsService) {}

  @Get()
  @RequirePermissions('apps.read')
  @ApiOperation({ summary: 'List dynamic apps for the current tenant' })
  findAll(@CurrentAuth() auth: AuthContext) {
    return this.dynamicApps.findAll(auth);
  }

  @Get('trash')
  @RequirePermissions('apps.read')
  @ApiOperation({ summary: 'List trashed dynamic apps for the current tenant' })
  findTrash(@CurrentAuth() auth: AuthContext) {
    return this.dynamicApps.findTrashed(auth);
  }

  @Get('components/catalog')
  @RequirePermissions('apps.read')
  @ApiOperation({ summary: 'List allowed screen component keys' })
  componentCatalog() {
    return this.dynamicApps.componentCatalog();
  }

  @Post('packages/install')
  @RequirePermissions('apps.install')
  @ApiOperation({ summary: 'Install a portable Chicle app package' })
  installPackage(@CurrentAuth() auth: AuthContext, @Body() body: InstallDynamicAppPackageRequest) {
    return this.dynamicApps.installPackage(auth, body);
  }

  @Post('packages/dry-run')
  @RequirePermissions('apps.install')
  @ApiOperation({ summary: 'Validate and preview a portable Chicle app package installation' })
  dryRunInstallPackage(@CurrentAuth() auth: AuthContext, @Body() body: DryRunDynamicAppPackageRequest) {
    return this.dynamicApps.dryRunInstallPackage(auth, body);
  }

  @Post('authoring/json')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Create or update an app from a portable JSON manifest' })
  upsertAppFromJson(@CurrentAuth() auth: AuthContext, @Body() body: DynamicAppJsonAuthoringRequest) {
    return this.dynamicApps.upsertAppFromJson(auth, body);
  }

  @Post('screens/authoring/json')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Create or update a screen from a portable JSON definition' })
  upsertScreenFromJson(@CurrentAuth() auth: AuthContext, @Body() body: DynamicScreenJsonAuthoringRequest) {
    return this.dynamicApps.upsertScreenFromJson(auth, body);
  }

  @Get('by-key/:key')
  @RequirePermissions('apps.read')
  @ApiOperation({ summary: 'Get an app and its screens by key' })
  findByKey(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    return this.dynamicApps.findByKey(auth, key);
  }

  @Get('by-key/:key/runtime')
  @ApiOperation({ summary: 'Get published app runtime by key' })
  runtimeByKey(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    return this.dynamicApps.runtimeByKey(auth, key);
  }

  @Get('by-key/:key/runtime-route')
  @ApiOperation({ summary: 'Get a published app runtime screen by app key, route and target' })
  runtimeRouteByKey(
    @CurrentAuth() auth: AuthContext,
    @Param('key') key: string,
    @Query('route') route = '/',
    @Query('target') target: DynamicScreenTarget = 'web'
  ) {
    return this.dynamicApps.runtimeRouteByKey(auth, key, route, target);
  }

  @Post()
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Create a dynamic app' })
  createApp(@CurrentAuth() auth: AuthContext, @Body() body: CreateDynamicAppRequest) {
    return this.dynamicApps.createApp(auth, body);
  }

  @Patch(':appId')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Update a dynamic app draft' })
  updateApp(@CurrentAuth() auth: AuthContext, @Param('appId') appId: string, @Body() body: UpdateDynamicAppRequest) {
    return this.dynamicApps.updateApp(auth, appId, body);
  }

  @Post(':appId/trash')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Move an app to trash' })
  trashApp(@CurrentAuth() auth: AuthContext, @Param('appId') appId: string) {
    return this.dynamicApps.trashApp(auth, appId);
  }

  @Get(':appId/package')
  @RequirePermissions('apps.export')
  @ApiOperation({ summary: 'Export a portable Chicle app package' })
  exportPackage(@CurrentAuth() auth: AuthContext, @Param('appId') appId: string) {
    return this.dynamicApps.exportPackage(auth, appId);
  }

  @Post(':appId/restore')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Restore an app from trash' })
  restoreApp(@CurrentAuth() auth: AuthContext, @Param('appId') appId: string, @Body() body: RestoreArtifactRequest) {
    return this.dynamicApps.restoreApp(auth, appId, body);
  }

  @Post(':appId/versions')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Create an immutable app version from the current manifest' })
  createAppVersion(@CurrentAuth() auth: AuthContext, @Param('appId') appId: string) {
    return this.dynamicApps.createAppVersion(auth, appId);
  }

  @Post(':appId/versions/:versionId/publish')
  @RequirePermissions('apps.publish')
  @ApiOperation({ summary: 'Publish an app version' })
  publishAppVersion(
    @CurrentAuth() auth: AuthContext,
    @Param('appId') appId: string,
    @Param('versionId') versionId: string
  ) {
    return this.dynamicApps.publishAppVersion(auth, appId, versionId);
  }

  @Get(':appId/screens')
  @RequirePermissions('apps.read')
  @ApiOperation({ summary: 'List screens for an app' })
  listScreens(@CurrentAuth() auth: AuthContext, @Param('appId') appId: string) {
    return this.dynamicApps.listScreens(auth, appId);
  }

  @Get(':appId/screens/trash')
  @RequirePermissions('apps.read')
  @ApiOperation({ summary: 'List trashed screens for an app' })
  listTrashedScreens(@CurrentAuth() auth: AuthContext, @Param('appId') appId: string) {
    return this.dynamicApps.listTrashedScreens(auth, appId);
  }

  @Post(':appId/screens')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Create a screen inside an app' })
  createScreen(
    @CurrentAuth() auth: AuthContext,
    @Param('appId') appId: string,
    @Body() body: CreateDynamicScreenRequest
  ) {
    return this.dynamicApps.createScreen(auth, appId, body);
  }

  @Patch(':appId/screens/:screenId')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Update a screen draft' })
  updateScreen(
    @CurrentAuth() auth: AuthContext,
    @Param('appId') appId: string,
    @Param('screenId') screenId: string,
    @Body() body: UpdateDynamicScreenRequest
  ) {
    return this.dynamicApps.updateScreen(auth, appId, screenId, body);
  }

  @Post(':appId/screens/:screenId/trash')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Move a screen to trash' })
  trashScreen(@CurrentAuth() auth: AuthContext, @Param('appId') appId: string, @Param('screenId') screenId: string) {
    return this.dynamicApps.trashScreen(auth, appId, screenId);
  }

  @Post(':appId/screens/:screenId/restore')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Restore a screen from trash' })
  restoreScreen(
    @CurrentAuth() auth: AuthContext,
    @Param('appId') appId: string,
    @Param('screenId') screenId: string,
    @Body() body: RestoreArtifactRequest
  ) {
    return this.dynamicApps.restoreScreen(auth, appId, screenId, body);
  }

  @Post(':appId/screens/:screenId/versions')
  @RequirePermissions('apps.manage')
  @ApiOperation({ summary: 'Create an immutable screen version from the current definition' })
  createScreenVersion(
    @CurrentAuth() auth: AuthContext,
    @Param('appId') appId: string,
    @Param('screenId') screenId: string
  ) {
    return this.dynamicApps.createScreenVersion(auth, appId, screenId);
  }

  @Post(':appId/screens/:screenId/versions/:versionId/publish')
  @RequirePermissions('apps.publish')
  @ApiOperation({ summary: 'Publish a screen version' })
  publishScreenVersion(
    @CurrentAuth() auth: AuthContext,
    @Param('appId') appId: string,
    @Param('screenId') screenId: string,
    @Param('versionId') versionId: string
  ) {
    return this.dynamicApps.publishScreenVersion(auth, appId, screenId, versionId);
  }
}

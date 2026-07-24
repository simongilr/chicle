import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { DynamicAppVersion } from './dynamic-app-version.entity';
import { DynamicApp } from './dynamic-app.entity';
import { DynamicScreenVersion } from './dynamic-screen-version.entity';
import { DynamicScreen, DynamicScreenTarget } from './dynamic-screen.entity';

export interface DynamicAppManifest {
  [key: string]: unknown;
  schemaVersion?: number;
  kind?: string;
  key?: string;
  name?: string;
  description?: string;
  category?: string;
  targets?: string[];
  presentation?: Record<string, unknown>;
  navigation?: Record<string, unknown>;
  text?: Record<string, unknown>;
  permissions?: string[];
  screens?: Array<Record<string, unknown>>;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface DynamicScreenComponentDefinition {
  id?: string;
  componentKey?: string;
  title?: string;
  region?: string;
  order?: number;
  inputs?: Record<string, unknown>;
  bindings?: Record<string, unknown>;
  actions?: Array<Record<string, unknown>>;
  visibility?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}

export interface DynamicScreenDefinition {
  [key: string]: unknown;
  schemaVersion?: number;
  kind?: string;
  key?: string;
  appKey?: string;
  title?: string;
  description?: string;
  route?: string;
  target?: DynamicScreenTarget;
  category?: string;
  textNamespace?: string;
  layout?: Record<string, unknown>;
  regions?: Array<Record<string, unknown>>;
  components?: DynamicScreenComponentDefinition[];
  dataSources?: Array<Record<string, unknown>>;
  actions?: Array<Record<string, unknown>>;
  permissions?: string[];
  presentation?: Record<string, unknown>;
  tests?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface CreateDynamicAppRequest {
  key?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  targets?: string[];
  manifest?: Record<string, unknown>;
}

export interface UpdateDynamicAppRequest {
  name?: string;
  description?: string | null;
  category?: string | null;
  targets?: string[];
  manifest?: Record<string, unknown>;
}

export interface DynamicAppJsonAuthoringRequest {
  document?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  publish?: boolean;
}

export interface CreateDynamicScreenRequest {
  key?: string;
  title?: string;
  description?: string | null;
  route?: string | null;
  target?: DynamicScreenTarget;
  category?: string | null;
  sortOrder?: number;
  definition?: Record<string, unknown>;
}

export interface UpdateDynamicScreenRequest {
  title?: string;
  description?: string | null;
  route?: string | null;
  target?: DynamicScreenTarget;
  category?: string | null;
  sortOrder?: number;
  definition?: Record<string, unknown>;
}

export interface DynamicScreenJsonAuthoringRequest {
  appKey?: string;
  appId?: string;
  document?: Record<string, unknown>;
  definition?: Record<string, unknown>;
  publish?: boolean;
}

export interface DynamicScreenAuthoringResponse {
  artifactType: 'dynamic_screen';
  id: string;
  key: string;
  appKey: string;
  screen: DynamicScreen;
  version: DynamicScreenVersion | null;
  published: boolean;
}

export interface RestoreArtifactRequest {
  overwrite?: boolean;
}

export interface DynamicAppPackageScreen {
  key: string;
  version: number;
  status: DynamicScreen['status'];
  published: boolean;
  definition: DynamicScreenDefinition;
}

export interface DynamicAppPackage {
  schemaVersion: number;
  kind: 'chicle_app_package';
  packageKey: string;
  name: string;
  description: string;
  exportedAt: string;
  app: {
    key: string;
    version: number;
    status: DynamicApp['status'];
    published: boolean;
    manifest: DynamicAppManifest;
  };
  screens: DynamicAppPackageScreen[];
  dependencies: {
    componentKeys: string[];
    formKeys: string[];
    serviceKeys: string[];
    flowKeys: string[];
    textNamespaces: string[];
    customTables: string[];
  };
  install: {
    mode: 'upsert';
    conflictStrategy: 'active_keys_block';
    publishOnInstall: boolean;
  };
}

export interface InstallDynamicAppPackageRequest {
  document?: Record<string, unknown>;
  package?: Record<string, unknown>;
  publish?: boolean;
}

@Injectable()
export class DynamicAppsService {
  constructor(
    @InjectRepository(DynamicApp)
    private readonly apps: Repository<DynamicApp>,
    @InjectRepository(DynamicAppVersion)
    private readonly appVersions: Repository<DynamicAppVersion>,
    @InjectRepository(DynamicScreen)
    private readonly screens: Repository<DynamicScreen>,
    @InjectRepository(DynamicScreenVersion)
    private readonly screenVersions: Repository<DynamicScreenVersion>,
    private readonly audit: AuditService
  ) {}

  findAll(auth: AuthContext) {
    return this.apps.find({
      where: { tenantId: auth.tenant.id, trashedAt: IsNull() },
      order: { key: 'ASC' }
    });
  }

  findTrashed(auth: AuthContext) {
    return this.apps.find({
      where: { tenantId: auth.tenant.id, trashedAt: Not(IsNull()) },
      order: { key: 'ASC' }
    });
  }

  async findByKey(auth: AuthContext, key: string) {
    const app = await this.requireAppByKey(auth, key);
    return {
      ...app,
      screens: await this.listScreens(auth, app.id)
    };
  }

  async runtimeByKey(auth: AuthContext, key: string) {
    const app = await this.requireAppByKey(auth, key);
    const version = await this.resolveAppRuntimeVersion(auth, app);
    const screens = await this.screens.find({
      where: { tenantId: auth.tenant.id, appId: app.id, trashedAt: IsNull() },
      order: { sortOrder: 'ASC', key: 'ASC' }
    });
    const runtimeScreens = await Promise.all(
      screens
        .filter((screen) => screen.published)
        .map(async (screen) => {
          const screenVersion = await this.resolveScreenRuntimeVersion(auth, screen);
          return {
            key: screen.key,
            title: screen.title,
            route: screen.route,
            target: screen.target,
            version: screenVersion?.version ?? screen.version,
            definition: screenVersion?.definition ?? screen.definition
          };
        })
    );
    return {
      key: app.key,
      name: app.name,
      description: app.description,
      category: app.category,
      targets: app.targets,
      version: version?.version ?? app.version,
      manifest: version?.manifest ?? app.manifest,
      screens: runtimeScreens
    };
  }

  async createApp(auth: AuthContext, body: CreateDynamicAppRequest) {
    const key = this.normalizeKey(body.key);
    const name = body.name?.trim();
    if (!key || !name) {
      throw new BadRequestException('key and name are required');
    }
    await this.releaseTrashedAppKey(auth, key);
    await this.assertActiveAppKeyAvailable(auth, key);
    const manifest = this.normalizeManifest(body.manifest ?? {}, key, name, body.description ?? null, body.targets);
    this.validateManifest(manifest);
    const app = await this.apps.save(
      this.apps.create({
        tenantId: auth.tenant.id,
        key,
        name,
        description: body.description?.trim() || this.asString(manifest.description) || null,
        category: body.category?.trim() || this.asString(manifest.category) || null,
        targets: this.normalizeTargets(body.targets ?? manifest.targets),
        manifest: manifest as unknown as Record<string, unknown>,
        status: 'draft',
        published: false,
        metadata: null,
        tags: null
      })
    );
    await this.record(auth, 'dynamic_app.created', 'dynamic_app', app.id, { key: app.key });
    return app;
  }

  async upsertAppFromJson(auth: AuthContext, body: DynamicAppJsonAuthoringRequest) {
    const manifest = body.document ?? body.manifest;
    if (!manifest) {
      throw new BadRequestException('document is required');
    }
    const key = this.normalizeKey(this.asString(manifest['key']));
    const name = this.asString(manifest['name']);
    if (!key || !name) {
      throw new BadRequestException('document.key and document.name are required');
    }
    const existing = await this.apps.findOne({
      where: { tenantId: auth.tenant.id, key, trashedAt: IsNull() }
    });
    const app = existing
      ? await this.updateApp(auth, existing.id, {
          name,
          description: this.asString(manifest['description']) || existing.description,
          category: this.asString(manifest['category']) || existing.category,
          targets: this.normalizeTargets(manifest['targets']),
          manifest
        })
      : await this.createApp(auth, {
          key,
          name,
          description: this.asString(manifest['description']) || null,
          category: this.asString(manifest['category']) || null,
          targets: this.normalizeTargets(manifest['targets']),
          manifest
        });

    let version: DynamicAppVersion | null = null;
    if (body.publish) {
      version = await this.createAppVersion(auth, app.id);
      version = await this.publishAppVersion(auth, app.id, version.id);
    }

    return {
      artifactType: 'dynamic_app',
      id: app.id,
      key: app.key,
      app,
      version,
      published: Boolean(body.publish)
    };
  }

  async updateApp(auth: AuthContext, appId: string, body: UpdateDynamicAppRequest) {
    const app = await this.requireApp(auth, appId);
    this.ensureEditableApp(app);
    const name = body.name?.trim() || app.name;
    const manifest = this.normalizeManifest(body.manifest ?? app.manifest, app.key, name, body.description ?? app.description, body.targets ?? app.targets);
    this.validateManifest(manifest);
    const saved = await this.apps.save(
      this.apps.merge(app, {
        name,
        description: body.description === undefined ? app.description : body.description?.trim() || null,
        category: body.category === undefined ? app.category : body.category?.trim() || this.asString(manifest.category) || null,
        targets: this.normalizeTargets(body.targets ?? manifest.targets),
        manifest: manifest as unknown as Record<string, unknown>,
        status: app.status === 'published' ? 'draft' : app.status,
        published: app.published
      })
    );
    await this.record(auth, 'dynamic_app.updated', 'dynamic_app', saved.id, { key: saved.key });
    return saved;
  }

  async trashApp(auth: AuthContext, appId: string) {
    const app = await this.requireApp(auth, appId);
    if (app.trashedAt) {
      return app;
    }
    const originalKey = this.originalKeyFromMetadata(app.metadata) ?? app.key;
    const saved = await this.apps.save(
      this.apps.merge(app, {
        key: this.trashKey(app.key, app.id),
        metadata: this.withTrashOriginalKey(app.metadata, originalKey),
        trashedAt: new Date(),
        trashedByUserId: auth.user.id
      })
    );
    await this.record(auth, 'dynamic_app.trashed', 'dynamic_app', saved.id, { originalKey });
    return saved;
  }

  async restoreApp(auth: AuthContext, appId: string, request: RestoreArtifactRequest = {}) {
    const app = await this.requireTrashedApp(auth, appId);
    const restoreKey = this.originalKeyFromMetadata(app.metadata) ?? this.originalKeyFromTrashKey(app.key);
    const conflict = await this.apps.findOne({
      where: { tenantId: auth.tenant.id, key: restoreKey, trashedAt: IsNull() }
    });
    if (conflict && conflict.id !== app.id) {
      if (!request.overwrite) {
        throw new ConflictException('An app with this key already exists. Confirm overwrite to restore it.');
      }
      await this.trashApp(auth, conflict.id);
    }
    const manifest = this.normalizeManifest(app.manifest, restoreKey, app.name, app.description, app.targets);
    const saved = await this.apps.save(
      this.apps.merge(app, {
        key: restoreKey,
        manifest: manifest as unknown as Record<string, unknown>,
        metadata: this.withoutTrashOriginalKey(app.metadata),
        trashedAt: null,
        trashedByUserId: null
      })
    );
    await this.record(auth, 'dynamic_app.restored', 'dynamic_app', saved.id, { key: saved.key });
    return saved;
  }

  async createAppVersion(auth: AuthContext, appId: string) {
    const app = await this.requireApp(auth, appId);
    this.ensureEditableApp(app);
    const current = await this.appVersions.findOne({
      where: { tenantId: auth.tenant.id, appId: app.id },
      order: { version: 'DESC' }
    });
    const versionNumber = (current?.version ?? 0) + 1;
    const dependencySnapshot = await this.appDependencySnapshot(auth, app.id);
    const version = await this.appVersions.save(
      this.appVersions.create({
        tenantId: auth.tenant.id,
        appId: app.id,
        version: versionNumber,
        status: 'draft',
        manifest: app.manifest,
        dependencySnapshot,
        createdByUserId: auth.user.id
      })
    );
    await this.record(auth, 'dynamic_app.version.created', 'dynamic_app', app.id, { version: version.version });
    return version;
  }

  async publishAppVersion(auth: AuthContext, appId: string, versionId: string) {
    const app = await this.requireApp(auth, appId);
    this.ensureEditableApp(app);
    const version = await this.appVersions.findOne({
      where: { tenantId: auth.tenant.id, appId: app.id, id: versionId }
    });
    if (!version) {
      throw new NotFoundException('App version not found');
    }
    this.validateManifest(this.normalizeManifest(version.manifest, app.key, app.name, app.description, app.targets));
    await this.appVersions.update({ tenantId: auth.tenant.id, appId: app.id, status: 'published' }, { status: 'archived' });
    await this.appVersions.update(version.id, { status: 'published', publishedAt: new Date() });
    await this.apps
      .createQueryBuilder()
      .update(DynamicApp)
      .set({
        version: version.version,
        manifest: () => ':manifest',
        published: true,
        status: 'published',
        publishedVersionId: version.id
      })
      .where('id = :id', { id: app.id })
      .setParameters({ manifest: JSON.stringify(version.manifest) })
      .execute();
    await this.record(auth, 'dynamic_app.version.published', 'dynamic_app', app.id, { version: version.version });
    return this.appVersions.findOneOrFail({ where: { id: version.id } });
  }

  async listScreens(auth: AuthContext, appId: string) {
    await this.requireApp(auth, appId);
    return this.screens.find({
      where: { tenantId: auth.tenant.id, appId, trashedAt: IsNull() },
      order: { sortOrder: 'ASC', key: 'ASC' }
    });
  }

  async listTrashedScreens(auth: AuthContext, appId: string) {
    await this.requireApp(auth, appId);
    return this.screens.find({
      where: { tenantId: auth.tenant.id, appId, trashedAt: Not(IsNull()) },
      order: { sortOrder: 'ASC', key: 'ASC' }
    });
  }

  async createScreen(auth: AuthContext, appId: string, body: CreateDynamicScreenRequest) {
    const app = await this.requireApp(auth, appId);
    this.ensureEditableApp(app);
    const key = this.normalizeKey(body.key);
    const title = body.title?.trim();
    if (!key || !title) {
      throw new BadRequestException('key and title are required');
    }
    await this.releaseTrashedScreenKey(auth, key);
    await this.assertActiveScreenKeyAvailable(auth, key);
    const definition = this.normalizeScreenDefinition(body.definition ?? {}, key, title, app.key);
    this.validateScreenDefinition(definition);
    const screen = await this.screens.save(
      this.screens.create({
        tenantId: auth.tenant.id,
        appId: app.id,
        key,
        title,
        description: body.description?.trim() || this.asString(definition.description) || null,
        route: body.route?.trim() || this.asString(definition.route) || `/${key.replace(/_/g, '-')}`,
        target: this.normalizeTarget(body.target ?? definition.target),
        category: body.category?.trim() || this.asString(definition.category) || null,
        sortOrder: this.normalizeSortOrder(body.sortOrder),
        definition: definition as unknown as Record<string, unknown>,
        status: 'draft',
        published: false,
        metadata: null,
        tags: null
      })
    );
    await this.record(auth, 'dynamic_screen.created', 'dynamic_screen', screen.id, { appKey: app.key, key: screen.key });
    return screen;
  }

  async upsertScreenFromJson(auth: AuthContext, body: DynamicScreenJsonAuthoringRequest): Promise<DynamicScreenAuthoringResponse> {
    const definition = body.document ?? body.definition;
    if (!definition) {
      throw new BadRequestException('document is required');
    }
    const app = await this.resolveAuthoringApp(auth, body, definition);
    const key = this.normalizeKey(this.asString(definition['key']));
    const title = this.asString(definition['title']);
    if (!key || !title) {
      throw new BadRequestException('document.key and document.title are required');
    }
    const existing = await this.screens.findOne({
      where: { tenantId: auth.tenant.id, appId: app.id, key, trashedAt: IsNull() }
    });
    const screen = existing
      ? await this.updateScreen(auth, app.id, existing.id, {
          title,
          description: this.asString(definition['description']) || existing.description,
          route: this.asString(definition['route']) || existing.route,
          target: this.normalizeTarget(definition['target']),
          category: this.asString(definition['category']) || existing.category,
          sortOrder: existing.sortOrder,
          definition
        })
      : await this.createScreen(auth, app.id, {
          key,
          title,
          description: this.asString(definition['description']) || null,
          route: this.asString(definition['route']) || null,
          target: this.normalizeTarget(definition['target']),
          category: this.asString(definition['category']) || null,
          definition
        });

    let version: DynamicScreenVersion | null = null;
    if (body.publish) {
      version = await this.createScreenVersion(auth, app.id, screen.id);
      version = await this.publishScreenVersion(auth, app.id, screen.id, version.id);
    }

    return {
      artifactType: 'dynamic_screen',
      id: screen.id,
      key: screen.key,
      appKey: app.key,
      screen,
      version,
      published: Boolean(body.publish)
    };
  }

  async updateScreen(auth: AuthContext, appId: string, screenId: string, body: UpdateDynamicScreenRequest) {
    await this.requireApp(auth, appId);
    const screen = await this.requireScreen(auth, appId, screenId);
    this.ensureEditableScreen(screen);
    const title = body.title?.trim() || screen.title;
    const definition = this.normalizeScreenDefinition(body.definition ?? screen.definition, screen.key, title, undefined);
    this.validateScreenDefinition(definition);
    const saved = await this.screens.save(
      this.screens.merge(screen, {
        title,
        description: body.description === undefined ? screen.description : body.description?.trim() || null,
        route: body.route === undefined ? screen.route : body.route?.trim() || null,
        target: this.normalizeTarget(body.target ?? screen.target),
        category: body.category === undefined ? screen.category : body.category?.trim() || this.asString(definition.category) || null,
        sortOrder: this.normalizeSortOrder(body.sortOrder ?? screen.sortOrder),
        definition: definition as unknown as Record<string, unknown>,
        status: screen.status === 'published' ? 'draft' : screen.status
      })
    );
    await this.record(auth, 'dynamic_screen.updated', 'dynamic_screen', saved.id, { key: saved.key });
    return saved;
  }

  async trashScreen(auth: AuthContext, appId: string, screenId: string) {
    const screen = await this.requireScreen(auth, appId, screenId);
    if (screen.trashedAt) {
      return screen;
    }
    const originalKey = this.originalKeyFromMetadata(screen.metadata) ?? screen.key;
    const saved = await this.screens.save(
      this.screens.merge(screen, {
        key: this.trashKey(screen.key, screen.id),
        metadata: this.withTrashOriginalKey(screen.metadata, originalKey),
        trashedAt: new Date(),
        trashedByUserId: auth.user.id
      })
    );
    await this.record(auth, 'dynamic_screen.trashed', 'dynamic_screen', saved.id, { originalKey });
    return saved;
  }

  async restoreScreen(auth: AuthContext, appId: string, screenId: string, request: RestoreArtifactRequest = {}) {
    const screen = await this.requireTrashedScreen(auth, appId, screenId);
    const restoreKey = this.originalKeyFromMetadata(screen.metadata) ?? this.originalKeyFromTrashKey(screen.key);
    const conflict = await this.screens.findOne({
      where: { tenantId: auth.tenant.id, key: restoreKey, trashedAt: IsNull() }
    });
    if (conflict && conflict.id !== screen.id) {
      if (!request.overwrite) {
        throw new ConflictException('A screen with this key already exists. Confirm overwrite to restore it.');
      }
      await this.trashScreen(auth, conflict.appId, conflict.id);
    }
    const definition = this.normalizeScreenDefinition(screen.definition, restoreKey, screen.title, undefined);
    const saved = await this.screens.save(
      this.screens.merge(screen, {
        key: restoreKey,
        definition: definition as unknown as Record<string, unknown>,
        metadata: this.withoutTrashOriginalKey(screen.metadata),
        trashedAt: null,
        trashedByUserId: null
      })
    );
    await this.record(auth, 'dynamic_screen.restored', 'dynamic_screen', saved.id, { key: saved.key });
    return saved;
  }

  async createScreenVersion(auth: AuthContext, appId: string, screenId: string) {
    const screen = await this.requireScreen(auth, appId, screenId);
    this.ensureEditableScreen(screen);
    const definition = this.normalizeScreenDefinition(screen.definition, screen.key, screen.title, undefined);
    this.validateScreenDefinition(definition);
    const current = await this.screenVersions.findOne({
      where: { tenantId: auth.tenant.id, screenId: screen.id },
      order: { version: 'DESC' }
    });
    const versionNumber = (current?.version ?? 0) + 1;
    const dependencySnapshot = this.screenDependencySnapshot(definition);
    const version = await this.screenVersions.save(
      this.screenVersions.create({
        tenantId: auth.tenant.id,
        appId: screen.appId,
        screenId: screen.id,
        version: versionNumber,
        status: 'draft',
        definition: definition as unknown as Record<string, unknown>,
        dependencySnapshot,
        createdByUserId: auth.user.id
      })
    );
    await this.record(auth, 'dynamic_screen.version.created', 'dynamic_screen', screen.id, { version: version.version });
    return version;
  }

  async publishScreenVersion(auth: AuthContext, appId: string, screenId: string, versionId: string) {
    const screen = await this.requireScreen(auth, appId, screenId);
    this.ensureEditableScreen(screen);
    const version = await this.screenVersions.findOne({
      where: { tenantId: auth.tenant.id, appId, screenId: screen.id, id: versionId }
    });
    if (!version) {
      throw new NotFoundException('Screen version not found');
    }
    this.validateScreenDefinition(this.normalizeScreenDefinition(version.definition, screen.key, screen.title, undefined));
    await this.screenVersions.update(
      { tenantId: auth.tenant.id, appId, screenId: screen.id, status: 'published' },
      { status: 'archived' }
    );
    await this.screenVersions.update(version.id, { status: 'published', publishedAt: new Date() });
    await this.screens
      .createQueryBuilder()
      .update(DynamicScreen)
      .set({
        version: version.version,
        definition: () => ':definition',
        published: true,
        status: 'published',
        publishedVersionId: version.id
      })
      .where('id = :id', { id: screen.id })
      .setParameters({ definition: JSON.stringify(version.definition) })
      .execute();
    await this.record(auth, 'dynamic_screen.version.published', 'dynamic_screen', screen.id, { version: version.version });
    return this.screenVersions.findOneOrFail({ where: { id: version.id } });
  }

  async exportPackage(auth: AuthContext, appId: string): Promise<DynamicAppPackage> {
    const app = await this.requireApp(auth, appId);
    const screens = await this.screens.find({
      where: { tenantId: auth.tenant.id, appId: app.id, trashedAt: IsNull() },
      order: { sortOrder: 'ASC', key: 'ASC' }
    });
    const manifest = this.normalizeManifest(app.manifest, app.key, app.name, app.description, app.targets);
    const packagedScreens = screens.map((screen) => ({
      key: screen.key,
      version: screen.version,
      status: screen.status,
      published: screen.published,
      definition: this.normalizeScreenDefinition(screen.definition, screen.key, screen.title, app.key)
    }));
    const dependencies = this.packageDependencies(manifest, packagedScreens.map((screen) => screen.definition));

    await this.record(auth, 'dynamic_app.package.exported', 'dynamic_app', app.id, {
      key: app.key,
      screens: packagedScreens.length,
      dependencies
    });

    return {
      schemaVersion: 1,
      kind: 'chicle_app_package',
      packageKey: app.key,
      name: app.name,
      description: app.description ?? '',
      exportedAt: new Date().toISOString(),
      app: {
        key: app.key,
        version: app.version,
        status: app.status,
        published: app.published,
        manifest
      },
      screens: packagedScreens,
      dependencies,
      install: {
        mode: 'upsert',
        conflictStrategy: 'active_keys_block',
        publishOnInstall: false
      }
    };
  }

  async installPackage(auth: AuthContext, body: InstallDynamicAppPackageRequest) {
    const packageDocument = body.document ?? body.package;
    const appPackage = this.normalizePackage(packageDocument);
    const appResponse = await this.upsertAppFromJson(auth, {
      document: appPackage.app.manifest,
      publish: false
    });

    const installedScreens: DynamicScreenAuthoringResponse[] = [];
    for (const screen of appPackage.screens) {
      installedScreens.push(
        await this.upsertScreenFromJson(auth, {
          appId: appResponse.app.id,
          document: {
            ...screen.definition,
            appKey: appResponse.app.key
          },
          publish: Boolean(body.publish)
        })
      );
    }

    let appVersion: DynamicAppVersion | null = null;
    if (body.publish) {
      appVersion = await this.createAppVersion(auth, appResponse.app.id);
      appVersion = await this.publishAppVersion(auth, appResponse.app.id, appVersion.id);
    }

    await this.record(auth, 'dynamic_app.package.installed', 'dynamic_app', appResponse.app.id, {
      key: appResponse.app.key,
      screens: installedScreens.length,
      published: Boolean(body.publish)
    });

    return {
      artifactType: 'chicle_app_package',
      key: appResponse.app.key,
      app: appResponse.app,
      appVersion,
      screens: installedScreens,
      dependencies: appPackage.dependencies,
      published: Boolean(body.publish)
    };
  }

  componentCatalog() {
    return [
      { key: 'hero_header', name: 'Header / bienvenida', category: 'structure', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'nav_menu', name: 'Menú de navegación', category: 'navigation', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'side_nav', name: 'Menú lateral', category: 'navigation', targets: ['web', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'bottom_nav', name: 'Menú inferior móvil', category: 'navigation', targets: ['mobile'], kits: ['ionic', 'material', 'bootstrap', 'native'] },
      { key: 'tabs', name: 'Tabs', category: 'structure', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'metric_strip', name: 'Metric strip', category: 'dashboard', targets: ['web', 'desktop'], kits: ['primeng', 'material', 'bootstrap', 'native'] },
      { key: 'chart_panel', name: 'Chart panel', category: 'dashboard', targets: ['web', 'desktop'], kits: ['primeng', 'material', 'bootstrap', 'native'] },
      { key: 'data_table', name: 'Data table', category: 'data', targets: ['admin', 'web', 'desktop'], kits: ['primeng', 'material', 'bootstrap', 'native'] },
      { key: 'search_panel', name: 'Search panel', category: 'data', targets: ['admin', 'web', 'desktop', 'mobile'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'form_runtime', name: 'Dynamic form', category: 'input', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'auth_login', name: 'Login estándar', category: 'security', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'service_button', name: 'Service button', category: 'action', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'flow_button', name: 'Flow button', category: 'action', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'modal_shell', name: 'Modal reusable', category: 'overlay', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'entity_card', name: 'Entity card', category: 'content', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'detail_panel', name: 'Detail panel', category: 'content', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'timeline', name: 'Timeline', category: 'content', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'media_gallery', name: 'Media gallery', category: 'content', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] },
      { key: 'map_view', name: 'Map view', category: 'device', targets: ['web', 'mobile', 'desktop'], kits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'] }
    ];
  }

  private normalizePackage(value: unknown): DynamicAppPackage {
    const packageDocument = this.asObject(value);
    if (!packageDocument) {
      throw new BadRequestException('package document is required');
    }
    if (packageDocument['kind'] !== 'chicle_app_package') {
      throw new BadRequestException('package.kind must be chicle_app_package');
    }
    const app = this.asObject(packageDocument['app']);
    const manifest = this.asObject(app?.['manifest']);
    if (!app || !manifest) {
      throw new BadRequestException('package.app.manifest is required');
    }
    const key = this.normalizeKey(this.asString(manifest['key']) || this.asString(packageDocument['packageKey']));
    const name = this.asString(manifest['name']) || this.asString(packageDocument['name']);
    if (!key || !name) {
      throw new BadRequestException('package app key and name are required');
    }
    const screens = Array.isArray(packageDocument['screens']) ? packageDocument['screens'] : [];
    const normalizedScreens = screens.map((screen, index) => {
      const screenObject = this.asObject(screen) ?? {};
      const definition = this.asObject(screenObject['definition']) ?? screenObject;
      const screenKey = this.normalizeKey(this.asString(definition['key']));
      const title = this.asString(definition['title']);
      if (!screenKey || !title) {
        throw new BadRequestException(`screens[${index}] requires definition.key and definition.title`);
      }
      return {
        key: screenKey,
        version: typeof screenObject['version'] === 'number' ? screenObject['version'] : 1,
        status: 'draft' as const,
        published: false,
        definition: this.normalizeScreenDefinition(definition, screenKey, title, key)
      };
    });
    const normalizedManifest = this.normalizeManifest(manifest, key, name, this.asString(manifest['description']), manifest['targets']);
    return {
      schemaVersion: 1,
      kind: 'chicle_app_package',
      packageKey: key,
      name,
      description: this.asString(packageDocument['description']) || this.asString(normalizedManifest.description),
      exportedAt: this.asString(packageDocument['exportedAt']) || new Date().toISOString(),
      app: {
        key,
        version: 1,
        status: 'draft',
        published: false,
        manifest: normalizedManifest
      },
      screens: normalizedScreens,
      dependencies: this.packageDependencies(
        normalizedManifest,
        normalizedScreens.map((screen) => screen.definition)
      ),
      install: {
        mode: 'upsert',
        conflictStrategy: 'active_keys_block',
        publishOnInstall: false
      }
    };
  }

  private packageDependencies(manifest: DynamicAppManifest, screenDefinitions: DynamicScreenDefinition[]) {
    const componentKeys = new Set<string>();
    const formKeys = new Set<string>();
    const serviceKeys = new Set<string>();
    const flowKeys = new Set<string>();
    const textNamespaces = new Set<string>();
    const customTables = new Set<string>();

    const appText = this.asObject(manifest.text);
    const appNamespace = this.asString(appText?.['namespace']);
    if (appNamespace) {
      textNamespaces.add(appNamespace);
    }

    for (const screen of screenDefinitions) {
      const textNamespace = this.asString(screen.textNamespace);
      if (textNamespace) {
        textNamespaces.add(textNamespace);
      }

      for (const component of screen.components ?? []) {
        const componentKey = this.asString(component.componentKey);
        if (componentKey) {
          componentKeys.add(componentKey);
        }
        const inputs = component.inputs ?? {};
        this.addStringSet(formKeys, inputs['formKey']);
        this.addStringSet(serviceKeys, inputs['serviceKey']);
        this.addStringSet(flowKeys, inputs['flowKey']);
        this.addStringSet(customTables, inputs['table']);
        this.addStringSet(customTables, inputs['tableName']);
      }
      for (const dataSource of screen.dataSources ?? []) {
        this.addStringSet(serviceKeys, dataSource['serviceKey']);
        this.addStringSet(formKeys, dataSource['formKey']);
        this.addStringSet(flowKeys, dataSource['flowKey']);
        this.addStringSet(customTables, dataSource['table']);
      }
    }

    return {
      componentKeys: Array.from(componentKeys).sort(),
      formKeys: Array.from(formKeys).sort(),
      serviceKeys: Array.from(serviceKeys).sort(),
      flowKeys: Array.from(flowKeys).sort(),
      textNamespaces: Array.from(textNamespaces).sort(),
      customTables: Array.from(customTables).sort()
    };
  }

  private addStringSet(target: Set<string>, value: unknown) {
    const item = this.asString(value);
    if (item) {
      target.add(item);
    }
  }

  private async resolveAuthoringApp(auth: AuthContext, body: DynamicScreenJsonAuthoringRequest, definition: Record<string, unknown>) {
    if (body.appId) {
      return this.requireApp(auth, body.appId);
    }
    const appKey = this.normalizeKey(body.appKey ?? this.asString(definition['appKey']));
    if (appKey) {
      return this.requireAppByKey(auth, appKey);
    }
    const firstApp = await this.apps.findOne({
      where: { tenantId: auth.tenant.id, trashedAt: IsNull() },
      order: { createdAt: 'ASC' }
    });
    if (!firstApp) {
      throw new BadRequestException('appKey or appId is required when no app exists');
    }
    return firstApp;
  }

  private async appDependencySnapshot(auth: AuthContext, appId: string) {
    const screens = await this.screens.find({
      where: { tenantId: auth.tenant.id, appId, trashedAt: IsNull() },
      order: { sortOrder: 'ASC', key: 'ASC' }
    });
    return {
      screens: screens.map((screen) => ({
        key: screen.key,
        version: screen.version,
        published: screen.published
      }))
    };
  }

  private screenDependencySnapshot(definition: DynamicScreenDefinition) {
    const components = definition.components ?? [];
    return {
      componentKeys: Array.from(new Set(components.map((item) => item.componentKey).filter(Boolean))),
      formKeys: this.collectInputKeys(components, 'formKey'),
      serviceKeys: this.collectInputKeys(components, 'serviceKey'),
      flowKeys: this.collectInputKeys(components, 'flowKey')
    };
  }

  private collectInputKeys(components: DynamicScreenComponentDefinition[], inputKey: string) {
    const values = components
      .map((component) => component.inputs?.[inputKey])
      .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()));
    return Array.from(new Set(values));
  }

  private async resolveAppRuntimeVersion(auth: AuthContext, app: DynamicApp) {
    if (app.publishedVersionId) {
      return this.appVersions.findOne({
        where: { tenantId: auth.tenant.id, appId: app.id, id: app.publishedVersionId, status: 'published' }
      });
    }
    return this.appVersions.findOne({
      where: { tenantId: auth.tenant.id, appId: app.id, status: 'published' },
      order: { version: 'DESC' }
    });
  }

  private async resolveScreenRuntimeVersion(auth: AuthContext, screen: DynamicScreen) {
    if (screen.publishedVersionId) {
      return this.screenVersions.findOne({
        where: { tenantId: auth.tenant.id, screenId: screen.id, id: screen.publishedVersionId, status: 'published' }
      });
    }
    return this.screenVersions.findOne({
      where: { tenantId: auth.tenant.id, screenId: screen.id, status: 'published' },
      order: { version: 'DESC' }
    });
  }

  private async requireAppByKey(auth: AuthContext, key: string) {
    const app = await this.apps.findOne({
      where: { tenantId: auth.tenant.id, key: this.normalizeKey(key), trashedAt: IsNull() }
    });
    if (!app) {
      throw new NotFoundException('App not found');
    }
    return app;
  }

  private async requireApp(auth: AuthContext, appId: string) {
    const app = await this.apps.findOne({ where: { tenantId: auth.tenant.id, id: appId } });
    if (!app) {
      throw new NotFoundException('App not found');
    }
    return app;
  }

  private async requireTrashedApp(auth: AuthContext, appId: string) {
    const app = await this.apps.findOne({ where: { tenantId: auth.tenant.id, id: appId } });
    if (!app || !app.trashedAt) {
      throw new NotFoundException('Trashed app not found');
    }
    return app;
  }

  private async requireScreen(auth: AuthContext, appId: string, screenId: string) {
    const screen = await this.screens.findOne({ where: { tenantId: auth.tenant.id, appId, id: screenId } });
    if (!screen) {
      throw new NotFoundException('Screen not found');
    }
    return screen;
  }

  private async requireTrashedScreen(auth: AuthContext, appId: string, screenId: string) {
    const screen = await this.screens.findOne({ where: { tenantId: auth.tenant.id, appId, id: screenId } });
    if (!screen || !screen.trashedAt) {
      throw new NotFoundException('Trashed screen not found');
    }
    return screen;
  }

  private ensureEditableApp(app: DynamicApp) {
    if (app.trashedAt) {
      throw new BadRequestException('Restore the app before editing it');
    }
  }

  private ensureEditableScreen(screen: DynamicScreen) {
    if (screen.trashedAt) {
      throw new BadRequestException('Restore the screen before editing it');
    }
  }

  private async assertActiveAppKeyAvailable(auth: AuthContext, key: string) {
    const existing = await this.apps.findOne({ where: { tenantId: auth.tenant.id, key, trashedAt: IsNull() } });
    if (existing) {
      throw new ConflictException('An app with this key already exists');
    }
  }

  private async assertActiveScreenKeyAvailable(auth: AuthContext, key: string) {
    const existing = await this.screens.findOne({ where: { tenantId: auth.tenant.id, key, trashedAt: IsNull() } });
    if (existing) {
      throw new ConflictException('A screen with this key already exists');
    }
  }

  private async releaseTrashedAppKey(auth: AuthContext, key: string) {
    const trashed = await this.apps.findOne({ where: { tenantId: auth.tenant.id, key, trashedAt: Not(IsNull()) } });
    if (!trashed) {
      return;
    }
    const originalKey = this.originalKeyFromMetadata(trashed.metadata) ?? key;
    await this.apps.save(
      this.apps.merge(trashed, {
        key: this.trashKey(key, trashed.id),
        metadata: this.withTrashOriginalKey(trashed.metadata, originalKey)
      })
    );
  }

  private async releaseTrashedScreenKey(auth: AuthContext, key: string) {
    const trashed = await this.screens.findOne({ where: { tenantId: auth.tenant.id, key, trashedAt: Not(IsNull()) } });
    if (!trashed) {
      return;
    }
    const originalKey = this.originalKeyFromMetadata(trashed.metadata) ?? key;
    await this.screens.save(
      this.screens.merge(trashed, {
        key: this.trashKey(key, trashed.id),
        metadata: this.withTrashOriginalKey(trashed.metadata, originalKey)
      })
    );
  }

  private normalizeManifest(
    manifest: Record<string, unknown>,
    key: string,
    name: string,
    description?: string | null,
    targets?: unknown
  ): DynamicAppManifest {
    return {
      schemaVersion: 1,
      kind: 'dynamic_app',
      ...manifest,
      key,
      name,
      description: this.asString(manifest['description']) || description || '',
      targets: this.normalizeTargets(targets ?? manifest['targets'])
    };
  }

  private normalizeScreenDefinition(
    definition: Record<string, unknown>,
    key: string,
    title: string,
    appKey?: string
  ): DynamicScreenDefinition {
    const components = Array.isArray(definition['components']) ? definition['components'] : [];
    return {
      schemaVersion: 1,
      kind: 'dynamic_screen',
      layout: {
        strategy: 'responsive_regions',
        regions: ['header', 'content', 'actions'],
        ...(this.asObject(definition['layout']) ?? {})
      },
      regions: Array.isArray(definition['regions']) ? (definition['regions'] as Array<Record<string, unknown>>) : [],
      dataSources: Array.isArray(definition['dataSources']) ? (definition['dataSources'] as Array<Record<string, unknown>>) : [],
      actions: Array.isArray(definition['actions']) ? (definition['actions'] as Array<Record<string, unknown>>) : [],
      permissions: Array.isArray(definition['permissions']) ? (definition['permissions'] as string[]) : [],
      ...definition,
      key,
      title,
      appKey: this.asString(definition['appKey']) || appKey,
      target: this.normalizeTarget(definition['target']),
      components: components.map((component, index) => this.normalizeScreenComponent(component, index))
    };
  }

  private normalizeScreenComponent(component: unknown, index: number): DynamicScreenComponentDefinition {
    const value = this.asObject(component) ?? {};
    const componentKey = this.asString(value['componentKey']) || 'entity_card';
    return {
      id: this.asString(value['id']) || `${componentKey}_${index + 1}`,
      componentKey,
      title: this.asString(value['title']) || this.titleFromKey(componentKey),
      region: this.asString(value['region']) || 'content',
      order: typeof value['order'] === 'number' ? value['order'] : index + 1,
      inputs: this.asObject(value['inputs']) ?? {},
      bindings: this.asObject(value['bindings']) ?? {},
      actions: Array.isArray(value['actions']) ? (value['actions'] as Array<Record<string, unknown>>) : [],
      visibility: this.asObject(value['visibility']) ?? {},
      layout: this.asObject(value['layout']) ?? {}
    };
  }

  private validateManifest(manifest: DynamicAppManifest) {
    if (manifest.kind !== 'dynamic_app') {
      throw new BadRequestException('manifest.kind must be dynamic_app');
    }
    if (!this.normalizeKey(manifest.key) || !this.asString(manifest.name)) {
      throw new BadRequestException('manifest.key and manifest.name are required');
    }
  }

  private validateScreenDefinition(definition: DynamicScreenDefinition) {
    if (definition.kind !== 'dynamic_screen') {
      throw new BadRequestException('definition.kind must be dynamic_screen');
    }
    if (!this.normalizeKey(definition.key) || !this.asString(definition.title)) {
      throw new BadRequestException('definition.key and definition.title are required');
    }
    const components = definition.components ?? [];
    for (const component of components) {
      if (!this.asString(component.componentKey)) {
        throw new BadRequestException('Each screen component requires componentKey');
      }
    }
  }

  private normalizeKey(value: unknown) {
    if (typeof value !== 'string') {
      return '';
    }
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120);
  }

  private normalizeTargets(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return ['web', 'mobile'];
    }
    const targets = value
      .map((item) => this.asString(item))
      .filter((item): item is string => Boolean(item))
      .map((item) => item.toLowerCase());
    return targets.length ? Array.from(new Set(targets)) : ['web', 'mobile'];
  }

  private normalizeTarget(value: unknown): DynamicScreenTarget {
    return value === 'admin' || value === 'web' || value === 'mobile' || value === 'desktop' || value === 'multi'
      ? value
      : 'multi';
  }

  private normalizeSortOrder(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 100;
  }

  private titleFromKey(key: string) {
    return key
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private asString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }

  private trashKey(key: string, id: string) {
    const suffix = `__trashed_${id.replace(/-/g, '').slice(0, 8) || Date.now().toString(36)}`;
    return `${key.slice(0, 120 - suffix.length)}${suffix}`;
  }

  private originalKeyFromTrashKey(key: string) {
    return key.replace(/__trashed_[a-z0-9]{8}$/i, '');
  }

  private originalKeyFromMetadata(metadata?: Record<string, unknown> | null) {
    const trash = metadata?.['trash'];
    if (trash && typeof trash === 'object' && !Array.isArray(trash)) {
      const originalKey = (trash as Record<string, unknown>)['originalKey'];
      return typeof originalKey === 'string' && originalKey ? originalKey : null;
    }
    return null;
  }

  private withTrashOriginalKey(metadata: Record<string, unknown> | null | undefined, originalKey: string) {
    const base = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
    return {
      ...base,
      trash: {
        ...((base['trash'] && typeof base['trash'] === 'object' && !Array.isArray(base['trash'])
          ? base['trash']
          : {}) as Record<string, unknown>),
        originalKey
      }
    };
  }

  private withoutTrashOriginalKey(metadata: Record<string, unknown> | null | undefined) {
    if (!metadata) {
      return null;
    }
    const { trash: _trash, ...rest } = metadata;
    return Object.keys(rest).length ? rest : null;
  }

  private async record(
    auth: AuthContext,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ) {
    try {
      await this.audit.record({ auth, action, resourceType, resourceId, metadata });
    } catch {
      // Audit must not block designer authoring.
    }
  }
}

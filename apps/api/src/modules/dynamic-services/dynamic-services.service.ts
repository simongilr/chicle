import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import { RbacService } from '../rbac/rbac.service';
import { Tenant } from '../tenants/tenant.entity';
import { DynamicService } from './dynamic-service.entity';
import {
  DynamicServiceDefinition,
  DynamicServiceFilter,
  DynamicServiceHttpMethod,
  DynamicServiceJoin,
  DynamicServicePublicExposure,
  DynamicServiceSelectField,
  DynamicServiceVersion
} from './dynamic-service-version.entity';
import { DynamicServiceRun, DynamicServiceRunStatus, DynamicServiceRunTrigger } from './dynamic-service-run.entity';

export interface DynamicServiceUpsertRequest {
  key?: string;
  name?: string;
  description?: string | null;
  active?: boolean;
}

export interface DynamicServiceVersionRequest {
  definition?: DynamicServiceDefinition;
}

export interface DynamicServiceTestRequest {
  context?: Record<string, unknown>;
}

export interface DynamicServiceExecuteRequest {
  context?: Record<string, unknown>;
}

export interface DynamicServicePublicExecuteRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, unknown>;
  body?: unknown;
}

export interface DynamicServiceJsonAuthoringRequest {
  key?: string;
  name?: string;
  description?: string | null;
  active?: boolean;
  document?: DynamicServiceDefinition;
  definition?: DynamicServiceDefinition;
  publish?: boolean;
}

export interface RestoreDynamicServiceRequest {
  overwrite?: boolean;
}

interface ServiceLimits {
  defaultTimeoutMs: number;
  maxTimeoutMs: number;
  maxResponseBytes: number;
  allowPrivateHosts: boolean;
}

interface InternalQueryPlan {
  primaryTable: ServiceCatalogTable;
  tables: ServiceCatalogTable[];
  selectSql: string;
  fromSql: string;
  whereSql: string[];
  params: unknown[];
  limit: number;
}

interface QueryAliasContext {
  primaryAlias: string;
  tablesByAlias: Map<string, ServiceCatalogTable>;
}

interface RenderContext {
  tenant: AuthContext['tenant'];
  user: AuthContext['user'];
  input: Record<string, unknown>;
}

interface InformationSchemaTableRow {
  tableName?: string;
  table_name?: string;
  TABLE_NAME?: string;
}

interface InformationSchemaColumnRow {
  name?: string;
  column_name?: string;
  COLUMN_NAME?: string;
  type?: string;
  data_type?: string;
  DATA_TYPE?: string;
  nullable?: string;
  is_nullable?: string;
  IS_NULLABLE?: string;
  columnKey?: string;
  column_key?: string;
  COLUMN_KEY?: string;
}

export interface ServiceCatalogColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
}

export interface ServiceCatalogTable {
  name: string;
  scope: 'tenant' | 'current_tenant' | 'global';
  source: 'entity' | 'schema';
  columns: ServiceCatalogColumn[];
}

const HTTP_METHODS: DynamicServiceHttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const SECRET_HEADER_PATTERN = /authorization|api[-_]?key|token|secret|cookie/i;
const SERVICE_CATALOG_GLOBAL_TABLES = new Set(['confisys', 'permissions']);
const SERVICE_CATALOG_BLOCKED_TABLES = new Set([
  'audit_events',
  'auth_login_attempts',
  'auth_sessions',
  'flow_action_catalog',
  'flow_decision_tables',
  'flow_expressions',
  'flow_runs',
  'flow_step_runs',
  'flow_steps',
  'flow_test_cases',
  'flow_triggers',
  'flow_versions',
  'flows',
  'migrations',
  'role_permissions',
  'role_resource_grants',
  'role_resource_policies',
  'schema_changes',
]);

@Injectable()
export class DynamicServicesService {
  constructor(
    @InjectRepository(DynamicService)
    private readonly services: Repository<DynamicService>,
    @InjectRepository(DynamicServiceVersion)
    private readonly versions: Repository<DynamicServiceVersion>,
    @InjectRepository(DynamicServiceRun)
    private readonly runs: Repository<DynamicServiceRun>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    private readonly dataSource: DataSource,
    private readonly confisys: ConfisysService,
    private readonly audit: AuditService,
    private readonly rbac: RbacService
  ) {}

  async tableCatalog() {
    const rows = (await this.dataSource.query(
      `
        SELECT table_name AS tableName
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
    )) as InformationSchemaTableRow[];

    const tables: ServiceCatalogTable[] = [];
    for (const row of rows) {
      const tableName = row.tableName ?? row.table_name ?? row.TABLE_NAME;
      if (!tableName || SERVICE_CATALOG_BLOCKED_TABLES.has(tableName)) {
        continue;
      }

      const columns = await this.tableColumns(tableName);
      const scope = this.catalogScope(
        tableName,
        columns.some((column) => column.name === 'tenantId' || column.name === 'tenant_id')
      );
      if (!scope) {
        continue;
      }

      tables.push({
        name: tableName,
        scope,
        source: tableName.startsWith('custom_') ? 'schema' : 'entity',
        columns: columns.filter((column) => !/password|token|secret|hash/i.test(column.name))
      });
    }

    return { tables };
  }

  async list(auth: AuthContext) {
    const services = await this.services.find({
      where: { tenantId: auth.tenant.id, trashedAt: IsNull() },
      order: { key: 'ASC' }
    });
    return this.withVersions(auth, services);
  }

  async listAvailable(auth: AuthContext) {
    const services = await this.services.find({
      where: { tenantId: auth.tenant.id, active: true, trashedAt: IsNull() },
      order: { name: 'ASC' }
    });
    const withVersions = await this.withVersions(auth, services);
    const executable = withVersions.filter((service) => Boolean(service.publishedVersion));
    const allowedIds = new Set(
      await this.rbac.filterAccessibleResourceIds(
        auth,
        'dynamic_service',
        executable.map((service) => service.id)
      )
    );
    return executable
      .filter((service) => allowedIds.has(service.id))
      .map((service) => ({
        id: service.id,
        key: service.key,
        name: service.name,
        description: service.description,
        type: service.type,
        version: service.publishedVersion?.version ?? null
      }));
  }

  async listTrashed(auth: AuthContext) {
    const services = await this.services
      .createQueryBuilder('service')
      .where('service.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .andWhere('service.trashedAt IS NOT NULL')
      .orderBy('service.trashedAt', 'DESC')
      .getMany();
    return this.withVersions(auth, services);
  }

  private async withVersions(auth: AuthContext, services: DynamicService[]) {
    const serviceIds = services.map((service) => service.id);
    const versions = serviceIds.length
      ? await this.versions
          .createQueryBuilder('version')
          .where('version.tenantId = :tenantId', { tenantId: auth.tenant.id })
          .andWhere('version.serviceId IN (:...serviceIds)', { serviceIds })
          .orderBy('version.version', 'DESC')
          .getMany()
      : [];
    const latestByService = new Map<string, DynamicServiceVersion>();
    const publishedByService = new Map<string, DynamicServiceVersion>();

    for (const version of versions) {
      if (!latestByService.has(version.serviceId)) {
        latestByService.set(version.serviceId, version);
      }
      if (version.status === 'published' && !publishedByService.has(version.serviceId)) {
        publishedByService.set(version.serviceId, version);
      }
    }

    return services.map((service) => ({
      ...service,
      latestVersion: latestByService.get(service.id) ?? null,
      publishedVersion: publishedByService.get(service.id) ?? null
    }));
  }

  async create(auth: AuthContext, request: DynamicServiceUpsertRequest) {
    const key = this.normalizeKey(request.key);
    const name = this.cleanName(request.name);
    await this.releaseTrashedKey(auth, key);
    await this.assertActiveKeyAvailable(auth, key);
    const service = await this.services.save(
      this.services.create({
        tenantId: auth.tenant.id,
        key,
        name,
        description: request.description ?? null,
        active: request.active ?? true,
        type: 'http_request'
      })
    );

    await this.audit.record({
      auth,
      action: 'dynamic_service.created',
      resourceType: 'dynamic_service',
      resourceId: service.id,
      metadata: { key: service.key, name: service.name }
    });

    return service;
  }

  async update(auth: AuthContext, serviceId: string, request: DynamicServiceUpsertRequest) {
    const service = await this.requireService(auth, serviceId);
    const nextKey = request.key ? this.normalizeKey(request.key) : service.key;
    if (nextKey !== service.key) {
      await this.releaseTrashedKey(auth, nextKey);
      await this.assertActiveKeyAvailable(auth, nextKey, service.id);
    }
    const next = this.services.merge(service, {
      key: nextKey,
      name: request.name ? this.cleanName(request.name) : service.name,
      description: request.description ?? service.description,
      active: request.active ?? service.active
    });

    const saved = await this.services.save(next);
    await this.audit.record({
      auth,
      action: 'dynamic_service.updated',
      resourceType: 'dynamic_service',
      resourceId: saved.id,
      metadata: { key: saved.key, active: saved.active }
    });

    return saved;
  }

  async upsertFromJson(auth: AuthContext, request: DynamicServiceJsonAuthoringRequest) {
    const definition = this.validateDefinition(request.document ?? request.definition);
    const definitionMeta = definition as unknown as Record<string, unknown>;
    const key = this.normalizeKey(request.key ?? definitionMeta['key']?.toString());
    const name = this.cleanName(request.name ?? definitionMeta['name']?.toString() ?? key);
    const existing = await this.services.findOne({
      where: { tenantId: auth.tenant.id, key, trashedAt: IsNull() }
    });
    const service = existing
      ? await this.update(auth, existing.id, {
          key,
          name,
          description: request.description ?? existing.description,
          active: request.active ?? existing.active
        })
      : await this.create(auth, {
          key,
          name,
          description: request.description ?? null,
          active: request.active ?? true
        });
    const version = await this.createVersion(auth, service.id, { definition });
    const publishedVersion = request.publish ? await this.publishVersion(auth, service.id, version.id) : null;
    return {
      artifactType: 'dynamic_service',
      id: service.id,
      key: service.key,
      service,
      version: publishedVersion ?? version,
      published: Boolean(request.publish)
    };
  }

  async trash(auth: AuthContext, serviceId: string) {
    const service = await this.requireService(auth, serviceId);
    if (service.trashedAt) {
      return service;
    }

    const saved = await this.services.save(
      this.services.merge(service, {
        key: this.trashKey(service.key, service.id),
        active: false,
        trashedAt: new Date(),
        trashedByUserId: auth.user.id
      })
    );
    await this.audit.record({
      auth,
      action: 'dynamic_service.trashed',
      resourceType: 'dynamic_service',
      resourceId: saved.id,
      metadata: { key: saved.key }
    });
    return saved;
  }

  async restore(auth: AuthContext, serviceId: string, request: RestoreDynamicServiceRequest = {}) {
    const service = await this.requireTrashedService(auth, serviceId);
    const restoreKey = this.originalKeyFromTrashKey(service.key);
    const conflict = await this.services.findOne({
      where: { tenantId: auth.tenant.id, key: restoreKey, trashedAt: IsNull() }
    });
    if (conflict && conflict.id !== service.id) {
      if (!request.overwrite) {
        throw new ConflictException('A dynamic service with this key already exists. Confirm overwrite to restore it.');
      }
      await this.trash(auth, conflict.id);
    }
    const saved = await this.services.save(
      this.services.merge(service, {
        key: restoreKey,
        active: true,
        trashedAt: null,
        trashedByUserId: null
      })
    );
    await this.audit.record({
      auth,
      action: 'dynamic_service.restored',
      resourceType: 'dynamic_service',
      resourceId: saved.id,
      metadata: { key: saved.key }
    });
    return saved;
  }

  async createVersion(auth: AuthContext, serviceId: string, request: DynamicServiceVersionRequest) {
    const service = await this.requireService(auth, serviceId);
    const definition = this.validateDefinition(request.definition);
    const latest = await this.versions.findOne({
      where: { tenantId: auth.tenant.id, serviceId: service.id },
      order: { version: 'DESC' }
    });
    const version = await this.versions.save(
      this.versions.create({
        tenantId: auth.tenant.id,
        serviceId: service.id,
        version: (latest?.version ?? 0) + 1,
        status: 'draft',
        definition,
        createdByUserId: auth.user.id
      })
    );

    await this.audit.record({
      auth,
      action: 'dynamic_service.version.created',
      resourceType: 'dynamic_service',
      resourceId: service.id,
      metadata: { version: version.version }
    });

    return version;
  }

  async publishVersion(auth: AuthContext, serviceId: string, versionId: string) {
    const service = await this.requireService(auth, serviceId);
    const version = await this.requireVersion(auth, service.id, versionId);
    await this.versions.manager.transaction(async (manager) => {
      await manager.update(
        DynamicServiceVersion,
        { tenantId: auth.tenant.id, serviceId: service.id, status: 'published' },
        { status: 'archived' }
      );
      await manager.update(
        DynamicServiceVersion,
        { id: version.id, tenantId: auth.tenant.id },
        { status: 'published', publishedAt: new Date() }
      );
    });

    await this.audit.record({
      auth,
      action: 'dynamic_service.version.published',
      resourceType: 'dynamic_service',
      resourceId: service.id,
      metadata: { version: version.version }
    });

    return this.requireVersion(auth, service.id, version.id);
  }

  async listRuns(auth: AuthContext, serviceId: string) {
    await this.requireService(auth, serviceId);
    return this.runs.find({
      where: { tenantId: auth.tenant.id, serviceId },
      order: { createdAt: 'DESC' },
      take: 30
    });
  }

  async test(auth: AuthContext, serviceId: string, request: DynamicServiceTestRequest) {
    const service = await this.requireService(auth, serviceId);
    await this.assertResourceAccess(auth, service.id);
    return this.executePublished(auth, service, request.context ?? {}, 'manual_test');
  }

  async executeByKey(
    auth: AuthContext,
    serviceKey: string,
    request: DynamicServiceExecuteRequest,
    options: { skipResourceAccess?: boolean } = {}
  ) {
    const service = await this.requireServiceByKey(auth, this.normalizeKey(serviceKey));
    if (!options.skipResourceAccess) {
      await this.assertResourceAccess(auth, service.id);
    }
    return this.executePublished(auth, service, request.context ?? {}, 'frontend');
  }

  async executePublicByKey(tenantSlug: string, serviceKey: string, request: DynamicServicePublicExecuteRequest) {
    const method = this.publicMethod(request.method);
    const tenant = await this.tenants.findOne({ where: { slug: tenantSlug, active: true } });
    if (!tenant) {
      throw new NotFoundException('Public service not found');
    }

    const service = await this.services.findOne({
      where: { key: this.normalizeKey(serviceKey), tenantId: tenant.id, active: true, trashedAt: IsNull() }
    });
    if (!service) {
      throw new NotFoundException('Public service not found');
    }

    const version = await this.versions.findOne({
      where: { tenantId: tenant.id, serviceId: service.id, status: 'published' },
      order: { version: 'DESC' }
    });
    if (!version) {
      throw new NotFoundException('Public service not found');
    }

    const exposure = version.definition.exposure;
    this.assertPublicExposure(version.definition, exposure, method, request.headers);

    const input = this.publicInput(exposure, method, request.query ?? {}, request.body);
    const run = await this.executePublished(this.publicAuthContext(tenant), service, input, 'public_api');
    return this.publicResponse(run, exposure);
  }

  private async assertResourceAccess(auth: AuthContext, serviceId: string) {
    if (!(await this.rbac.canAccessResource(auth, 'dynamic_service', serviceId))) {
      throw new ForbiddenException('This role cannot execute the requested service');
    }
  }

  private async executePublished(
    auth: AuthContext,
    service: DynamicService,
    input: Record<string, unknown>,
    triggerType: DynamicServiceRunTrigger
  ) {
    if (!service.active) {
      throw new BadRequestException('Service is inactive');
    }

    const version = await this.versions.findOne({
      where: { tenantId: auth.tenant.id, serviceId: service.id, status: 'published' },
      order: { version: 'DESC' }
    });
    if (!version) {
      throw new BadRequestException('Publish a service version before executing it');
    }

    if (version.definition.source === 'internal_table') {
      return this.executeInternalTable(auth, service, version, input, triggerType);
    }

    return this.executeHttp(auth, service, version, input, triggerType);
  }

  private async executeInternalTable(
    auth: AuthContext,
    service: DynamicService,
    version: DynamicServiceVersion,
    input: Record<string, unknown>,
    triggerType: DynamicServiceRunTrigger
  ) {
    const intent = version.definition.intent ?? 'query';
    if (intent === 'create' || intent === 'update' || intent === 'delete') {
      return this.executeInternalWrite(auth, service, version, input, triggerType);
    }

    return this.executeInternalQuery(auth, service, version, input, triggerType);
  }

  private async executeInternalQuery(
    auth: AuthContext,
    service: DynamicService,
    version: DynamicServiceVersion,
    input: Record<string, unknown>,
    triggerType: DynamicServiceRunTrigger
  ) {
    const definition = version.definition;
    const run = await this.runs.save(
      this.runs.create({
        tenantId: auth.tenant.id,
        serviceId: service.id,
        versionId: version.id,
        triggerType,
        status: 'running',
        requestSnapshot: {
          type: 'internal_table',
          table: definition.dataTarget?.primaryTable,
          filters: definition.dataTarget?.filters ?? [],
          input: this.maskSecrets(input)
        },
        actorUserId: auth.user.id ?? null
      })
    );

    const started = Date.now();
    try {
      const plan = await this.internalQueryPlan(auth, definition, input);
      const sql = `SELECT ${plan.selectSql} FROM ${plan.fromSql}${
        plan.whereSql.length ? ` WHERE ${plan.whereSql.join(' AND ')}` : ''
      } LIMIT ?`;
      const rows = (await this.dataSource.query(sql, [...plan.params, plan.limit])) as Record<string, unknown>[];
      const safeRows = rows.map((row) => this.maskSecrets(row));
      const baseResponseSnapshot = {
        table: plan.primaryTable.name,
        tables: plan.tables.map((table) => table.name),
        queryMode: definition.dataTarget?.queryMode ?? 'single_table',
        count: safeRows.length,
        rows: safeRows,
        result:
          definition.resultKind === 'boolean'
            ? safeRows.length > 0
            : definition.resultKind === 'single'
              ? safeRows[0] ?? null
              : safeRows
      };
      const responseSnapshot = this.withMappedResponse(baseResponseSnapshot, definition.responseMap);
      const saved = await this.finishRun(run.id, 'success', started, { responseSnapshot });
      await this.audit.record({
        auth,
        action: 'dynamic_service.executed',
        resourceType: 'dynamic_service',
        resourceId: service.id,
        metadata: {
          runId: run.id,
          mode: 'internal_table',
          queryMode: definition.dataTarget?.queryMode ?? 'single_table',
          tables: plan.tables.map((table) => table.name),
          count: safeRows.length
        }
      });
      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown internal service execution error';
      return this.finishRun(run.id, 'failed', started, { error: message });
    }
  }

  private async executeInternalWrite(
    auth: AuthContext,
    service: DynamicService,
    version: DynamicServiceVersion,
    input: Record<string, unknown>,
    triggerType: DynamicServiceRunTrigger
  ) {
    const definition = version.definition;
    const intent = definition.intent;
    const run = await this.runs.save(
      this.runs.create({
        tenantId: auth.tenant.id,
        serviceId: service.id,
        versionId: version.id,
        triggerType,
        status: 'running',
        requestSnapshot: {
          type: 'internal_table_write',
          intent,
          table: definition.dataTarget?.primaryTable,
          writeMap: Object.keys(definition.dataTarget?.writeMap ?? {}),
          filters: definition.dataTarget?.filters ?? [],
          input: this.maskSecrets(input)
        },
        actorUserId: auth.user.id ?? null
      })
    );

    const started = Date.now();
    try {
      if (definition.dataTarget?.queryMode && definition.dataTarget.queryMode !== 'single_table') {
        throw new BadRequestException('Internal write only supports single_table mode');
      }
      const tableName = definition.dataTarget?.primaryTable?.trim();
      if (!tableName) {
        throw new BadRequestException('Internal write table is required');
      }
      const table = await this.visibleServiceTable(tableName);
      const responseSnapshot =
        intent === 'create'
          ? await this.insertInternalRow(auth, definition, table, input)
          : intent === 'update'
            ? await this.updateInternalRows(auth, definition, table, input)
            : await this.deleteInternalRows(auth, definition, table, input);

      const saved = await this.finishRun(run.id, 'success', started, {
        responseSnapshot: this.withMappedResponse(responseSnapshot, definition.responseMap)
      });
      await this.audit.record({
        auth,
        action: 'dynamic_service.executed',
        resourceType: 'dynamic_service',
        resourceId: service.id,
        metadata: {
          runId: run.id,
          mode: 'internal_table_write',
          intent,
          table: table.name,
          affectedRows: responseSnapshot['affectedRows']
        }
      });
      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown internal service execution error';
      return this.finishRun(run.id, 'failed', started, { error: message });
    }
  }

  private async executeHttp(
    auth: AuthContext,
    service: DynamicService,
    version: DynamicServiceVersion,
    input: Record<string, unknown>,
    triggerType: DynamicServiceRunTrigger
  ) {
    const limits = this.serviceLimits();
    const context: RenderContext = { tenant: auth.tenant, user: auth.user, input };
    const definition = version.definition;
    const timeoutMs = this.resolveTimeout(definition.timeoutMs, limits);
    const run = await this.runs.save(
      this.runs.create({
        tenantId: auth.tenant.id,
        serviceId: service.id,
        versionId: version.id,
        triggerType,
        status: 'running',
        requestSnapshot: null,
        timeoutMs,
        actorUserId: auth.user.id ?? null
      })
    );

    const started = Date.now();
    try {
      const url = await this.renderAndValidateUrl(definition.url, definition.query, context, limits);
      const headers = this.renderRecord(definition.headers ?? {}, context);
      const body = this.renderBody(definition.body, context);
      const requestSnapshot = this.requestSnapshot(definition.method, url, headers, body);
      await this.runs.update({ id: run.id }, { requestSnapshot } as any);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetch(url.toString(), {
          method: definition.method,
          headers,
          body: this.requestBody(definition.method, body),
          redirect: 'manual',
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      const baseResponseSnapshot = await this.responseSnapshot(response, limits);
      const responseSnapshot = this.withMappedResponse(baseResponseSnapshot, definition.responseMap);
      const status: DynamicServiceRunStatus = response.ok ? 'success' : 'failed';
      const saved = await this.finishRun(run.id, status, started, { responseSnapshot });
      await this.audit.record({
        auth,
        action: status === 'success' ? 'dynamic_service.executed' : 'dynamic_service.failed',
        resourceType: 'dynamic_service',
        resourceId: service.id,
        metadata: { runId: run.id, statusCode: response.status, durationMs: saved.durationMs }
      });
      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown service execution error';
      const status: DynamicServiceRunStatus = message.toLowerCase().includes('abort') ? 'timeout' : 'failed';
      return this.finishRun(run.id, status, started, { error: message });
    }
  }

  private async finishRun(
    runId: string,
    status: DynamicServiceRunStatus,
    started: number,
    updates: Pick<DynamicServiceRun, 'responseSnapshot'> | Pick<DynamicServiceRun, 'error'>
  ) {
    const durationMs = Date.now() - started;
    await this.runs.update({ id: runId }, { status, durationMs, ...(updates as Record<string, unknown>) });
    return this.runs.findOneOrFail({ where: { id: runId } });
  }

  private async requireService(auth: AuthContext, serviceId: string) {
    const service = await this.services.findOne({ where: { id: serviceId, tenantId: auth.tenant.id, trashedAt: IsNull() } });
    if (!service) {
      throw new NotFoundException('Dynamic service not found');
    }
    return service;
  }

  private async requireServiceByKey(auth: AuthContext, key: string) {
    const service = await this.services.findOne({ where: { key, tenantId: auth.tenant.id, trashedAt: IsNull() } });
    if (!service) {
      throw new NotFoundException('Dynamic service not found');
    }
    return service;
  }

  private async requireTrashedService(auth: AuthContext, serviceId: string) {
    const service = await this.services
      .createQueryBuilder('service')
      .where('service.id = :serviceId', { serviceId })
      .andWhere('service.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .andWhere('service.trashedAt IS NOT NULL')
      .getOne();
    if (!service) {
      throw new NotFoundException('Dynamic service not found in trash');
    }
    return service;
  }

  private async assertActiveKeyAvailable(auth: AuthContext, key: string, excludeId?: string) {
    const query = this.services
      .createQueryBuilder('service')
      .where('service.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .andWhere('service.key = :key', { key })
      .andWhere('service.trashedAt IS NULL');
    if (excludeId) {
      query.andWhere('service.id != :excludeId', { excludeId });
    }
    if (await query.getOne()) {
      throw new ConflictException('A dynamic service with this key already exists');
    }
  }

  private async releaseTrashedKey(auth: AuthContext, key: string) {
    const trashed = await this.services.findOne({
      where: { tenantId: auth.tenant.id, key, trashedAt: Not(IsNull()) }
    });
    if (!trashed) {
      return;
    }
    await this.services.save(
      this.services.merge(trashed, {
        key: this.trashKey(key, trashed.id)
      })
    );
  }

  private trashKey(key: string, id: string) {
    const suffix = `__trashed_${id.replace(/-/g, '').slice(0, 8) || Date.now().toString(36)}`;
    return `${key.slice(0, 120 - suffix.length)}${suffix}`;
  }

  private originalKeyFromTrashKey(key: string) {
    return key.replace(/__trashed_[a-z0-9]{8}$/i, '');
  }

  private catalogScope(tableName: string, hasTenantId: boolean): ServiceCatalogTable['scope'] | null {
    if (tableName === 'tenants') {
      return 'current_tenant';
    }
    if (hasTenantId) {
      return 'tenant';
    }
    if (SERVICE_CATALOG_GLOBAL_TABLES.has(tableName)) {
      return 'global';
    }
    return null;
  }

  private async internalQueryPlan(
    auth: AuthContext,
    definition: DynamicServiceDefinition,
    input: Record<string, unknown>
  ): Promise<InternalQueryPlan> {
    const dataTarget = definition.dataTarget;
    if (!dataTarget) {
      throw new BadRequestException('Internal query dataTarget is required');
    }

    const queryMode = dataTarget.queryMode ?? 'single_table';
    const tableName = dataTarget.primaryTable?.trim();
    if (!tableName) {
      throw new BadRequestException('Internal query table is required');
    }

    const table = await this.visibleServiceTable(tableName);
    const primaryAlias = this.cleanAlias(dataTarget.primaryAlias ?? table.name);
    const aliases = new Map<string, ServiceCatalogTable>([[primaryAlias, table]]);
    const fromSql = [`${this.escapeIdentifier(table.name)} ${this.escapeIdentifier(primaryAlias)}`];
    const tables = [table];

    if (queryMode === 'multi_table' || queryMode === 'advanced_read_model') {
      for (const join of dataTarget.joins ?? []) {
        const joined = await this.visibleServiceTable(join.table);
        const alias = this.cleanAlias(join.alias);
        if (aliases.has(alias)) {
          throw new BadRequestException(`Duplicate table alias ${alias}`);
        }
        aliases.set(alias, joined);
        tables.push(joined);
        fromSql.push(this.joinSql(join, joined, aliases));
      }
    } else if (queryMode !== 'single_table') {
      throw new BadRequestException('Unsupported internal query mode');
    }

    const aliasContext: QueryAliasContext = {
      primaryAlias,
      tablesByAlias: aliases
    };
    const whereSql: string[] = [];
    const params: unknown[] = [];

    this.applyScopeFilters(auth, aliasContext, whereSql, params);

    const filters = dataTarget.filters ?? [];
    const filterSql: string[] = [];
    const filterParams: unknown[] = [];
    for (const filter of filters) {
      const field = this.requireFilterColumn(aliasContext, filter.field);
      const value = this.resolveFilterValue(auth, input, filter);
      const expression = this.filterSql(field, filter, value);
      if (!expression) {
        continue;
      }
      filterSql.push(expression.sql);
      filterParams.push(expression.param);
    }

    if (filters.length && !filterSql.length) {
      throw new BadRequestException('At least one filter value is required');
    }

    if ((dataTarget.matchMode ?? 'all') === 'any' && filterSql.length > 1) {
      whereSql.push(`(${filterSql.join(' OR ')})`);
      params.push(...filterParams);
    } else {
      whereSql.push(...filterSql);
      params.push(...filterParams);
    }

    return {
      primaryTable: table,
      tables,
      selectSql: this.selectSql(dataTarget.select, aliasContext),
      fromSql: fromSql.join(' '),
      whereSql,
      params,
      limit: this.internalQueryLimit(definition)
    };
  }

  private async insertInternalRow(
    auth: AuthContext,
    definition: DynamicServiceDefinition,
    table: ServiceCatalogTable,
    input: Record<string, unknown>
  ) {
    const values = this.internalWriteValues(auth, definition, table, input, 'create');
    if (!Object.keys(values).length) {
      throw new BadRequestException('Internal create requires at least one writable field');
    }

    const columns = Object.keys(values);
    const sql = `INSERT INTO ${this.escapeIdentifier(table.name)} (${columns
      .map((column) => this.escapeIdentifier(column))
      .join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    const result = (await this.dataSource.query(sql, columns.map((column) => values[column]))) as {
      affectedRows?: number;
      insertId?: string | number;
    };

    return {
      table: table.name,
      operation: 'create',
      affectedRows: Number(result?.affectedRows ?? 1),
      insertId: result?.insertId ?? values['id'] ?? null,
      result: this.maskSecrets(values)
    };
  }

  private async updateInternalRows(
    auth: AuthContext,
    definition: DynamicServiceDefinition,
    table: ServiceCatalogTable,
    input: Record<string, unknown>
  ) {
    const values = this.internalWriteValues(auth, definition, table, input, 'update');
    if (!Object.keys(values).length) {
      throw new BadRequestException('Internal update requires at least one writable field');
    }
    const where = this.internalWriteWhere(auth, definition, table, input);
    const columns = Object.keys(values);
    const sql = `UPDATE ${this.escapeIdentifier(table.name)} SET ${columns
      .map((column) => `${this.escapeIdentifier(column)} = ?`)
      .join(', ')} WHERE ${where.sql.join(' AND ')}`;
    const result = (await this.dataSource.query(sql, [
      ...columns.map((column) => values[column]),
      ...where.params
    ])) as { affectedRows?: number };

    return {
      table: table.name,
      operation: 'update',
      affectedRows: Number(result?.affectedRows ?? 0),
      result: this.maskSecrets(values)
    };
  }

  private async deleteInternalRows(
    auth: AuthContext,
    definition: DynamicServiceDefinition,
    table: ServiceCatalogTable,
    input: Record<string, unknown>
  ) {
    const where = this.internalWriteWhere(auth, definition, table, input);
    const sql = `DELETE FROM ${this.escapeIdentifier(table.name)} WHERE ${where.sql.join(' AND ')}`;
    const result = (await this.dataSource.query(sql, where.params)) as { affectedRows?: number };

    return {
      table: table.name,
      operation: 'delete',
      affectedRows: Number(result?.affectedRows ?? 0),
      result: null
    };
  }

  private internalWriteValues(
    auth: AuthContext,
    definition: DynamicServiceDefinition,
    table: ServiceCatalogTable,
    input: Record<string, unknown>,
    operation: 'create' | 'update'
  ) {
    const writeMap = definition.dataTarget?.writeMap ?? {};
    const context: RenderContext = { tenant: auth.tenant, user: auth.user, input };
    const values = Object.entries(writeMap).reduce<Record<string, unknown>>((result, [column, template]) => {
      const writableColumn = this.requireWritableColumn(table, column);
      result[writableColumn.name] = this.renderBody(template, context);
      return result;
    }, {});

    if (operation === 'create') {
      const idColumn = table.columns.find((column) => column.primary && column.name === 'id');
      if (idColumn && values['id'] === undefined) {
        values['id'] = randomUUID();
      }
      if (table.scope === 'tenant' && table.columns.some((column) => column.name === 'tenantId')) {
        values['tenantId'] = auth.tenant.id;
      }
    }

    return values;
  }

  private internalWriteWhere(
    auth: AuthContext,
    definition: DynamicServiceDefinition,
    table: ServiceCatalogTable,
    input: Record<string, unknown>
  ) {
    const filters = definition.dataTarget?.filters ?? [];
    if (!filters.length) {
      throw new BadRequestException('Internal update/delete requires at least one filter');
    }

    const context: QueryAliasContext = {
      primaryAlias: table.name,
      tablesByAlias: new Map([[table.name, table]])
    };
    const whereSql: string[] = [];
    const params: unknown[] = [];
    this.applyScopeFilters(auth, context, whereSql, params);

    const filterSql: string[] = [];
    const filterParams: unknown[] = [];
    for (const filter of filters) {
      const field = this.requireFilterColumn(context, filter.field);
      const value = this.resolveFilterValue(auth, input, filter);
      const expression = this.filterSql(field, filter, value);
      if (!expression) {
        continue;
      }
      filterSql.push(expression.sql);
      filterParams.push(expression.param);
    }
    if (!filterSql.length) {
      throw new BadRequestException('Internal update/delete requires at least one filter value');
    }
    whereSql.push(...filterSql);
    params.push(...filterParams);

    return { sql: whereSql, params };
  }

  private requireWritableColumn(table: ServiceCatalogTable, columnName: string) {
    if (!this.safeIdentifier(columnName)) {
      throw new BadRequestException('Invalid internal write column');
    }
    if (/password|token|secret|hash/i.test(columnName)) {
      throw new BadRequestException('Internal write column is not allowed');
    }
    if (['id', 'tenantId', 'tenant_id', 'createdAt', 'created_at', 'updatedAt', 'updated_at'].includes(columnName)) {
      throw new BadRequestException(`Column ${columnName} is managed by the platform`);
    }

    return this.requireColumn(table, columnName);
  }

  private joinSql(join: DynamicServiceJoin, joined: ServiceCatalogTable, aliases: Map<string, ServiceCatalogTable>) {
    const type = join.type === 'left' ? 'LEFT JOIN' : 'INNER JOIN';
    const alias = this.cleanAlias(join.alias);
    if (!join.on?.length) {
      throw new BadRequestException(`Join ${alias} requires at least one condition`);
    }

    const conditions = join.on.map((condition) => {
      if (condition.operator && condition.operator !== 'equals') {
        throw new BadRequestException('Only equals join conditions are supported');
      }
      const left = this.requireJoinColumn(aliases, condition.left);
      const right = this.requireJoinColumn(new Map([...aliases, [alias, joined]]), condition.right);
      return `${left.sql} = ${right.sql}`;
    });

    return `${type} ${this.escapeIdentifier(joined.name)} ${this.escapeIdentifier(alias)} ON ${conditions.join(' AND ')}`;
  }

  private applyScopeFilters(
    auth: AuthContext,
    context: QueryAliasContext,
    whereSql: string[],
    params: unknown[]
  ) {
    for (const [alias, table] of context.tablesByAlias.entries()) {
      if (table.scope === 'tenant') {
        this.requireColumn(table, 'tenantId');
        whereSql.push(`${this.qualifiedColumnSql(alias, 'tenantId')} = ?`);
        params.push(auth.tenant.id);
      } else if (table.scope === 'current_tenant') {
        this.requireColumn(table, 'id');
        whereSql.push(`${this.qualifiedColumnSql(alias, 'id')} = ?`);
        params.push(auth.tenant.id);
      }
    }
  }

  private selectSql(select: DynamicServiceSelectField[] | undefined, context: QueryAliasContext) {
    if (!select?.length) {
      return `${this.escapeIdentifier(context.primaryAlias)}.*`;
    }

    if (select.length > 80) {
      throw new BadRequestException('Internal query select list is too large');
    }

    return select
      .map((item) => {
        const column = this.requireFilterColumn(context, item.field);
        const alias = this.cleanAlias(item.alias || item.field.replace('.', '_'));
        return `${column.sql} AS ${this.escapeIdentifier(alias)}`;
      })
      .join(', ');
  }

  private internalQueryLimit(definition: DynamicServiceDefinition) {
    const requested = Number(definition.dataTarget?.limit ?? 0);
    const defaultLimit = definition.resultKind === 'list' || definition.resultKind === 'paginated_list' ? 100 : 1;
    const limit = Number.isFinite(requested) && requested > 0 ? requested : defaultLimit;
    return Math.min(limit, 100);
  }

  private async visibleServiceTable(tableName: string) {
    if (!this.safeIdentifier(tableName) || SERVICE_CATALOG_BLOCKED_TABLES.has(tableName)) {
      throw new BadRequestException('Internal query table is not allowed');
    }

    const exists = (await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_type = 'BASE TABLE'
          AND table_name = ?
      `,
      [tableName]
    )) as Array<{ total: string | number }>;
    if (Number(exists[0]?.total ?? 0) === 0) {
      throw new BadRequestException('Internal query table does not exist');
    }

    const columns = await this.tableColumns(tableName);
    const scope = this.catalogScope(
      tableName,
      columns.some((column) => column.name === 'tenantId' || column.name === 'tenant_id')
    );
    if (!scope) {
      throw new BadRequestException('Internal query table is not visible for services');
    }

    return {
      name: tableName,
      scope,
      source: tableName.startsWith('custom_') ? 'schema' : 'entity',
      columns: columns.filter((column) => !/password|token|secret|hash/i.test(column.name))
    } satisfies ServiceCatalogTable;
  }

  private requireColumn(table: ServiceCatalogTable, columnName: string) {
    const column = table.columns.find((item) => item.name === columnName);
    if (!column) {
      throw new BadRequestException(`Column ${columnName} is required for scoped internal query`);
    }
    return column;
  }

  private requireFilterColumn(context: QueryAliasContext, fieldRef: string) {
    const ref = this.parseFieldRef(fieldRef, context);
    if (/password|token|secret|hash/i.test(ref.columnName)) {
      throw new BadRequestException('Internal query filter column is not allowed');
    }

    const column = this.requireColumn(ref.table, ref.columnName);
    return {
      ...column,
      sql: this.qualifiedColumnSql(ref.alias, column.name)
    };
  }

  private requireJoinColumn(tablesByAlias: Map<string, ServiceCatalogTable>, fieldRef: string) {
    const context: QueryAliasContext = {
      primaryAlias: tablesByAlias.keys().next().value ?? '',
      tablesByAlias
    };
    const ref = this.parseFieldRef(fieldRef, context);
    if (/password|token|secret|hash/i.test(ref.columnName)) {
      throw new BadRequestException('Internal query join column is not allowed');
    }
    const column = this.requireColumn(ref.table, ref.columnName);
    return {
      ...column,
      sql: this.qualifiedColumnSql(ref.alias, column.name)
    };
  }

  private resolveFilterValue(auth: AuthContext, input: Record<string, unknown>, filter: DynamicServiceFilter) {
    if (filter.valueSource === 'tenant') {
      return auth.tenant.id;
    }

    if (filter.valueSource === 'current_user') {
      return auth.user.id;
    }

    if (filter.valueSource === 'literal') {
      return filter.value ?? '';
    }

    const inputKey = filter.inputKey?.trim() || filter.field;
    return input[inputKey];
  }

  private filterSql(column: ServiceCatalogColumn & { sql?: string }, filter: DynamicServiceFilter, value: unknown) {
    if (value === undefined || value === null || value === '') {
      if (filter.required === false) {
        return null;
      }
      throw new BadRequestException(`Filter value for ${column.name} is required`);
    }

    const field = column.sql ?? this.escapeIdentifier(column.name);
    if (filter.operator === 'contains') {
      return { sql: `${field} LIKE ?`, param: `%${String(value)}%` };
    }

    if (filter.operator === 'starts_with') {
      return { sql: `${field} LIKE ?`, param: `${String(value)}%` };
    }

    const operators: Record<Exclude<DynamicServiceFilter['operator'], 'contains' | 'starts_with'>, string> = {
      equals: '=',
      greater_than: '>',
      greater_or_equal: '>=',
      less_than: '<',
      less_or_equal: '<='
    };
    return { sql: `${field} ${operators[filter.operator as keyof typeof operators]} ?`, param: value };
  }

  private escapeIdentifier(identifier: string) {
    if (!this.safeIdentifier(identifier)) {
      throw new BadRequestException('Invalid internal query identifier');
    }

    return `\`${identifier}\``;
  }

  private qualifiedColumnSql(alias: string, columnName: string) {
    return `${this.escapeIdentifier(alias)}.${this.escapeIdentifier(columnName)}`;
  }

  private safeIdentifier(identifier: string) {
    return /^[A-Za-z][A-Za-z0-9_]*$/.test(identifier);
  }

  private cleanAlias(alias: string) {
    const value = alias.trim();
    if (!this.safeIdentifier(value)) {
      throw new BadRequestException('Invalid internal query alias');
    }
    return value;
  }

  private parseFieldRef(fieldRef: string, context: QueryAliasContext) {
    const value = fieldRef.trim();
    const parts = value.split('.');
    const alias = parts.length === 2 ? parts[0] : context.primaryAlias;
    const columnName = parts.length === 2 ? parts[1] : value;
    if (!this.safeIdentifier(alias) || !this.safeIdentifier(columnName)) {
      throw new BadRequestException('Invalid internal query field reference');
    }

    const table = context.tablesByAlias.get(alias);
    if (!table) {
      throw new BadRequestException(`Unknown table alias ${alias}`);
    }

    return { alias, table, columnName };
  }

  private async tableColumns(tableName: string): Promise<ServiceCatalogColumn[]> {
    const columns = (await this.dataSource.query(
      `
        SELECT column_name AS name,
               data_type AS type,
               is_nullable AS nullable,
               column_key AS columnKey
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ?
        ORDER BY ordinal_position
      `,
      [tableName]
    )) as InformationSchemaColumnRow[];

    return columns
      .map((column) => ({
        name: column.name ?? column.column_name ?? column.COLUMN_NAME ?? '',
        type: column.type ?? column.data_type ?? column.DATA_TYPE ?? 'unknown',
        nullable: (column.nullable ?? column.is_nullable ?? column.IS_NULLABLE) === 'YES',
        primary: (column.columnKey ?? column.column_key ?? column.COLUMN_KEY) === 'PRI'
      }))
      .filter((column) => column.name);
  }

  private async requireVersion(auth: AuthContext, serviceId: string, versionId: string) {
    const version = await this.versions.findOne({
      where: { id: versionId, tenantId: auth.tenant.id, serviceId }
    });
    if (!version) {
      throw new NotFoundException('Dynamic service version not found');
    }
    return version;
  }

  private validateDefinition(definition?: DynamicServiceDefinition) {
    if (!definition || typeof definition !== 'object') {
      throw new BadRequestException('Definition is required');
    }

    if (!HTTP_METHODS.includes(definition.method)) {
      throw new BadRequestException('Unsupported HTTP method');
    }

    if ((definition.source ?? 'external_api') === 'external_api' && (!definition.url || typeof definition.url !== 'string')) {
      throw new BadRequestException('URL is required');
    }

    if (definition.headers && typeof definition.headers !== 'object') {
      throw new BadRequestException('Headers must be an object');
    }

    if (definition.query && typeof definition.query !== 'object') {
      throw new BadRequestException('Query must be an object');
    }

    const normalized = {
      intent: definition.intent ?? 'custom',
      source: definition.source ?? 'external_api',
      resultKind: definition.resultKind ?? 'single',
      pagination: definition.pagination ?? { enabled: false },
      effects: definition.effects ?? [{ type: 'show_response' }],
      dataTarget: {
        queryMode: definition.dataTarget?.queryMode ?? 'single_table',
        primaryTable: definition.dataTarget?.primaryTable,
        primaryAlias: definition.dataTarget?.primaryAlias,
        involvedTables: definition.dataTarget?.involvedTables ?? [],
        joins: definition.dataTarget?.joins ?? [],
        select: definition.dataTarget?.select ?? [],
        limit: definition.dataTarget?.limit,
        recordKey: definition.dataTarget?.recordKey,
        relationNotes: definition.dataTarget?.relationNotes,
        filterNotes: definition.dataTarget?.filterNotes,
        matchMode: definition.dataTarget?.matchMode ?? 'all',
        filters: definition.dataTarget?.filters ?? [],
        writeMap: definition.dataTarget?.writeMap ?? {}
      },
      method: definition.method,
      url: definition.url?.trim() ?? '',
      headers: definition.headers ?? {},
      query: definition.query ?? {},
      body: definition.body ?? null,
      timeoutMs: definition.timeoutMs,
      retry: definition.retry ?? { attempts: 0, backoffMs: 0 },
      responseMap: definition.responseMap ?? {},
      exposure: this.normalizePublicExposure(definition)
    };
    return normalized;
  }

  private normalizePublicExposure(definition: DynamicServiceDefinition): DynamicServicePublicExposure {
    const exposure = definition.exposure;
    if (!exposure?.enabled) {
      return {
        enabled: false,
        allowedMethods: [],
        inputMode: 'body_or_query',
        responseMode: 'mapped_or_result',
        security: { mode: 'private' }
      };
    }

    const allowedMethods = (exposure.allowedMethods?.length ? exposure.allowedMethods : [definition.method]).filter(
      (method): method is DynamicServiceHttpMethod => HTTP_METHODS.includes(method)
    );
    if (!allowedMethods.length) {
      throw new BadRequestException('Public exposure requires at least one allowed method');
    }

    const securityMode = exposure.security?.mode ?? 'api_key';
    const normalized: DynamicServicePublicExposure = {
      enabled: true,
      allowedMethods,
      inputMode: exposure.inputMode ?? 'body_or_query',
      responseMode: exposure.responseMode ?? 'mapped_or_result',
      security: {
        mode: securityMode,
        headerName:
          exposure.security?.headerName?.trim() ||
          (securityMode === 'api_key' ? 'x-chicle-api-key' : 'authorization')
      }
    };

    if (securityMode === 'private') {
      throw new BadRequestException('Public exposure cannot use private security mode');
    }

    if (securityMode === 'none') {
      this.assertNoAuthPublicExposureIsSafe(definition, allowedMethods);
      return normalized;
    }

    if (securityMode !== 'api_key' && securityMode !== 'bearer_token') {
      throw new BadRequestException('Unsupported public service security mode');
    }

    const plainSecret = exposure.security?.apiKey ?? exposure.security?.token;
    if (plainSecret) {
      Object.assign(normalized.security!, this.hashPublicSecret(plainSecret));
      return normalized;
    }

    if (!exposure.security?.secretHash || !exposure.security?.secretSalt) {
      throw new BadRequestException('Public service security requires a new key/token or an existing hash');
    }

    normalized.security!.secretHash = exposure.security.secretHash;
    normalized.security!.secretSalt = exposure.security.secretSalt;
    normalized.security!.algorithm = 'scrypt-sha256';
    return normalized;
  }

  private assertNoAuthPublicExposureIsSafe(
    definition: DynamicServiceDefinition,
    allowedMethods: DynamicServiceHttpMethod[]
  ) {
    const intent = definition.intent ?? 'custom';
    const safeIntent = intent === 'query' || intent === 'get_one' || intent === 'validate';
    const readOnlyMethods = allowedMethods.every((method) => method === 'GET');
    if (!safeIntent || !readOnlyMethods) {
      throw new BadRequestException('Una exposición pública sin autenticación solo puede ser GET de lectura o validación');
    }
  }

  private publicMethod(method: string): DynamicServiceHttpMethod {
    const normalized = method.toUpperCase() as DynamicServiceHttpMethod;
    if (!HTTP_METHODS.includes(normalized)) {
      throw new BadRequestException('Unsupported public service HTTP method');
    }
    return normalized;
  }

  private assertPublicExposure(
    definition: DynamicServiceDefinition,
    exposure: DynamicServicePublicExposure | undefined,
    method: DynamicServiceHttpMethod,
    headers: Record<string, string | string[] | undefined>
  ) {
    if (!exposure?.enabled) {
      throw new NotFoundException('Public service not found');
    }

    const allowedMethods = exposure.allowedMethods?.length ? exposure.allowedMethods : [definition.method];
    if (!allowedMethods.includes(method)) {
      throw new ForbiddenException('Public service method is not allowed');
    }

    const security = exposure.security ?? { mode: 'api_key' as const };
    if (security.mode === 'none') {
      this.assertNoAuthPublicExposureIsSafe(definition, allowedMethods);
      return;
    }

    if (security.mode === 'api_key') {
      const headerName = (security.headerName || 'x-chicle-api-key').toLowerCase();
      const presented = this.headerValue(headers, headerName);
      this.assertPresentedPublicSecret(presented, security.secretHash, security.secretSalt);
      return;
    }

    if (security.mode === 'bearer_token') {
      const authorization = this.headerValue(headers, 'authorization');
      const match = authorization.match(/^Bearer\s+(.+)$/i);
      this.assertPresentedPublicSecret(match?.[1], security.secretHash, security.secretSalt);
      return;
    }

    throw new ForbiddenException('Public service security mode is not executable');
  }

  private publicInput(
    exposure: DynamicServicePublicExposure | undefined,
    method: DynamicServiceHttpMethod,
    query: Record<string, unknown>,
    body: unknown
  ) {
    const inputMode = exposure?.inputMode ?? 'body_or_query';
    if (inputMode === 'query' || (inputMode === 'body_or_query' && method === 'GET')) {
      return this.flattenQueryInput(query);
    }

    if (inputMode === 'body' || inputMode === 'body_or_query') {
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        const record = body as Record<string, unknown>;
        const context = record['context'];
        return context && typeof context === 'object' && !Array.isArray(context)
          ? (context as Record<string, unknown>)
          : record;
      }
      return {};
    }

    return {};
  }

  private publicResponse(run: DynamicServiceRun, exposure: DynamicServicePublicExposure | undefined) {
    const snapshot = run.responseSnapshot ?? null;
    const responseMode = exposure?.responseMode ?? 'mapped_or_result';
    const result =
      snapshot && responseMode === 'full_snapshot'
        ? snapshot
        : snapshot && responseMode === 'result_only'
          ? snapshot['result'] ?? snapshot['mapped'] ?? null
          : snapshot
            ? snapshot['mapped'] ?? snapshot['result'] ?? snapshot['body'] ?? snapshot
            : null;

    return {
      ok: run.status === 'success',
      status: run.status,
      result,
      runId: run.id,
      durationMs: run.durationMs,
      error: run.error ?? null
    };
  }

  private publicAuthContext(tenant: Tenant): AuthContext {
    return {
      tenant,
      user: {
        id: null,
        tenantId: tenant.id,
        email: 'public-api@chicle.local',
        name: 'Public API',
        systemRole: 'viewer',
        active: true
      },
      membership: {
        id: null,
        tenantId: tenant.id,
        userId: null,
        systemRole: 'viewer',
        active: true,
        primaryMembership: false
      },
      sessionId: 'public-api',
      tokenId: 'public-api',
      roles: [],
      permissions: []
    } as unknown as AuthContext;
  }

  private flattenQueryInput(query: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    );
  }

  private headerValue(headers: Record<string, string | string[] | undefined>, headerName: string) {
    const normalizedName = headerName.toLowerCase();
    const value = Object.entries(headers).find(([key]) => key.toLowerCase() === normalizedName)?.[1];
    return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
  }

  private assertPresentedPublicSecret(secret: string | undefined, expectedHash?: string, expectedSalt?: string) {
    if (!secret || !expectedHash || !expectedSalt) {
      throw new UnauthorizedException('Invalid public service credentials');
    }

    const candidate = this.hashPublicSecret(secret, expectedSalt);
    const candidateBuffer = Buffer.from(candidate.secretHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    if (candidateBuffer.length !== expectedBuffer.length || !timingSafeEqual(candidateBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid public service credentials');
    }
  }

  private hashPublicSecret(secret: string, salt = randomBytes(16).toString('hex')) {
    const value = secret.trim();
    if (value.length < 16) {
      throw new BadRequestException('Public service key/token must be at least 16 characters long');
    }

    return {
      secretHash: scryptSync(value, salt, 32).toString('hex'),
      secretSalt: salt,
      algorithm: 'scrypt-sha256' as const
    };
  }

  private serviceLimits(): ServiceLimits {
    return {
      defaultTimeoutMs: this.confisys.get<number>('services.defaultTimeoutMs', 8000),
      maxTimeoutMs: this.confisys.get<number>('services.maxTimeoutMs', 30000),
      maxResponseBytes: this.confisys.get<number>('services.maxResponseBytes', 262144),
      allowPrivateHosts: this.confisys.get<boolean>('services.allowPrivateHosts', false)
    };
  }

  private resolveTimeout(timeoutMs: number | undefined, limits: ServiceLimits) {
    const requested = Number(timeoutMs ?? limits.defaultTimeoutMs);
    const safe = Number.isFinite(requested) && requested > 0 ? requested : limits.defaultTimeoutMs;
    return Math.min(safe, limits.maxTimeoutMs);
  }

  private normalizeKey(value?: string) {
    const key = (value ?? '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9_]{2,119}$/.test(key)) {
      throw new BadRequestException('Key must use snake_case and be 3-120 characters long');
    }
    return key;
  }

  private cleanName(value?: string) {
    const name = (value ?? '').trim();
    if (name.length < 3 || name.length > 180) {
      throw new BadRequestException('Name must be 3-180 characters long');
    }
    return name;
  }

  private async renderAndValidateUrl(
    urlTemplate: string,
    query: Record<string, string> | undefined,
    context: RenderContext,
    limits: ServiceLimits
  ) {
    const rendered = this.renderText(urlTemplate, context);
    let url: URL;
    try {
      url = new URL(rendered);
    } catch {
      throw new BadRequestException('Service URL is invalid');
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new BadRequestException('Only HTTP and HTTPS URLs are allowed');
    }

    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, this.renderText(String(value), context));
    }

    if (!limits.allowPrivateHosts) {
      await this.assertPublicHost(url.hostname);
    }

    return url;
  }

  private async assertPublicHost(hostname: string) {
    const normalized = hostname.replace(/^\[/, '').replace(/\]$/, '');
    if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
      throw new ForbiddenException('Private hosts are blocked for dynamic services');
    }

    const addresses = isIP(normalized)
      ? [{ address: normalized }]
      : await lookup(normalized, { all: true }).catch(() => {
          throw new BadRequestException('Service host cannot be resolved');
        });

    for (const item of addresses) {
      if (this.isPrivateIp(item.address)) {
        throw new ForbiddenException('Private network targets are blocked for dynamic services');
      }
    }
  }

  private isPrivateIp(address: string) {
    if (address === '127.0.0.1' || address === '0.0.0.0' || address === '::1') {
      return true;
    }
    if (address.startsWith('10.') || address.startsWith('192.168.')) {
      return true;
    }
    if (address.startsWith('169.254.')) {
      return true;
    }
    if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) {
      return true;
    }
    const [first, second] = address.split('.').map(Number);
    return (first === 172 && second >= 16 && second <= 31) || (first === 100 && second >= 64 && second <= 127);
  }

  private renderRecord(record: Record<string, string>, context: RenderContext) {
    return Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, this.renderText(String(value), context)])
    );
  }

  private renderBody(value: unknown, context: RenderContext): unknown {
    if (typeof value === 'string') {
      return this.renderText(value, context);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.renderBody(item, context));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [
          key,
          this.renderBody(item, context)
        ])
      );
    }
    return value;
  }

  private renderText(template: string, context: RenderContext) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, path: string) => {
      const value = this.resolvePath(path, context);
      return value === undefined || value === null ? '' : String(value);
    });
  }

  private resolvePath(path: string, context: RenderContext): unknown {
    return path.split('.').reduce<unknown>((current, part) => {
      if (current && typeof current === 'object' && part in current) {
        return (current as Record<string, unknown>)[part];
      }
      return undefined;
    }, context);
  }

  private requestBody(method: DynamicServiceHttpMethod, body: unknown) {
    if (method === 'GET' || method === 'DELETE' || body === null || body === undefined) {
      return undefined;
    }
    return typeof body === 'string' ? body : JSON.stringify(body);
  }

  private requestSnapshot(
    method: DynamicServiceHttpMethod,
    url: URL,
    headers: Record<string, string>,
    body: unknown
  ) {
    return {
      method,
      url: url.toString(),
      headers: this.maskHeaders(headers),
      body: this.truncateSnapshot(this.maskSecrets(body))
    };
  }

  private async responseSnapshot(response: Response, limits: ServiceLimits) {
    const text = await response.text();
    const body = text.length > limits.maxResponseBytes ? text.slice(0, limits.maxResponseBytes) : text;
    return {
      status: response.status,
      ok: response.ok,
      headers: this.maskHeaders(Object.fromEntries(response.headers.entries())),
      body: this.tryParseJson(body),
      truncated: text.length > limits.maxResponseBytes
    };
  }

  private withMappedResponse(
    responseSnapshot: Record<string, unknown>,
    responseMap?: Record<string, string>
  ): Record<string, unknown> {
    if (!responseMap || !Object.keys(responseMap).length) {
      return responseSnapshot;
    }
    const root = { response: responseSnapshot };
    const mapped = Object.entries(responseMap).reduce<Record<string, unknown>>((result, [key, template]) => {
      const match = template.match(/^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/);
      result[key] = match ? this.resolveObjectPath(root, match[1]) : template;
      return result;
    }, {});
    return { ...responseSnapshot, mapped };
  }

  private resolveObjectPath(root: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((current, part) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[part];
    }, root);
  }

  private maskHeaders(headers: Record<string, string>) {
    return Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        SECRET_HEADER_PATTERN.test(key) ? '***' : value
      ])
    );
  }

  private maskSecrets(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.maskSecrets(item));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [
          key,
          SECRET_HEADER_PATTERN.test(key) || /password|hash/i.test(key) ? '***' : this.maskSecrets(item)
        ])
      );
    }

    return value;
  }

  private truncateSnapshot(value: unknown) {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
    return text.length > 12000 ? `${text.slice(0, 12000)}...` : value;
  }

  private tryParseJson(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}

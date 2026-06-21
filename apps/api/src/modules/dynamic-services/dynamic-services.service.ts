import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import { DynamicService } from './dynamic-service.entity';
import {
  DynamicServiceDefinition,
  DynamicServiceHttpMethod,
  DynamicServiceVersion
} from './dynamic-service-version.entity';
import { DynamicServiceRun, DynamicServiceRunStatus } from './dynamic-service-run.entity';

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

interface ServiceLimits {
  defaultTimeoutMs: number;
  maxTimeoutMs: number;
  maxResponseBytes: number;
  allowPrivateHosts: boolean;
}

interface RenderContext {
  tenant: AuthContext['tenant'];
  user: AuthContext['user'];
  input: Record<string, unknown>;
}

const HTTP_METHODS: DynamicServiceHttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const SECRET_HEADER_PATTERN = /authorization|api[-_]?key|token|secret|cookie/i;

@Injectable()
export class DynamicServicesService {
  constructor(
    @InjectRepository(DynamicService)
    private readonly services: Repository<DynamicService>,
    @InjectRepository(DynamicServiceVersion)
    private readonly versions: Repository<DynamicServiceVersion>,
    @InjectRepository(DynamicServiceRun)
    private readonly runs: Repository<DynamicServiceRun>,
    private readonly confisys: ConfisysService,
    private readonly audit: AuditService
  ) {}

  async list(auth: AuthContext) {
    const services = await this.services.find({
      where: { tenantId: auth.tenant.id },
      order: { key: 'ASC' }
    });
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
    const next = this.services.merge(service, {
      key: request.key ? this.normalizeKey(request.key) : service.key,
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
    if (!service.active) {
      throw new BadRequestException('Service is inactive');
    }

    const version = await this.versions.findOne({
      where: { tenantId: auth.tenant.id, serviceId: service.id, status: 'published' },
      order: { version: 'DESC' }
    });
    if (!version) {
      throw new BadRequestException('Publish a service version before testing it');
    }

    return this.executeHttp(auth, service, version, request.context ?? {});
  }

  private async executeHttp(
    auth: AuthContext,
    service: DynamicService,
    version: DynamicServiceVersion,
    input: Record<string, unknown>
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
        triggerType: 'manual_test',
        status: 'running',
        requestSnapshot: null,
        timeoutMs,
        actorUserId: auth.user.id
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

      const responseSnapshot = await this.responseSnapshot(response, limits);
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
    const service = await this.services.findOne({ where: { id: serviceId, tenantId: auth.tenant.id } });
    if (!service) {
      throw new NotFoundException('Dynamic service not found');
    }
    return service;
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

    if (!definition.url || typeof definition.url !== 'string') {
      throw new BadRequestException('URL is required');
    }

    if (definition.headers && typeof definition.headers !== 'object') {
      throw new BadRequestException('Headers must be an object');
    }

    if (definition.query && typeof definition.query !== 'object') {
      throw new BadRequestException('Query must be an object');
    }

    return {
      intent: definition.intent ?? 'custom',
      source: definition.source ?? 'external_api',
      resultKind: definition.resultKind ?? 'single',
      pagination: definition.pagination ?? { enabled: false },
      effects: definition.effects ?? [{ type: 'show_response' }],
      method: definition.method,
      url: definition.url.trim(),
      headers: definition.headers ?? {},
      query: definition.query ?? {},
      body: definition.body ?? null,
      timeoutMs: definition.timeoutMs,
      retry: definition.retry ?? { attempts: 0, backoffMs: 0 },
      responseMap: definition.responseMap ?? {}
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
      body: this.truncateSnapshot(body)
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

  private maskHeaders(headers: Record<string, string>) {
    return Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        SECRET_HEADER_PATTERN.test(key) ? '***' : value
      ])
    );
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

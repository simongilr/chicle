import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { EnvironmentProfile, EnvironmentKind } from './environment-profile.entity';
import { EnvironmentSecret } from './environment-secret.entity';
import { EnvironmentVariable } from './environment-variable.entity';
import { ChicleVaultService } from './chicle-vault.service';
import { ServiceRegistryEntry } from './service-registry-entry.entity';
import {
  CreateEnvironmentProfileRequest,
  DeploymentBundle,
  EnvironmentValidationItem,
  EnvironmentValidationResult,
  UpdateEnvironmentProfileRequest,
  UpsertEnvironmentSecretRequest,
  UpsertEnvironmentVariableRequest,
  UpsertServiceRegistryRequest
} from './environment-deploy.types';

const DEFAULT_ENVIRONMENTS: Array<{ key: string; name: string; kind: EnvironmentKind; requiresReauth: boolean }> = [
  { key: 'local', name: 'Local', kind: 'local', requiresReauth: false },
  { key: 'dev', name: 'Development', kind: 'non_prod', requiresReauth: false },
  { key: 'qa', name: 'QA', kind: 'non_prod', requiresReauth: false },
  { key: 'pre', name: 'Pre-production', kind: 'non_prod', requiresReauth: true },
  { key: 'prod', name: 'Production', kind: 'production', requiresReauth: true }
];

@Injectable()
export class EnvironmentDeployService {
  constructor(
    @InjectRepository(EnvironmentProfile)
    private readonly profiles: Repository<EnvironmentProfile>,
    @InjectRepository(EnvironmentVariable)
    private readonly variables: Repository<EnvironmentVariable>,
    @InjectRepository(EnvironmentSecret)
    private readonly secrets: Repository<EnvironmentSecret>,
    @InjectRepository(ServiceRegistryEntry)
    private readonly registry: Repository<ServiceRegistryEntry>,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly vault: ChicleVaultService
  ) {}

  async overview(auth: AuthContext) {
    const profiles = await this.listProfiles(auth);
    const selected = profiles.find((item) => item.isDefault) ?? profiles[0];
    const detail = selected ? await this.detail(auth, selected.key) : null;
    return {
      vault: this.vault.status(),
      currentEnvironment: this.config.get<string>('CHICLE_ENV') ?? 'local',
      profiles,
      selected: detail
    };
  }

  async listProfiles(auth: AuthContext) {
    await this.ensureTenantDefaults(auth.tenant.id);
    return this.profiles.find({
      where: { tenantId: auth.tenant.id },
      order: { isDefault: 'DESC', key: 'ASC' }
    });
  }

  async detail(auth: AuthContext, key: string) {
    const profile = await this.profileByKey(auth, key);
    const [variables, secrets, services, validation, runtimeConfig] = await Promise.all([
      this.variables.find({ where: { tenantId: auth.tenant.id, environmentId: profile.id }, order: { groupKey: 'ASC', key: 'ASC' } }),
      this.secrets.find({ where: { tenantId: auth.tenant.id, environmentId: profile.id }, order: { scopeType: 'ASC', scopeKey: 'ASC', key: 'ASC' } }),
      this.registry.find({ where: { tenantId: auth.tenant.id, environmentId: profile.id }, order: { key: 'ASC' } }),
      this.validate(auth, key),
      this.runtimeConfig(auth, key)
    ]);

    return {
      profile,
      variables: variables.map((item) => this.publicVariable(item)),
      secrets: secrets.map((item) => this.publicSecret(profile, item)),
      services,
      validation,
      runtimeConfig
    };
  }

  async createProfile(auth: AuthContext, request: CreateEnvironmentProfileRequest) {
    const key = this.normalizeKey(request.key, 'environment key');
    const exists = await this.profiles.exist({ where: { tenantId: auth.tenant.id, key } });
    if (exists) {
      throw new BadRequestException('Environment already exists');
    }

    if (request.isDefault) {
      await this.profiles.update({ tenantId: auth.tenant.id, isDefault: true }, { isDefault: false });
    }

    const profile = await this.profiles.save(
      this.profiles.create({
        tenantId: auth.tenant.id,
        key,
        name: this.cleanText(request.name, 'Environment name', 160),
        kind: request.kind ?? 'custom',
        active: request.active ?? true,
        isDefault: request.isDefault ?? false,
        requiresReauth: request.requiresReauth ?? request.kind === 'production',
        metadata: request.metadata ?? null
      })
    );

    await this.audit.record({
      auth,
      action: 'environment.created',
      resourceType: 'environment',
      resourceId: profile.id,
      metadata: { key: profile.key, kind: profile.kind }
    });

    return profile;
  }

  async updateProfile(auth: AuthContext, key: string, request: UpdateEnvironmentProfileRequest) {
    const profile = await this.profileByKey(auth, key);
    if (request.isDefault) {
      await this.profiles.update({ tenantId: auth.tenant.id, isDefault: true }, { isDefault: false });
    }

    const saved = await this.profiles.save({
      ...profile,
      name: request.name === undefined ? profile.name : this.cleanText(request.name, 'Environment name', 160),
      kind: request.kind ?? profile.kind,
      active: request.active ?? profile.active,
      isDefault: request.isDefault ?? profile.isDefault,
      requiresReauth: request.requiresReauth ?? profile.requiresReauth,
      metadata: request.metadata === undefined ? profile.metadata : request.metadata
    });

    await this.audit.record({
      auth,
      action: 'environment.updated',
      resourceType: 'environment',
      resourceId: profile.id,
      metadata: { key: profile.key }
    });

    return saved;
  }

  async upsertVariable(auth: AuthContext, environmentKey: string, request: UpsertEnvironmentVariableRequest) {
    const profile = await this.profileByKey(auth, environmentKey);
    const key = this.cleanVariableKey(request.key);
    const valueType = request.valueType ?? this.inferValueType(request.value);
    const value = this.serializeValue(request.value, valueType);
    const existing = await this.variables.findOne({
      where: { tenantId: auth.tenant.id, environmentId: profile.id, key }
    });

    const data: Partial<EnvironmentVariable> = {
      groupKey: this.normalizeKey(request.groupKey ?? 'general', 'group key'),
      key,
      value,
      valueType,
      target: request.target ?? existing?.target ?? 'api',
      editable: request.editable ?? existing?.editable ?? true,
      requiresRestart: request.requiresRestart ?? existing?.requiresRestart ?? false,
      description: request.description === undefined ? existing?.description : request.description
    };

    const saved = existing
      ? await this.variables.save({ ...existing, ...data })
      : await this.variables.save(
          this.variables.create({
            tenantId: auth.tenant.id,
            environmentId: profile.id,
            ...data
          })
        );

    await this.audit.record({
      auth,
      action: existing ? 'environment.variable.updated' : 'environment.variable.created',
      resourceType: 'environment_variable',
      resourceId: saved.id,
      metadata: { environment: profile.key, key: saved.key, target: saved.target }
    });

    return this.publicVariable(saved);
  }

  async upsertSecret(auth: AuthContext, environmentKey: string, request: UpsertEnvironmentSecretRequest) {
    const profile = await this.profileByKey(auth, environmentKey);
    await this.assertSecretWriteAllowed(auth, profile, request.reauthPassword);
    const scopeType = request.scopeType ?? 'api';
    const scopeKey = this.normalizeKey(request.scopeKey ?? 'default', 'scope key');
    const key = this.cleanVariableKey(request.key);
    const existing = await this.secrets.findOne({
      where: {
        tenantId: auth.tenant.id,
        environmentId: profile.id,
        scopeType,
        scopeKey,
        key
      }
    });
    const status = request.status ?? existing?.status ?? 'active';
    if (!request.value && !existing && status !== 'pending') {
      throw new BadRequestException('Secret value is required');
    }

    const encrypted = request.value === undefined ? null : this.vault.encrypt(request.value);
    const saved = existing
      ? await this.secrets.save({
          ...existing,
          ...(encrypted ?? {}),
          status,
          description: request.description === undefined ? existing.description : request.description,
          lastRotatedAt: encrypted ? new Date() : existing.lastRotatedAt
        })
      : await this.secrets.save(
          this.secrets.create({
            tenantId: auth.tenant.id,
            environmentId: profile.id,
            scopeType,
            scopeKey,
            key,
            ...(encrypted ?? this.vault.encrypt('')),
            status,
            description: request.description ?? null,
            lastRotatedAt: encrypted ? new Date() : null
          })
        );

    await this.audit.record({
      auth,
      action: existing ? 'environment.secret.rotated' : 'environment.secret.created',
      resourceType: 'environment_secret',
      resourceId: saved.id,
      metadata: { environment: profile.key, scopeType, scopeKey, key }
    });

    return this.publicSecret(profile, saved);
  }

  async upsertService(auth: AuthContext, environmentKey: string, request: UpsertServiceRegistryRequest) {
    const profile = await this.profileByKey(auth, environmentKey);
    const key = this.normalizeKey(request.key, 'service key');
    const existing = await this.registry.findOne({
      where: { tenantId: auth.tenant.id, environmentId: profile.id, key }
    });
    const baseUrl = this.cleanUrl(request.baseUrl ?? existing?.baseUrl);

    const saved = existing
      ? await this.registry.save({
          ...existing,
          name: request.name === undefined ? existing.name : this.cleanText(request.name, 'Service name', 180),
          type: request.type ?? existing.type,
          baseUrl,
          healthPath: request.healthPath ?? existing.healthPath,
          authMode: request.authMode ?? existing.authMode,
          secretRef: request.secretRef === undefined ? existing.secretRef : request.secretRef,
          timeoutMs: this.limitNumber(request.timeoutMs ?? existing.timeoutMs, 250, 60000),
          retryPolicy: request.retryPolicy === undefined ? existing.retryPolicy : request.retryPolicy,
          tlsRequired: request.tlsRequired ?? existing.tlsRequired,
          allowedOperations: request.allowedOperations === undefined ? existing.allowedOperations : request.allowedOperations,
          active: request.active ?? existing.active,
          description: request.description === undefined ? existing.description : request.description
        })
      : await this.registry.save(
          this.registry.create({
            tenantId: auth.tenant.id,
            environmentId: profile.id,
            key,
            name: this.cleanText(request.name ?? key, 'Service name', 180),
            type: request.type ?? 'microservice',
            baseUrl,
            healthPath: request.healthPath ?? '/health',
            authMode: request.authMode ?? 'none',
            secretRef: request.secretRef ?? null,
            timeoutMs: this.limitNumber(request.timeoutMs ?? 8000, 250, 60000),
            retryPolicy: request.retryPolicy ?? { attempts: 0, backoffMs: 0 },
            tlsRequired: request.tlsRequired ?? profile.kind === 'production',
            allowedOperations: request.allowedOperations ?? [],
            active: request.active ?? true,
            description: request.description ?? null
          })
        );

    await this.audit.record({
      auth,
      action: existing ? 'service_registry.updated' : 'service_registry.created',
      resourceType: 'service_registry',
      resourceId: saved.id,
      metadata: { environment: profile.key, key: saved.key, type: saved.type }
    });

    return saved;
  }

  async runtimeConfig(auth: AuthContext, environmentKey: string) {
    const profile = await this.profileByKey(auth, environmentKey);
    const variables = await this.variables.find({ where: { tenantId: auth.tenant.id, environmentId: profile.id } });
    const map = new Map(variables.map((item) => [item.key, item]));
    const publicFeatures = this.readJsonVariable(map.get('PUBLIC_FEATURES')?.value, {
      aiAssistant: true,
      dynamicForms: true,
      flows: true
    });

    return {
      environment: profile.key,
      appName: this.variableString(map, 'APP_NAME', 'Chicle Engine'),
      apiUrl: this.variableString(map, 'API_PUBLIC_URL', '/api'),
      adminUrl: this.variableString(map, 'ADMIN_PUBLIC_URL', ''),
      features: publicFeatures
    };
  }

  async deploymentBundle(auth: AuthContext, environmentKey: string): Promise<DeploymentBundle> {
    const profile = await this.profileByKey(auth, environmentKey);
    const runtimeConfig = await this.runtimeConfig(auth, profile.key);
    const validation = await this.validate(auth, profile.key);
    await this.audit.record({
      auth,
      action: 'deployment.bundle.generated',
      resourceType: 'environment',
      resourceId: profile.id,
      metadata: { environment: profile.key, status: validation.status }
    });

    return {
      environment: this.publicProfile(profile),
      generatedAt: new Date().toISOString(),
      files: [
        {
          path: `docker-compose.${profile.key}.yml`,
          kind: 'compose',
          content: this.composeTemplate(profile)
        },
        {
          path: `.env.${profile.key}.template`,
          kind: 'env_template',
          content: this.envTemplate(profile)
        },
        {
          path: `runtime-config.${profile.key}.json`,
          kind: 'runtime_config',
          content: `${JSON.stringify(runtimeConfig, null, 2)}\n`
        },
        {
          path: `deploy-checklist.${profile.key}.md`,
          kind: 'checklist',
          content: this.checklist(profile, validation)
        }
      ]
    };
  }

  async validate(auth: AuthContext, environmentKey: string): Promise<EnvironmentValidationResult> {
    const profile = await this.profileByKey(auth, environmentKey);
    const [variables, secrets, services] = await Promise.all([
      this.variables.find({ where: { tenantId: auth.tenant.id, environmentId: profile.id } }),
      this.secrets.find({ where: { tenantId: auth.tenant.id, environmentId: profile.id } }),
      this.registry.find({ where: { tenantId: auth.tenant.id, environmentId: profile.id } })
    ]);
    const variableKeys = new Set(variables.map((item) => item.key));
    const secretKeys = new Set(secrets.map((item) => `${item.scopeType}.${item.scopeKey}.${item.key}`));
    const items: EnvironmentValidationItem[] = [];

    this.push(items, 'ok', 'profile', 'Environment profile exists', `${profile.name} is available.`);
    if (profile.kind === 'production') {
      this.require(items, secretKeys.has('api.default.JWT_SECRET'), 'jwt-secret', 'JWT secret configured', 'Production requires api/default/JWT_SECRET as encrypted secret.');
      this.require(items, variableKeys.has('CHICLE_CORS_ORIGINS'), 'cors-origin', 'CORS origin configured', 'Production must restrict CORS to explicit origins.');
      const cors = variables.find((item) => item.key === 'CHICLE_CORS_ORIGINS')?.value ?? '';
      if (cors.includes('*')) {
        this.push(items, 'danger', 'cors-wildcard', 'CORS wildcard is unsafe', 'Production cannot use * as allowed origin.');
      }
      this.require(items, variableKeys.has('ADMIN_PUBLIC_URL'), 'admin-url', 'Admin URL configured', 'Production needs the public Admin URL.');
      this.require(items, variableKeys.has('API_PUBLIC_URL'), 'api-url', 'API URL configured', 'Production needs the public API URL or /api proxy path.');
      this.require(items, !this.booleanVariable(variables, 'CHICLE_SCHEMA_ALLOW_DROP_TABLE'), 'drop-table-disabled', 'Drop table disabled', 'Production must not allow DB designer drop table operations.');
      this.require(items, !this.booleanVariable(variables, 'CHICLE_ALLOW_SYSTEM_RESET'), 'reset-disabled', 'System reset disabled', 'Production must not expose local reset behavior.');
      this.require(items, !this.booleanVariable(variables, 'CHICLE_SWAGGER_ENABLED'), 'swagger-disabled', 'Swagger disabled by default', 'If Swagger is enabled in production it must require Basic Auth.');
    } else {
      this.push(items, 'ok', 'non-prod', 'Non-production defaults allowed', 'This environment can use relaxed local defaults.');
    }

    for (const service of services.filter((item) => item.active)) {
      if (profile.kind === 'production' && service.tlsRequired && service.baseUrl.startsWith('http://') && service.type === 'external_api') {
        this.push(items, 'danger', `service-${service.key}-tls`, `${service.name} requires TLS`, 'External production services must use HTTPS when TLS is required.');
      }
      if (service.authMode !== 'none' && !service.secretRef) {
        this.push(items, 'danger', `service-${service.key}-secret`, `${service.name} needs a secret reference`, 'Authenticated services must reference Chicle Vault secrets.');
      }
      if (!service.healthPath) {
        this.push(items, 'warning', `service-${service.key}-health`, `${service.name} has no health path`, 'Health path improves diagnostics.');
      }
    }

    if (secrets.length === 0) {
      this.push(items, profile.kind === 'production' ? 'danger' : 'warning', 'secrets-empty', 'No secrets configured', 'At least critical runtime secrets should be configured before deploy.');
    }

    const danger = items.filter((item) => item.severity === 'danger').length;
    const warning = items.filter((item) => item.severity === 'warning').length;
    const readiness = Math.max(0, Math.round(100 - danger * 22 - warning * 7));
    return {
      environment: this.publicProfile(profile),
      readiness,
      status: danger > 0 ? 'blocked' : warning > 0 ? 'warning' : 'ready',
      items
    };
  }

  async ensureTenantDefaults(tenantId: string) {
    for (const item of DEFAULT_ENVIRONMENTS) {
      let profile = await this.profiles.findOne({ where: { tenantId, key: item.key } });
      if (!profile) {
        profile = await this.profiles.save(
          this.profiles.create({
            tenantId,
            key: item.key,
            name: item.name,
            kind: item.kind,
            active: true,
            isDefault: item.key === 'local',
            requiresReauth: item.requiresReauth,
            metadata: null
          })
        );
      }
      if (item.key === 'local') {
        await this.ensureLocalVariables(tenantId, profile.id);
      }
    }
  }

  private async ensureLocalVariables(tenantId: string, environmentId: string) {
    const defaults: UpsertEnvironmentVariableRequest[] = [
      { groupKey: 'api', key: 'API_PORT', value: 3000, valueType: 'number', target: 'docker', description: 'Local API port.' },
      { groupKey: 'app', key: 'APP_PORT', value: 8100, valueType: 'number', target: 'docker', description: 'Local app port.' },
      { groupKey: 'db', key: 'DB_PORT', value: 3306, valueType: 'number', target: 'docker', description: 'Local DB port.' },
      { groupKey: 'ai', key: 'AI_BASE_URL', value: 'http://ollama:11434/v1', valueType: 'string', target: 'api', description: 'Local Ollama URL from Docker Compose.' },
      { groupKey: 'runtime', key: 'API_PUBLIC_URL', value: '/api', valueType: 'string', target: 'runtime', description: 'Public API URL for the frontend runtime config.' },
      { groupKey: 'runtime', key: 'ADMIN_PUBLIC_URL', value: 'http://localhost:8100', valueType: 'string', target: 'runtime', description: 'Local Admin public URL.' },
      { groupKey: 'runtime', key: 'APP_NAME', value: 'Chicle Engine', valueType: 'string', target: 'runtime', description: 'Public application name.' },
      { groupKey: 'security', key: 'CHICLE_CORS_ORIGINS', value: 'http://localhost:8100,http://127.0.0.1:8100', valueType: 'string', target: 'api', description: 'Allowed browser origins for local Admin.' },
      { groupKey: 'security', key: 'CHICLE_SWAGGER_ENABLED', value: false, valueType: 'boolean', target: 'api', description: 'Swagger is disabled by default in production.' }
    ];

    for (const item of defaults) {
      const exists = await this.variables.exist({ where: { tenantId, environmentId, key: item.key ?? '' } });
      if (!exists) {
        await this.variables.save(
          this.variables.create({
            tenantId,
            environmentId,
            groupKey: item.groupKey ?? 'general',
            key: item.key ?? '',
            value: this.serializeValue(item.value, item.valueType ?? 'string'),
            valueType: item.valueType ?? 'string',
            target: item.target ?? 'api',
            editable: true,
            requiresRestart: false,
            description: item.description ?? null
          })
        );
      }
    }
  }

  private async profileByKey(auth: AuthContext, key: string) {
    await this.ensureTenantDefaults(auth.tenant.id);
    const profile = await this.profiles.findOne({ where: { tenantId: auth.tenant.id, key: this.normalizeKey(key, 'environment key') } });
    if (!profile) {
      throw new NotFoundException('Environment not found');
    }
    return profile;
  }

  private async assertSecretWriteAllowed(auth: AuthContext, profile: EnvironmentProfile, reauthPassword?: string) {
    if (!profile.requiresReauth && profile.kind !== 'production') {
      return;
    }
    if (!reauthPassword) {
      throw new UnauthorizedException('Reauthentication is required for this environment');
    }
    if (!(await compare(reauthPassword, auth.user.passwordHash))) {
      throw new UnauthorizedException('Reauthentication failed');
    }
  }

  private publicVariable(item: EnvironmentVariable) {
    return {
      ...item,
      parsedValue: this.parseValue(item.value, item.valueType)
    };
  }

  private publicSecret(profile: EnvironmentProfile, item: EnvironmentSecret) {
    return {
      id: item.id,
      tenantId: item.tenantId,
      environmentId: item.environmentId,
      scopeType: item.scopeType,
      scopeKey: item.scopeKey,
      key: item.key,
      algorithm: item.algorithm,
      keyVersion: item.keyVersion,
      maskedPreview: item.maskedPreview,
      status: item.status,
      lastRotatedAt: item.lastRotatedAt,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      secretRef: `secret:${profile.key}.${item.scopeType}.${item.scopeKey}.${item.key}`
    };
  }

  private publicProfile(profile: EnvironmentProfile) {
    return {
      key: profile.key,
      name: profile.name,
      kind: profile.kind
    };
  }

  private normalizeKey(value: string | undefined, label: string) {
    const key = (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!key || key.length > 120) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return key;
  }

  private cleanVariableKey(value: string | undefined) {
    const key = (value ?? '').trim();
    if (!/^[A-Z][A-Z0-9_\\.:-]{1,159}$/.test(key)) {
      throw new BadRequestException('Variable key must be uppercase and may include numbers, _, ., : or -');
    }
    return key;
  }

  private cleanText(value: string | undefined, label: string, max: number) {
    const text = (value ?? '').trim();
    if (!text || text.length > max) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return text;
  }

  private cleanUrl(value: string | undefined) {
    const text = this.cleanText(value, 'Base URL', 500);
    try {
      const parsed = new URL(text);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('bad protocol');
      }
      return parsed.toString().replace(/\/$/, '');
    } catch {
      throw new BadRequestException('Base URL is invalid');
    }
  }

  private inferValueType(value: unknown) {
    if (typeof value === 'boolean') {
      return 'boolean' as const;
    }
    if (typeof value === 'number') {
      return 'number' as const;
    }
    if (typeof value === 'object' && value !== null) {
      return 'json' as const;
    }
    return 'string' as const;
  }

  private serializeValue(value: unknown, valueType: EnvironmentVariable['valueType']) {
    if (value === undefined || value === null) {
      return valueType === 'json' ? '{}' : '';
    }
    if (valueType === 'json') {
      return JSON.stringify(value);
    }
    if (valueType === 'boolean') {
      return String(value === true || value === 'true');
    }
    if (valueType === 'number') {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        throw new BadRequestException('Number value is invalid');
      }
      return String(number);
    }
    return String(value);
  }

  private parseValue(value: string, valueType: EnvironmentVariable['valueType']) {
    if (valueType === 'boolean') {
      return value === 'true';
    }
    if (valueType === 'number') {
      return Number(value);
    }
    if (valueType === 'json') {
      return this.readJsonVariable(value, {});
    }
    return value;
  }

  private readJsonVariable(value: string | undefined, fallback: Record<string, unknown>) {
    if (!value) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  private variableString(map: Map<string, EnvironmentVariable>, key: string, fallback: string) {
    const value = map.get(key)?.value;
    return value && value.trim() ? value : fallback;
  }

  private booleanVariable(variables: EnvironmentVariable[], key: string) {
    const value = variables.find((item) => item.key === key)?.value;
    return value === 'true';
  }

  private require(items: EnvironmentValidationItem[], ok: boolean, key: string, title: string, detail: string) {
    this.push(items, ok ? 'ok' : 'danger', key, title, detail);
  }

  private push(
    items: EnvironmentValidationItem[],
    severity: EnvironmentValidationItem['severity'],
    key: string,
    title: string,
    detail: string
  ) {
    items.push({ severity, key, title, detail });
  }

  private limitNumber(value: number, min: number, max: number) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return min;
    }
    return Math.min(Math.max(Math.round(number), min), max);
  }

  private composeTemplate(profile: EnvironmentProfile) {
    return `name: chicle-${profile.key}

services:
  api:
    image: chicle-engine-api:latest
    environment:
      CHICLE_ENV: ${profile.key}
      CHICLE_VAULT_PATH: /var/lib/chicle/vault
      DB_HOST: \${DB_HOST:?required}
      DB_PORT: \${DB_PORT:-3306}
      DB_NAME: \${DB_NAME:?required}
      DB_USER: \${DB_USER:?required}
      DB_PASSWORD: \${DB_PASSWORD:?required}
    volumes:
      - chicle_vault:/var/lib/chicle/vault
      - chicle_files:/app/storage/files
    ports:
      - "\${API_PORT:-3000}:3000"

volumes:
  chicle_vault:
  chicle_files:
`;
  }

  private envTemplate(profile: EnvironmentProfile) {
    return `CHICLE_ENV=${profile.key}
CHICLE_VAULT_PATH=/var/lib/chicle/vault
DB_HOST=
DB_PORT=3306
DB_NAME=chicle_engine
DB_USER=chicle
DB_PASSWORD=
API_PORT=3000
`;
  }

  private checklist(profile: EnvironmentProfile, validation: EnvironmentValidationResult) {
    return `# Deploy Checklist: ${profile.name}

Generated status: ${validation.status}
Readiness: ${validation.readiness}%

## Required Review

${validation.items.map((item) => `- [${item.severity === 'ok' ? 'x' : ' '}] ${item.title}: ${item.detail}`).join('\n')}

## Security Rules

- Do not commit secrets.
- Keep Chicle Vault outside the database.
- Keep production CORS explicit.
- Keep Swagger protected or disabled.
- Validate service registry health before publishing.
`;
  }
}

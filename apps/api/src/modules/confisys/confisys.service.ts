import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthMethodConfig, SecurityLevel, SecurityPolicy } from '../auth/auth.service';
import { CONFISYS_DEFAULTS, DEFAULT_SECURITY_POLICY } from './confisys.defaults';
import { ConfisysParam, ConfisysValueType } from './confisys.entity';

export interface ConfisysEntry {
  key: string;
  value: unknown;
  valueType: ConfisysValueType;
  category: string;
  description?: string | null;
  isPublic: boolean;
  editable: boolean;
  source: string;
  updatedAt?: Date;
}

export interface ConfisysUpdate {
  value: unknown;
  valueType?: ConfisysValueType;
  category?: string;
  description?: string | null;
  isPublic?: boolean;
  editable?: boolean;
}

@Injectable()
export class ConfisysService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConfisysService.name);
  private readonly cache = new Map<string, ConfisysEntry>();
  private loaded = false;

  constructor(
    @InjectRepository(ConfisysParam)
    private readonly confisys: Repository<ConfisysParam>
  ) {}

  async onApplicationBootstrap() {
    await this.seedMissingDefaults();
    await this.loadCache();
  }

  async list(includePrivate = true): Promise<ConfisysEntry[]> {
    await this.ensureLoaded();
    return Array.from(this.cache.values())
      .filter((entry) => includePrivate || entry.isPublic)
      .sort((a, b) => a.category.localeCompare(b.category) || a.key.localeCompare(b.key));
  }

  get<T>(key: string, fallback: T): T {
    const entry = this.cache.get(key);
    return (entry?.value ?? fallback) as T;
  }

  getSecurityPolicy(): SecurityPolicy {
    return {
      level: this.getSecurityLevel('security.level', DEFAULT_SECURITY_POLICY.level),
      requireMfa: this.get<boolean>('security.mfa.required', DEFAULT_SECURITY_POLICY.requireMfa),
      password: {
        enabled: this.get<boolean>('security.password.enabled', DEFAULT_SECURITY_POLICY.password.enabled),
        minLength: this.get<number>(
          'security.password.minLength',
          DEFAULT_SECURITY_POLICY.password.minLength
        ),
        hash: this.getPasswordHash('security.password.hash', DEFAULT_SECURITY_POLICY.password.hash)
      },
      session: {
        webMode: this.getSessionMode('security.session.webMode', DEFAULT_SECURITY_POLICY.session.webMode),
        accessTokenTtlMinutes: this.get<number>(
          'security.session.accessTokenTtlMinutes',
          DEFAULT_SECURITY_POLICY.session.accessTokenTtlMinutes
        ),
        refreshTokenTtlDays: this.get<number>(
          'security.session.refreshTokenTtlDays',
          DEFAULT_SECURITY_POLICY.session.refreshTokenTtlDays
        )
      },
      methods: this.getAuthMethods()
    };
  }

  async upsert(key: string, update: ConfisysUpdate) {
    const current = await this.confisys.findOne({ where: { key } });
    const valueType = update.valueType ?? this.inferValueType(update.value);
    const serialized = this.serialize(update.value, valueType);

    const entity = current
      ? this.confisys.merge(current, {
          value: serialized,
          valueType,
          category: update.category ?? current.category,
          description: update.description ?? current.description,
          isPublic: update.isPublic ?? current.isPublic,
          editable: update.editable ?? current.editable,
          source: 'admin'
        })
      : this.confisys.create({
          key,
          value: serialized,
          valueType,
          category: update.category ?? 'custom',
          description: update.description,
          isPublic: update.isPublic ?? false,
          editable: update.editable ?? true,
          source: 'admin'
        });

    const saved = await this.confisys.save(entity);
    return {
      entry: this.toEntry(saved),
      restartRequired: true
    };
  }

  private async ensureLoaded() {
    if (this.loaded) {
      return;
    }

    await this.seedMissingDefaults();
    await this.loadCache();
  }

  private async seedMissingDefaults() {
    for (const item of CONFISYS_DEFAULTS) {
      const exists = await this.confisys.exist({ where: { key: item.key } });
      if (exists) {
        continue;
      }

      await this.confisys.save(
        this.confisys.create({
          key: item.key,
          value: this.serialize(item.value, item.valueType),
          valueType: item.valueType,
          category: item.category,
          description: item.description,
          isPublic: item.isPublic ?? false,
          editable: item.editable ?? true,
          source: 'seed'
        })
      );
    }
  }

  private async loadCache() {
    const rows = await this.confisys.find();
    this.cache.clear();

    for (const row of rows) {
      this.cache.set(row.key, this.toEntry(row));
    }

    this.loaded = true;
    this.logger.log(`Loaded ${rows.length} confisys params into memory`);
  }

  private toEntry(row: ConfisysParam): ConfisysEntry {
    return {
      key: row.key,
      value: this.deserialize(row.value, row.valueType),
      valueType: row.valueType,
      category: row.category,
      description: row.description,
      isPublic: row.isPublic,
      editable: row.editable,
      source: row.source,
      updatedAt: row.updatedAt
    };
  }

  private getAuthMethods(): AuthMethodConfig[] {
    return DEFAULT_SECURITY_POLICY.methods.map((method) => {
      if (method.type === 'password') {
        return {
          ...method,
          enabled: this.get<boolean>('security.methods.password.enabled', method.enabled)
        };
      }

      if (method.type === 'passkey') {
        return {
          ...method,
          enabled: this.get<boolean>('security.methods.passkey.enabled', method.enabled)
        };
      }

      if (method.type === 'oidc') {
        return {
          ...method,
          enabled: this.get<boolean>('security.methods.oidc.enabled', method.enabled)
        };
      }

      if (method.type === 'device_code') {
        return {
          ...method,
          enabled: this.get<boolean>('security.methods.deviceCode.enabled', method.enabled)
        };
      }

      return method;
    });
  }

  private getSecurityLevel(key: string, fallback: SecurityLevel): SecurityLevel {
    const value = this.get<string>(key, fallback);
    return value === 'basic' || value === 'standard' || value === 'high' ? value : fallback;
  }

  private getPasswordHash(key: string, fallback: 'argon2id' | 'bcrypt') {
    const value = this.get<string>(key, fallback);
    return value === 'argon2id' || value === 'bcrypt' ? value : fallback;
  }

  private getSessionMode(key: string, fallback: 'refresh_cookie' | 'cookie_session' | 'bearer') {
    const value = this.get<string>(key, fallback);
    return value === 'refresh_cookie' || value === 'cookie_session' || value === 'bearer'
      ? value
      : fallback;
  }

  private inferValueType(value: unknown): ConfisysValueType {
    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (typeof value === 'object') {
      return 'json';
    }

    return 'string';
  }

  private serialize(value: unknown, valueType: ConfisysValueType) {
    if (valueType === 'json') {
      return JSON.stringify(value ?? null);
    }

    return String(value);
  }

  private deserialize(value: string, valueType: ConfisysValueType): unknown {
    if (valueType === 'number') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (valueType === 'boolean') {
      return value === 'true';
    }

    if (valueType === 'json') {
      try {
        return JSON.parse(value);
      } catch (error) {
        this.logger.warn(`Invalid JSON confisys value ignored`);
        return null;
      }
    }

    return value;
  }
}

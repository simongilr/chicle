import { BadRequestException, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { AuditService } from '../audit/audit.service';
import { ConfisysService } from '../confisys/confisys.service';
import { TranslationBundleVersion } from './translation-bundle-version.entity';
import { TranslationEntry } from './translation-entry.entity';
import { TranslationMissingKey } from './translation-missing-key.entity';
import { TranslationNamespace, TranslationScope } from './translation-namespace.entity';
import {
  DEFAULT_TRANSLATION_BUNDLES,
  DEFAULT_TRANSLATION_LOCALE,
  SUPPORTED_TRANSLATION_LOCALES,
  SupportedTranslationLocale,
  TranslationBundleSeed
} from './translations.defaults';

export interface TextBundleResponse {
  schemaVersion: 1;
  kind: 'text_bundle';
  namespace: string;
  locale: SupportedTranslationLocale;
  defaultLocale: SupportedTranslationLocale;
  supportedLocales: SupportedTranslationLocale[];
  scope: TranslationScope;
  ownerKey: string;
  version: string;
  hash: string;
  entries: Record<string, string>;
  source: 'database' | 'seed';
}

export interface TranslationNamespaceSummary {
  key: string;
  name: string;
  description: string | null;
  scope: TranslationScope;
  ownerKey: string;
  locales: SupportedTranslationLocale[];
  source: 'database' | 'seed';
}

export interface TranslationNamespacesResponse {
  schemaVersion: 1;
  kind: 'translation_namespaces';
  namespaces: TranslationNamespaceSummary[];
}

export interface UpsertTextBundleRequest {
  entries?: Record<string, unknown>;
  version?: string;
  name?: string;
  description?: string | null;
  isPublic?: boolean;
}

export interface UpsertTranslationKeyRequest {
  namespace?: string;
  key?: string;
  values?: Record<string, unknown>;
  name?: string;
  description?: string | null;
}

export interface UpsertTranslationKeyResponse {
  schemaVersion: 1;
  kind: 'translation_key_upsert';
  namespace: string;
  key: string;
  locales: SupportedTranslationLocale[];
  bundles: TextBundleResponse[];
}

@Injectable()
export class TranslationsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TranslationsService.name);
  private databaseReady = true;

  constructor(
    @InjectRepository(TranslationNamespace)
    private readonly namespaces: Repository<TranslationNamespace>,
    @InjectRepository(TranslationEntry)
    private readonly entries: Repository<TranslationEntry>,
    @InjectRepository(TranslationBundleVersion)
    private readonly versions: Repository<TranslationBundleVersion>,
    private readonly confisys: ConfisysService,
    private readonly audit: AuditService
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaults();
  }

  async getBundle(namespace: string, locale?: string): Promise<TextBundleResponse> {
    const normalizedNamespace = this.normalizeNamespace(namespace);
    const normalizedLocale = this.normalizeLocale(locale ?? this.confisys.get('i18n.defaultLocale', DEFAULT_TRANSLATION_LOCALE));
    const defaultLocale = this.normalizeLocale(this.confisys.get('i18n.defaultLocale', DEFAULT_TRANSLATION_LOCALE));
    const scope: TranslationScope = 'platform';
    const ownerKey = 'global';

    if (this.databaseReady) {
      try {
        const activeVersion = await this.versions.findOne({
          where: { scope, ownerKey, namespace: normalizedNamespace, locale: normalizedLocale, active: true },
          order: { createdAt: 'DESC' }
        });

        if (activeVersion) {
          return this.toResponse({
            namespace: normalizedNamespace,
            locale: normalizedLocale,
            defaultLocale,
            scope,
            ownerKey,
            version: activeVersion.version,
            entries: this.normalizeEntries(activeVersion.entries),
            source: 'database'
          });
        }

        const activeEntries = await this.entries.find({
          where: { scope, ownerKey, namespace: normalizedNamespace, locale: normalizedLocale, active: true },
          order: { key: 'ASC' }
        });

        if (activeEntries.length > 0) {
          return this.toResponse({
            namespace: normalizedNamespace,
            locale: normalizedLocale,
            defaultLocale,
            scope,
            ownerKey,
            version: 'entries-current',
            entries: Object.fromEntries(activeEntries.map((entry) => [entry.key, entry.value])),
            source: 'database'
          });
        }
      } catch (error) {
        this.handleDatabaseError(error);
      }
    }

    const seed = this.findSeed(normalizedNamespace, normalizedLocale) ?? this.findSeed(normalizedNamespace, defaultLocale);
    return this.toResponse({
      namespace: normalizedNamespace,
      locale: normalizedLocale,
      defaultLocale,
      scope,
      ownerKey,
      version: seed?.version ?? 'seed-empty-v1',
      entries: seed?.entries ?? {},
      source: 'seed'
    });
  }

  async listNamespaces(): Promise<TranslationNamespacesResponse> {
    const summaries = new Map<string, TranslationNamespaceSummary>();
    const scope: TranslationScope = 'platform';
    const ownerKey = 'global';

    for (const seed of DEFAULT_TRANSLATION_BUNDLES) {
      const current = summaries.get(seed.namespace);
      summaries.set(seed.namespace, {
        key: seed.namespace,
        name: current?.name ?? seed.name,
        description: current?.description ?? seed.description,
        scope,
        ownerKey,
        locales: this.mergeLocales(current?.locales, seed.locale),
        source: current?.source ?? 'seed'
      });
    }

    if (this.databaseReady) {
      try {
        const namespaces = await this.namespaces.find({ where: { active: true }, order: { key: 'ASC' } });
        for (const namespace of namespaces) {
          const current = summaries.get(namespace.key);
          summaries.set(namespace.key, {
            key: namespace.key,
            name: namespace.name,
            description: namespace.description ?? current?.description ?? null,
            scope: namespace.scope,
            ownerKey: namespace.ownerKey,
            locales: current?.locales ?? [],
            source: 'database'
          });
        }

        const versions = await this.versions.find({ where: { active: true }, order: { namespace: 'ASC', locale: 'ASC' } });
        for (const version of versions) {
          const locale = this.localeForList(version.locale);
          const current =
            summaries.get(version.namespace) ??
            ({
              key: version.namespace,
              name: version.namespace,
              description: null,
              scope: version.scope,
              ownerKey: version.ownerKey,
              locales: [],
              source: 'database'
            } satisfies TranslationNamespaceSummary);
          summaries.set(version.namespace, {
            ...current,
            locales: this.mergeLocales(current.locales, locale),
            source: current.source === 'seed' ? 'database' : current.source
          });
        }
      } catch (error) {
        this.handleDatabaseError(error);
      }
    }

    return {
      schemaVersion: 1,
      kind: 'translation_namespaces',
      namespaces: [...summaries.values()].sort((a, b) => a.key.localeCompare(b.key))
    };
  }

  async upsertBundle(auth: AuthContext, namespace: string, locale: string, request: UpsertTextBundleRequest) {
    const normalizedNamespace = this.normalizeNamespace(namespace);
    const normalizedLocale = this.normalizeLocale(locale);
    const entries = this.normalizeEntries(request.entries ?? {});
    const scope: TranslationScope = 'platform';
    const ownerKey = 'global';
    const version = this.normalizeVersion(request.version ?? `${normalizedNamespace}-${normalizedLocale}-${Date.now()}`);
    const hash = this.hashEntries(entries);

    await this.upsertNamespace({
      scope,
      ownerKey,
      key: normalizedNamespace,
      name: request.name?.trim() || this.findSeed(normalizedNamespace, normalizedLocale)?.name || normalizedNamespace,
      description:
        request.description === undefined
          ? this.findSeed(normalizedNamespace, normalizedLocale)?.description ?? null
          : request.description,
      isPublic: request.isPublic ?? true
    });

    await this.versions.update({ scope, ownerKey, namespace: normalizedNamespace, locale: normalizedLocale, active: true }, { active: false });
    const bundle = await this.versions.save(
      this.versions.create({
        scope,
        ownerKey,
        namespace: normalizedNamespace,
        locale: normalizedLocale,
        version,
        hash,
        entries,
        active: true,
        publishedAt: new Date()
      })
    );

    for (const [key, value] of Object.entries(entries)) {
      const existing = await this.entries.findOne({
        where: { scope, ownerKey, namespace: normalizedNamespace, locale: normalizedLocale, key }
      });
      await this.entries.save(
        this.entries.create({
          ...(existing ?? {}),
          scope,
          ownerKey,
          namespace: normalizedNamespace,
          locale: normalizedLocale,
          key,
          value,
          source: 'admin',
          active: true
        })
      );
    }

    void this.audit
      .record({
        auth,
        action: 'translations.bundle.upserted',
        resourceType: 'translation_bundle',
        resourceId: bundle.id,
        metadata: { namespace: normalizedNamespace, locale: normalizedLocale, version, keys: Object.keys(entries).length }
      })
      .catch(() => undefined);

    return this.getBundle(normalizedNamespace, normalizedLocale);
  }

  async upsertKey(auth: AuthContext, request: UpsertTranslationKeyRequest): Promise<UpsertTranslationKeyResponse> {
    const normalizedNamespace = this.normalizeNamespace(request.namespace ?? 'admin');
    const key = this.normalizeTranslationKey(request.key ?? '');
    const values = request.values && typeof request.values === 'object' && !Array.isArray(request.values) ? request.values : {};
    const locales = SUPPORTED_TRANSLATION_LOCALES.filter((locale) =>
      Object.prototype.hasOwnProperty.call(values, locale)
    );

    if (locales.length === 0) {
      throw new BadRequestException('At least one supported locale value is required.');
    }

    const bundles: TextBundleResponse[] = [];
    for (const locale of locales) {
      const current = await this.getBundle(normalizedNamespace, locale);
      const entries = {
        ...current.entries,
        [key]: String(values[locale] ?? '')
      };
      const version = this.normalizeVersion(
        `${normalizedNamespace}-${locale}-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`
      );

      bundles.push(
        await this.upsertBundle(auth, normalizedNamespace, locale, {
          version,
          name: request.name?.trim() || this.findSeed(normalizedNamespace, locale)?.name || normalizedNamespace,
          description:
            request.description === undefined
              ? this.findSeed(normalizedNamespace, locale)?.description ?? null
              : request.description,
          entries
        })
      );
    }

    void this.audit
      .record({
        auth,
        action: 'translations.key.upserted',
        resourceType: 'translation_key',
        resourceId: `${normalizedNamespace}:${key}`,
        metadata: { namespace: normalizedNamespace, key, locales }
      })
      .catch(() => undefined);

    return {
      schemaVersion: 1,
      kind: 'translation_key_upsert',
      namespace: normalizedNamespace,
      key,
      locales,
      bundles
    };
  }

  async recordMissingKey(request: {
    namespace?: string;
    locale?: string;
    key?: string;
    route?: string | null;
    context?: Record<string, unknown> | null;
  }) {
    const key = String(request.key ?? '').trim();
    if (!key || key.length > 220) {
      throw new BadRequestException('Invalid translation key.');
    }

    const namespace = this.normalizeNamespace(request.namespace ?? 'admin');
    const locale = this.normalizeLocale(request.locale ?? DEFAULT_TRANSLATION_LOCALE);

    if (!this.databaseReady) {
      return { recorded: false, reason: 'database_unavailable' };
    }

    try {
      await this.entries.manager.getRepository(TranslationMissingKey).save(
        this.entries.manager.getRepository(TranslationMissingKey).create({
          scope: 'platform',
          ownerKey: 'global',
          namespace,
          locale,
          key,
          route: request.route ?? null,
          context: request.context ?? null
        })
      );
      return { recorded: true };
    } catch (error) {
      this.handleDatabaseError(error);
      return { recorded: false, reason: 'database_unavailable' };
    }
  }

  private async seedDefaults() {
    try {
      for (const seed of DEFAULT_TRANSLATION_BUNDLES) {
        await this.upsertSeedBundle(seed);
      }
      this.databaseReady = true;
    } catch (error) {
      this.handleDatabaseError(error, true);
    }
  }

  private async upsertSeedBundle(seed: TranslationBundleSeed) {
    const scope: TranslationScope = 'platform';
    const ownerKey = 'global';
    await this.upsertNamespace({
      scope,
      ownerKey,
      key: seed.namespace,
      name: seed.name,
      description: seed.description,
      isPublic: true
    });

    const existingVersion = await this.versions.findOne({
      where: { scope, ownerKey, namespace: seed.namespace, locale: seed.locale, version: seed.version }
    });
    const activeVersion = await this.versions.findOne({
      where: { scope, ownerKey, namespace: seed.namespace, locale: seed.locale, active: true }
    });

    if (!existingVersion && !activeVersion) {
      await this.versions.save(
        this.versions.create({
          scope,
          ownerKey,
          namespace: seed.namespace,
          locale: seed.locale,
          version: seed.version,
          hash: this.hashEntries(seed.entries),
          entries: seed.entries,
          active: true,
          publishedAt: new Date()
        })
      );
    } else if (activeVersion) {
      const activeEntries = this.normalizeEntries(activeVersion.entries);
      const mergedEntries = { ...seed.entries, ...activeEntries };
      if (Object.keys(mergedEntries).length !== Object.keys(activeEntries).length) {
        await this.versions.save(
          this.versions.create({
            ...activeVersion,
            entries: mergedEntries,
            hash: this.hashEntries(mergedEntries)
          })
        );
      }
    }

    for (const [key, value] of Object.entries(seed.entries)) {
      const existing = await this.entries.findOne({
        where: { scope, ownerKey, namespace: seed.namespace, locale: seed.locale, key }
      });
      if (!existing) {
        await this.entries.save(
          this.entries.create({
            scope,
            ownerKey,
            namespace: seed.namespace,
            locale: seed.locale,
            key,
            value,
            source: 'seed',
            active: true
          })
        );
      }
    }
  }

  private async upsertNamespace(request: {
    scope: TranslationScope;
    ownerKey: string;
    key: string;
    name: string;
    description?: string | null;
    isPublic: boolean;
  }) {
    const existing = await this.namespaces.findOne({
      where: { scope: request.scope, ownerKey: request.ownerKey, key: request.key }
    });
    await this.namespaces.save(
      this.namespaces.create({
        ...(existing ?? {}),
        scope: request.scope,
        ownerKey: request.ownerKey,
        key: request.key,
        name: request.name,
        description: request.description ?? null,
        active: true,
        isPublic: request.isPublic
      })
    );
  }

  private toResponse(request: {
    namespace: string;
    locale: SupportedTranslationLocale;
    defaultLocale: SupportedTranslationLocale;
    scope: TranslationScope;
    ownerKey: string;
    version: string;
    entries: Record<string, string>;
    source: 'database' | 'seed';
  }): TextBundleResponse {
    return {
      schemaVersion: 1,
      kind: 'text_bundle',
      namespace: request.namespace,
      locale: request.locale,
      defaultLocale: request.defaultLocale,
      supportedLocales: SUPPORTED_TRANSLATION_LOCALES,
      scope: request.scope,
      ownerKey: request.ownerKey,
      version: request.version,
      hash: this.hashEntries(request.entries),
      entries: request.entries,
      source: request.source
    };
  }

  private findSeed(namespace: string, locale: SupportedTranslationLocale) {
    return DEFAULT_TRANSLATION_BUNDLES.find((bundle) => bundle.namespace === namespace && bundle.locale === locale);
  }

  private normalizeNamespace(namespace: string) {
    const value = String(namespace ?? '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{1,120}$/.test(value)) {
      throw new BadRequestException('Invalid translation namespace.');
    }
    return value;
  }

  private normalizeLocale(locale: unknown): SupportedTranslationLocale {
    return locale === 'en' ? 'en' : DEFAULT_TRANSLATION_LOCALE;
  }

  private normalizeTranslationKey(key: string) {
    const value = String(key ?? '').trim();
    if (!/^[a-zA-Z0-9._:-]{1,220}$/.test(value)) {
      throw new BadRequestException('Invalid translation key.');
    }
    return value;
  }

  private localeForList(locale: unknown): SupportedTranslationLocale {
    return SUPPORTED_TRANSLATION_LOCALES.includes(locale as SupportedTranslationLocale)
      ? (locale as SupportedTranslationLocale)
      : DEFAULT_TRANSLATION_LOCALE;
  }

  private mergeLocales(locales: SupportedTranslationLocale[] | undefined, locale: SupportedTranslationLocale) {
    return [...new Set([...(locales ?? []), locale])].sort();
  }

  private normalizeVersion(version: string) {
    const value = String(version ?? '').trim();
    if (!/^[a-zA-Z0-9._:-]{1,80}$/.test(value)) {
      throw new BadRequestException('Invalid translation version.');
    }
    return value;
  }

  private normalizeEntries(entries: unknown): Record<string, string> {
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
      return {};
    }

    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(entries as Record<string, unknown>)) {
      const normalizedKey = key.trim();
      if (!/^[a-zA-Z0-9._:-]{1,220}$/.test(normalizedKey)) {
        throw new BadRequestException(`Invalid translation key: ${key}`);
      }
      normalized[normalizedKey] = String(value ?? '');
    }
    return normalized;
  }

  private hashEntries(entries: Record<string, string>) {
    const stable = Object.keys(entries)
      .sort()
      .reduce<Record<string, string>>((result, key) => {
        result[key] = entries[key];
        return result;
      }, {});
    return createHash('sha256').update(JSON.stringify(stable)).digest('hex');
  }

  private handleDatabaseError(error: unknown, duringBootstrap = false) {
    if (this.isDatabaseStructureError(error)) {
      this.databaseReady = false;
      if (duringBootstrap) {
        this.logger.warn('Translation tables are not available yet. Using in-memory seed bundles.');
      }
      return;
    }
    throw error;
  }

  private isDatabaseStructureError(error: unknown) {
    const value = error as { code?: string; errno?: number; message?: string };
    return (
      value.code === 'ER_NO_SUCH_TABLE' ||
      value.code === 'ER_BAD_FIELD_ERROR' ||
      value.errno === 1146 ||
      value.errno === 1054 ||
      String(value.message ?? '').includes("doesn't exist")
    );
  }
}

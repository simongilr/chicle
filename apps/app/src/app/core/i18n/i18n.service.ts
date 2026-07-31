import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { I18N_TRANSLATIONS, SupportedLanguage, TranslationDictionary } from './i18n.translations';

const LANGUAGE_STORAGE_KEY = 'chicle.admin.language';
const BUNDLE_STORAGE_PREFIX = 'chicle.i18n.bundle';
const BUNDLE_CACHE_VERSION = '20260731-factory-label';
const DEFAULT_NAMESPACE = 'admin';

interface PublicConfisysEntry {
  key: string;
  value: unknown;
}

interface TextBundleResponse {
  namespace: string;
  locale: SupportedLanguage;
  defaultLocale?: SupportedLanguage;
  supportedLocales?: SupportedLanguage[];
  version?: string;
  hash?: string;
  entries?: TranslationDictionary;
}

interface CachedTextBundle {
  cacheVersion?: string;
  hash?: string;
  version?: string;
  entries: TranslationDictionary;
  cachedAt: string;
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly languageState = signal<SupportedLanguage>('es');
  private readonly remoteDictionaries = signal<Record<string, TranslationDictionary>>({});
  private readonly loadingState = signal(false);
  private readonly reportedMissingKeys = new Set<string>();

  readonly language = this.languageState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly dictionary = computed(() => {
    const language = this.language();
    return {
      ...I18N_TRANSLATIONS.es,
      ...(I18N_TRANSLATIONS[language] ?? {}),
      ...(this.remoteDictionaries()[this.bundleStorageKey(DEFAULT_NAMESPACE, language)] ?? {})
    };
  });

  async initialize() {
    const stored = this.readStoredLanguage();
    const language = stored ?? (await this.loadRuntimeDefaultLanguage());
    this.activateLanguage(language, true);
    await this.refresh(DEFAULT_NAMESPACE, language);
    return language;
  }

  setLanguage(language: unknown) {
    const next = this.normalizeLanguage(language);
    this.activateLanguage(next, true);
    void this.refresh(DEFAULT_NAMESPACE, next);
  }

  async refresh(namespace = DEFAULT_NAMESPACE, language = this.language()) {
    this.loadCachedBundle(namespace, language);
    this.loadingState.set(true);

    try {
      const bundle = await firstValueFrom(
        this.http.get<TextBundleResponse>(`${environment.apiUrl}/translations/bundles/${namespace}`, {
          params: { locale: language }
        })
      );
      this.applyBundle(namespace, language, bundle);
    } catch {
      this.loadCachedBundle(namespace, language);
    } finally {
      this.loadingState.set(false);
    }
  }

  async reportMissingKey(key: string, namespace = DEFAULT_NAMESPACE) {
    const reportKey = `${namespace}.${this.language()}.${key}`;
    if (this.reportedMissingKeys.has(reportKey)) {
      return;
    }
    this.reportedMissingKeys.add(reportKey);

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/translations/missing`, {
          namespace,
          locale: this.language(),
          key,
          route: typeof location === 'undefined' ? null : location.pathname
        })
      );
    } catch {
      // Missing-key reporting must never block the UI.
    }
  }

  resolve(value: string | { key?: string; fallback?: string } | null | undefined, params?: Record<string, string | number>) {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return this.translate(value, params);
    }

    if (value.key) {
      return this.label(value.key, value.fallback ?? '');
    }

    return value.fallback ?? '';
  }

  translate(key: string, params?: Record<string, string | number>) {
    const namespaced = this.namespacedKey(key);
    const template = this.lookup(key, namespaced) ?? I18N_TRANSLATIONS.es[key] ?? key;
    if (template === key) {
      void this.reportMissingKey(namespaced?.key ?? key, namespaced?.namespace ?? DEFAULT_NAMESPACE);
    }
    return this.interpolate(template, params);
  }

  label(key: string, fallback: string) {
    const namespaced = this.namespacedKey(key);
    const translated = this.lookup(key, namespaced) ?? I18N_TRANSLATIONS.es[key];
    if (!translated) {
      void this.reportMissingKey(namespaced?.key ?? key, namespaced?.namespace ?? DEFAULT_NAMESPACE);
    }
    return translated || fallback;
  }

  translateInNamespace(
    namespace: string,
    key: string,
    fallback = key,
    params?: Record<string, string | number>,
    language = this.language()
  ) {
    const translated = this.remoteDictionaries()[this.bundleStorageKey(namespace, language)]?.[key] ?? fallback;
    if (translated === fallback) {
      void this.reportMissingKey(key, namespace);
    }
    return this.interpolate(translated, params);
  }

  normalizeLanguage(language: unknown): SupportedLanguage {
    return language === 'en' ? 'en' : 'es';
  }

  private activateLanguage(language: SupportedLanguage, persist: boolean) {
    this.languageState.set(language);
    this.loadCachedBundle(DEFAULT_NAMESPACE, language);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }

    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }

  private readStoredLanguage() {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'es' || stored === 'en' ? stored : null;
  }

  private async loadRuntimeDefaultLanguage() {
    try {
      const entries = await firstValueFrom(this.http.get<PublicConfisysEntry[]>(`${environment.apiUrl}/confisys/public`));
      const runtimeDefault = entries.find((entry) => entry.key === 'i18n.defaultLocale')?.value;
      return this.normalizeLanguage(runtimeDefault);
    } catch {
      return 'es';
    }
  }

  private applyBundle(namespace: string, language: SupportedLanguage, bundle: TextBundleResponse) {
    const entries = this.filterEntries(bundle.entries ?? {});
    const key = this.bundleStorageKey(namespace, language);
    this.remoteDictionaries.update((current) => ({ ...current, [key]: entries }));

    if (typeof localStorage !== 'undefined') {
      const cached: CachedTextBundle = {
        cacheVersion: BUNDLE_CACHE_VERSION,
        hash: bundle.hash,
        version: bundle.version,
        entries,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(cached));
    }
  }

  private loadCachedBundle(namespace: string, language: SupportedLanguage) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const key = this.bundleStorageKey(namespace, language);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return;
    }

    try {
      const cached = JSON.parse(raw) as CachedTextBundle;
      if (cached.cacheVersion !== BUNDLE_CACHE_VERSION) {
        localStorage.removeItem(key);
        return;
      }
      this.remoteDictionaries.update((current) => ({ ...current, [key]: this.filterEntries(cached.entries) }));
    } catch {
      localStorage.removeItem(key);
    }
  }

  private filterEntries(entries: TranslationDictionary) {
    return Object.fromEntries(
      Object.entries(entries)
        .filter(([key]) => key && key.length <= 220)
        .map(([key, value]) => [key, String(value ?? '')])
    );
  }

  private bundleStorageKey(namespace: string, language: SupportedLanguage) {
    return `${BUNDLE_STORAGE_PREFIX}.${namespace}.${language}`;
  }

  private lookup(key: string, namespaced: { namespace: string; key: string } | null) {
    if (!namespaced) {
      return this.dictionary()[key];
    }
    return this.remoteDictionaries()[this.bundleStorageKey(namespaced.namespace, this.language())]?.[namespaced.key];
  }

  private namespacedKey(key: string) {
    const separator = key.indexOf(':');
    if (separator <= 0 || separator === key.length - 1) {
      return null;
    }

    const namespace = key.slice(0, separator);
    const localKey = key.slice(separator + 1);
    if (!/^[a-z0-9._-]{1,120}$/.test(namespace) || !localKey) {
      return null;
    }

    return { namespace, key: localKey };
  }

  private interpolate(template: string, params?: Record<string, string | number>) {
    if (!params) {
      return template;
    }

    return Object.entries(params).reduce(
      (value, [key, replacement]) => value.replaceAll(`{{${key}}}`, String(replacement)),
      template
    );
  }
}

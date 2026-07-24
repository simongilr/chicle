import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { I18N_TRANSLATIONS, SupportedLanguage } from '../../core/i18n/i18n.translations';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { AdminFilterBarComponent } from '../../shared/admin-filter-bar/admin-filter-bar.component';
import { AdminPanelComponent } from '../../shared/admin-panel/admin-panel.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { AiAssistantService, ApplyTranslationKeyAction } from '../../shared/ai-assistant-launcher/ai-assistant.service';

interface TextBundleResponse {
  namespace: string;
  locale: SupportedLanguage;
  version: string;
  hash: string;
  source: 'database' | 'seed' | 'local';
  entries: Record<string, string>;
}

interface TranslationNamespaceSummary {
  key: string;
  name: string;
  description?: string | null;
  locales?: SupportedLanguage[];
  source?: 'database' | 'seed' | 'local';
}

interface TranslationNamespacesResponse {
  namespaces: TranslationNamespaceSummary[];
}

interface UpsertTranslationKeyResponse {
  namespace: string;
  key: string;
  locales: SupportedLanguage[];
  bundles: TextBundleResponse[];
}

@Component({
  selector: 'app-translations-page',
  standalone: true,
  imports: [
    AdminFilterBarComponent,
    AdminPanelComponent,
    DynamicFieldControlComponent,
    LoadingSkeletonComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    StatusNoticeComponent,
    TranslatePipe,
    UiKitButtonComponent
  ],
  styles: [
    `
      .shell {
        display: grid;
        gap: var(--ch-page-gap);
      }

      .bundle-meta,
      .manager-grid,
      .entries {
        display: grid;
        gap: 12px;
      }

      .manager-grid {
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        align-items: end;
      }

      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .language-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .chip {
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 5px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .results-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .results-title {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1rem;
        font-weight: 850;
      }

      .entry-row {
        display: grid;
        grid-template-columns: minmax(220px, 0.44fr) minmax(280px, 1fr);
        gap: 12px;
        align-items: start;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 12px;
      }

      .entry-key {
        min-width: 0;
        color: var(--ch-color-text);
        font-family: var(--ch-font-family);
        font-weight: 850;
        overflow-wrap: anywhere;
      }

      .entry-meta {
        display: grid;
        gap: 6px;
      }

      .helper-text {
        margin: 0;
        color: var(--ch-color-muted);
        font-size: 0.86rem;
        line-height: 1.45;
      }

      textarea {
        box-sizing: border-box;
        width: 100%;
        min-height: 74px;
        resize: vertical;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 10px 12px;
        font: inherit;
        line-height: 1.35;
      }

      textarea:focus {
        border-color: var(--ch-color-primary);
        outline: none;
        box-shadow: 0 0 0 3px var(--ch-color-primary-soft);
      }

      .footer-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }

      @media (max-width: 820px) {
        .entry-row {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Textos" contextLabelKey="nav.context.translations">
      <div class="shell">
        <app-module-header
          eyebrow="Language runtime"
          eyebrowKey="translations.eyebrow"
          title="Text bundles"
          titleKey="translations.title"
          description="Administra paquetes de textos versionados para el Admin y futuras apps generadas."
          descriptionKey="translations.description"
          badge="i18n"
        ></app-module-header>

        <app-admin-filter-bar ariaLabel="Translation bundle filters" minColumnWidth="220px">
          <app-dynamic-field-control
            [field]="namespaceField()"
            [value]="namespace()"
            (valueChange)="setNamespace($event)"
          ></app-dynamic-field-control>
          <app-dynamic-field-control
            [field]="localeField()"
            [value]="locale()"
            (valueChange)="setLocale($event)"
          ></app-dynamic-field-control>
          <app-dynamic-field-control
            [field]="filterField()"
            [value]="filter()"
            (valueChange)="setFilter($event)"
          ></app-dynamic-field-control>
        </app-admin-filter-bar>

        @if (message()) {
          <app-status-notice tone="success">{{ message() }}</app-status-notice>
        }
        @if (error()) {
          <app-status-notice tone="error">{{ error() }}</app-status-notice>
        }
        @if (warning()) {
          <app-status-notice tone="warning">{{ warning() }}</app-status-notice>
        }

        @if (loading()) {
          <app-loading-skeleton variant="page" [label]="'translations.loading' | t" [rows]="6"></app-loading-skeleton>
        } @else {
          <app-admin-panel
            [title]="'translations.namespaces.title' | t"
            [description]="'translations.namespaces.description' | t"
          >
            <div class="manager-grid">
              <app-dynamic-field-control
                [field]="customNamespaceField()"
                [value]="newNamespace()"
                (valueChange)="setNewNamespace($event)"
              ></app-dynamic-field-control>
              <app-ui-kit-button
                [label]="'translations.namespaces.use' | t"
                tone="secondary"
                variant="outline"
                [disabled]="!canManage()"
                (pressed)="useCustomNamespace()"
              ></app-ui-kit-button>
            </div>
            <p class="helper-text">{{ 'translations.namespaces.help' | t }}</p>
          </app-admin-panel>

          <app-admin-panel
            [title]="'translations.languages.title' | t"
            [description]="'translations.languages.description' | t"
          >
            <div class="language-strip">
              @for (language of installedLanguages(); track language.value) {
                <button class="chip" type="button" (click)="setLocale(language.value)">
                  {{ language.label }}
                </button>
              }
            </div>
            <div class="manager-grid">
              <app-dynamic-field-control
                [field]="installLanguageField()"
                [value]="languageToInstall()"
                (valueChange)="setLanguageToInstall($event)"
              ></app-dynamic-field-control>
              <app-ui-kit-button
                [label]="'translations.languages.install' | t"
                tone="secondary"
                variant="outline"
                [disabled]="!canManage()"
                (pressed)="installLanguage()"
              ></app-ui-kit-button>
            </div>
            <p class="helper-text">{{ 'translations.languages.help' | t }}</p>
          </app-admin-panel>

          <app-admin-panel
            [title]="'translations.addKey.title' | t"
            [description]="'translations.addKey.description' | t"
          >
            <div class="manager-grid">
              <app-dynamic-field-control
                [field]="newKeyField()"
                [value]="newKey()"
                (valueChange)="setNewKey($event)"
              ></app-dynamic-field-control>
              <app-dynamic-field-control
                [field]="newValueEsField()"
                [value]="newValueEs()"
                (valueChange)="setNewValueEs($event)"
              ></app-dynamic-field-control>
              <app-dynamic-field-control
                [field]="newValueEnField()"
                [value]="newValueEn()"
                (valueChange)="setNewValueEn($event)"
              ></app-dynamic-field-control>
              <app-ui-kit-button
                [label]="'translations.addKey.action' | t"
                tone="primary"
                [disabled]="!canManage() || saving()"
                (pressed)="addKey()"
              ></app-ui-kit-button>
            </div>
          </app-admin-panel>

          <app-admin-panel
            [title]="'translations.bundle.title' | t"
            [description]="'translations.bundle.description' | t"
          >
            <div class="bundle-meta">
              <div class="meta-row">
                <span class="chip">{{ bundle()?.namespace || namespace() }}</span>
                <span class="chip">{{ bundle()?.locale || locale() }}</span>
                <span class="chip">{{ bundle()?.source || 'local' }}</span>
                <span class="chip">{{ 'translations.bundle.keys' | t: { count: totalEntryCount() } }}</span>
              </div>
              <div class="footer-actions" panel-actions>
                <app-ui-kit-button
                  [label]="'translations.actions.refresh' | t"
                  tone="secondary"
                  variant="outline"
                  (pressed)="load()"
                ></app-ui-kit-button>
                <app-ui-kit-button
                  [label]="'translations.actions.saveBundle' | t"
                  tone="primary"
                  [disabled]="!canManage() || saving()"
                  (pressed)="save()"
                ></app-ui-kit-button>
              </div>
            </div>
          </app-admin-panel>

          <section class="entries" [attr.aria-label]="'translations.entries.aria' | t">
            @if (shouldAskForSearch()) {
              <app-status-notice tone="info" [title]="'translations.entries.searchFirstTitle' | t">
                {{ 'translations.entries.searchFirstDescription' | t: { count: totalEntryCount() } }}
              </app-status-notice>
            } @else {
              <div class="results-header">
                <p class="results-title">
                  {{ 'translations.entries.results' | t: { visible: rows().length, total: matchingRowCount() } }}
                </p>
                @if (hiddenResultCount() > 0) {
                  <span class="chip">{{
                    'translations.entries.hiddenResults' | t: { count: hiddenResultCount() }
                  }}</span>
                }
              </div>
              @for (row of rows(); track row.key) {
                <article class="entry-row">
                  <div class="entry-meta">
                    <div class="entry-key">{{ row.key }}</div>
                    <p class="helper-text">{{ namespace() }} · {{ locale() }}</p>
                  </div>
                  <textarea
                    [value]="row.value"
                    [readonly]="!canManage()"
                    (input)="setEntry(row.key, $event)"
                    [attr.aria-label]="'translations.entries.textFor' | t: { key: row.key }"
                  ></textarea>
                </article>
              } @empty {
                <app-status-notice tone="neutral">
                  {{ 'translations.entries.noResults' | t }}
                </app-status-notice>
              }
            }
          </section>
        }
      </div>
    </app-page-shell>
  `
})
export class TranslationsPageComponent implements OnDestroy, OnInit {
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly assistant = inject(AiAssistantService);

  readonly namespace = signal('admin');
  readonly locale = signal<'es' | 'en'>('es');
  readonly filter = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly warning = signal('');
  readonly bundle = signal<TextBundleResponse | null>(null);
  readonly entries = signal<Record<string, string>>({});
  readonly namespaces = signal<TranslationNamespaceSummary[]>([
    { key: 'admin', name: 'Admin', source: 'seed', locales: ['es', 'en'] }
  ]);
  readonly newNamespace = signal('');
  readonly newKey = signal('');
  readonly newValueEs = signal('');
  readonly newValueEn = signal('');
  readonly languageToInstall = signal('');
  readonly resultLimit = 120;

  readonly namespaceField = computed<RuntimeField>(() => ({
    name: 'namespace',
    type: 'select',
    label: this.i18n.translate('translations.filters.namespace'),
    options: this.namespaceOptions()
  }));

  readonly localeField = computed<RuntimeField>(() => ({
    name: 'locale',
    type: 'select',
    label: this.i18n.translate('translations.filters.language'),
    options: [
      { label: this.i18n.translate('common.spanish'), value: 'es' },
      { label: this.i18n.translate('common.english'), value: 'en' }
    ]
  }));

  readonly filterField = computed<RuntimeField>(() => ({
    name: 'filter',
    type: 'text',
    label: this.i18n.translate('translations.filters.search'),
    placeholder: this.i18n.translate('translations.filters.searchPlaceholder')
  }));

  readonly customNamespaceField = computed<RuntimeField>(() => ({
    name: 'customNamespace',
    type: 'text',
    label: this.i18n.translate('translations.namespaces.customLabel'),
    placeholder: this.i18n.translate('translations.namespaces.customPlaceholder')
  }));

  readonly newKeyField = computed<RuntimeField>(() => ({
    name: 'newKey',
    type: 'text',
    label: this.i18n.translate('translations.addKey.keyLabel'),
    placeholder: this.i18n.translate('translations.addKey.keyPlaceholder')
  }));

  readonly installLanguageField = computed<RuntimeField>(() => ({
    name: 'installLanguage',
    type: 'text',
    label: this.i18n.translate('translations.languages.installLabel'),
    placeholder: this.i18n.translate('translations.languages.installPlaceholder')
  }));

  readonly newValueEsField = computed<RuntimeField>(() => ({
    name: 'newValueEs',
    type: 'textarea',
    label: this.i18n.translate('translations.addKey.valueEsLabel'),
    placeholder: this.i18n.translate('translations.addKey.valueEsPlaceholder')
  }));

  readonly newValueEnField = computed<RuntimeField>(() => ({
    name: 'newValueEn',
    type: 'textarea',
    label: this.i18n.translate('translations.addKey.valueEnLabel'),
    placeholder: this.i18n.translate('translations.addKey.valueEnPlaceholder')
  }));

  readonly installedLanguages = computed(() => [
    { label: this.i18n.translate('common.spanish'), value: 'es' as const },
    { label: this.i18n.translate('common.english'), value: 'en' as const }
  ]);

  readonly totalEntryCount = computed(() => Object.keys(this.entries()).length);
  readonly normalizedFilter = computed(() => this.filter().trim().toLowerCase());
  readonly shouldAskForSearch = computed(() => this.totalEntryCount() > 80 && this.normalizedFilter().length < 2);

  readonly matchingRows = computed(() => {
    const filter = this.normalizedFilter();
    if (this.shouldAskForSearch()) {
      return [];
    }
    return Object.entries(this.entries())
      .map(([key, value]) => ({ key, value }))
      .filter((row) => !filter || row.key.toLowerCase().includes(filter) || row.value.toLowerCase().includes(filter))
      .sort((a, b) => a.key.localeCompare(b.key));
  });

  readonly matchingRowCount = computed(() => this.matchingRows().length);
  readonly rows = computed(() => this.matchingRows().slice(0, this.resultLimit));
  readonly hiddenResultCount = computed(() => Math.max(this.matchingRowCount() - this.rows().length, 0));
  private appliedAssistantProposalId = 0;
  private readonly unregisterAssistantState = this.assistant.registerScreenStateProvider('translations', () =>
    this.assistantScreenState()
  );
  private readonly assistantProposalEffect = effect(() => {
    const proposal = this.assistant.proposal();
    if (!proposal || proposal.id === this.appliedAssistantProposalId || proposal.scope !== 'translations') {
      return;
    }

    const action = proposal.actions.find(
      (item): item is ApplyTranslationKeyAction => item.type === 'apply_translation_key'
    );
    if (!action) {
      return;
    }

    this.appliedAssistantProposalId = proposal.id;
    void this.applyAssistantTranslationKey(action);
  });

  ngOnInit() {
    this.locale.set(this.i18n.language());
    void this.loadNamespaces();
    void this.load();
  }

  ngOnDestroy() {
    this.unregisterAssistantState();
  }

  canManage() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasPermission('translations.manage');
  }

  setNamespace(value: unknown) {
    this.namespace.set(String(value || 'admin'));
    void this.load();
  }

  setLocale(value: unknown) {
    this.locale.set(value === 'en' ? 'en' : 'es');
    void this.load();
  }

  setFilter(value: unknown) {
    this.filter.set(String(value ?? ''));
  }

  setNewNamespace(value: unknown) {
    this.newNamespace.set(String(value ?? ''));
  }

  setNewKey(value: unknown) {
    this.newKey.set(String(value ?? ''));
  }

  setNewValueEs(value: unknown) {
    this.newValueEs.set(String(value ?? ''));
  }

  setNewValueEn(value: unknown) {
    this.newValueEn.set(String(value ?? ''));
  }

  setLanguageToInstall(value: unknown) {
    this.languageToInstall.set(String(value ?? ''));
  }

  setEntry(key: string, event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.entries.update((entries) => ({ ...entries, [key]: value }));
  }

  async loadNamespaces() {
    try {
      const response = await firstValueFrom(this.api.get<TranslationNamespacesResponse>('translations/namespaces'));
      const namespaces = response.namespaces?.length ? response.namespaces : [];
      this.namespaces.set(this.withCurrentNamespace(namespaces));
    } catch {
      this.namespaces.set(this.withCurrentNamespace([]));
    }
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    this.warning.set('');
    this.message.set('');

    try {
      const bundle = await firstValueFrom(
        this.api.get<TextBundleResponse>(`translations/bundles/${this.namespace()}?locale=${this.locale()}`)
      );
      this.bundle.set(bundle);
      this.entries.set(bundle.entries ?? {});
    } catch {
      this.applyLocalBundleFallback();
      this.warning.set(this.i18n.translate('translations.messages.localFallback'));
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    if (!this.canManage() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.warning.set('');
    this.message.set('');

    try {
      const version = `${this.namespace()}-${this.locale()}-${new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, 14)}`;
      const bundle = await firstValueFrom(
        this.api.put<TextBundleResponse>(`translations/bundles/${this.namespace()}/${this.locale()}`, {
          version,
          name: this.namespaceLabel(this.namespace()),
          description: this.namespaceDescription(this.namespace()),
          entries: this.entries()
        })
      );
      this.bundle.set(bundle);
      this.entries.set(bundle.entries ?? {});
      await this.i18n.refresh(this.namespace(), this.locale());
      await this.loadNamespaces();
      this.message.set(this.i18n.translate('translations.messages.saveSuccess'));
    } catch {
      this.error.set(this.i18n.translate('translations.messages.saveError'));
    } finally {
      this.saving.set(false);
    }
  }

  useCustomNamespace() {
    if (!this.canManage()) {
      return;
    }

    const namespace = this.normalizeNamespace(this.newNamespace());
    if (!namespace) {
      this.error.set(this.i18n.translate('translations.namespaces.invalid'));
      return;
    }

    this.namespace.set(namespace);
    this.namespaces.set(this.withCurrentNamespace(this.namespaces()));
    this.newNamespace.set('');
    void this.load();
  }

  async addKey() {
    if (!this.canManage() || this.saving()) {
      return;
    }

    const key = this.newKey().trim();
    if (!/^[a-zA-Z0-9._:-]{1,220}$/.test(key)) {
      this.error.set(this.i18n.translate('translations.addKey.invalid'));
      return;
    }

    if (Object.prototype.hasOwnProperty.call(this.entries(), key)) {
      this.error.set(this.i18n.translate('translations.addKey.duplicate'));
      return;
    }

    const values = {
      es: this.newValueEs(),
      en: this.newValueEn()
    };
    if (!values.es.trim() && !values.en.trim()) {
      this.error.set(this.i18n.translate('translations.addKey.emptyValues'));
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.warning.set('');
    this.message.set('');

    try {
      const response = await firstValueFrom(
        this.api.post<UpsertTranslationKeyResponse>('translations/keys', {
          namespace: this.namespace(),
          key,
          name: this.namespaceLabel(this.namespace()),
          description: this.namespaceDescription(this.namespace()),
          values
        })
      );
      const currentBundle = response.bundles.find((bundle) => bundle.locale === this.locale());
      if (currentBundle) {
        this.bundle.set(currentBundle);
        this.entries.set(currentBundle.entries ?? {});
      } else {
        await this.load();
      }
      await this.i18n.refresh(this.namespace(), this.locale());
      await this.loadNamespaces();
      this.filter.set(key);
      this.newKey.set('');
      this.newValueEs.set('');
      this.newValueEn.set('');
      this.message.set(this.i18n.translate('translations.addKey.added'));
    } catch {
      this.error.set(this.i18n.translate('translations.addKey.saveError'));
    } finally {
      this.saving.set(false);
    }
  }

  installLanguage() {
    const locale = this.languageToInstall().trim().toLowerCase();
    if (!locale) {
      this.warning.set(this.i18n.translate('translations.languages.empty'));
      return;
    }
    if (locale !== 'es' && locale !== 'en') {
      this.warning.set(this.i18n.translate('translations.languages.unsupported'));
      return;
    }

    this.locale.set(locale);
    this.languageToInstall.set('');
    this.message.set(this.i18n.translate('translations.languages.ready'));
    void this.load();
  }

  private applyLocalBundleFallback() {
    const locale = this.locale();
    const entries =
      this.namespace() === 'admin'
        ? {
            ...I18N_TRANSLATIONS.es,
            ...(I18N_TRANSLATIONS[locale] ?? {})
          }
        : {};
    this.bundle.set({
      namespace: this.namespace(),
      locale,
      version: `local-${this.namespace()}-${locale}`,
      hash: 'local',
      source: 'local',
      entries
    });
    this.entries.set(entries);
  }

  private namespaceOptions() {
    return this.withCurrentNamespace(this.namespaces()).map((namespace) => ({
      label: namespace.key === namespace.name ? namespace.key : `${namespace.name} · ${namespace.key}`,
      value: namespace.key
    }));
  }

  private withCurrentNamespace(namespaces: TranslationNamespaceSummary[]) {
    const map = new Map<string, TranslationNamespaceSummary>();
    for (const namespace of namespaces) {
      map.set(namespace.key, namespace);
    }
    if (!map.has('admin')) {
      map.set('admin', {
        key: 'admin',
        name: 'Admin',
        source: 'seed',
        locales: ['es', 'en']
      });
    }
    const current = this.namespace();
    if (!map.has(current)) {
      map.set(current, {
        key: current,
        name: current,
        source: 'local',
        locales: [this.locale()]
      });
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  private namespaceLabel(namespace: string) {
    return this.namespaces().find((item) => item.key === namespace)?.name ?? namespace;
  }

  private namespaceDescription(namespace: string) {
    return this.namespaces().find((item) => item.key === namespace)?.description ?? null;
  }

  private normalizeNamespace(namespace: string) {
    const value = String(namespace ?? '')
      .trim()
      .toLowerCase();
    return /^[a-z0-9._-]{1,120}$/.test(value) ? value : '';
  }

  private assistantScreenState() {
    return {
      namespace: this.namespace(),
      locale: this.locale(),
      filter: this.filter(),
      totalEntryCount: this.totalEntryCount(),
      visibleKeys: this.rows()
        .map((row) => row.key)
        .slice(0, 20),
      installedLocales: this.installedLanguages().map((language) => language.value)
    };
  }

  private async applyAssistantTranslationKey(action: ApplyTranslationKeyAction) {
    const namespace = this.normalizeNamespace(action.namespace) || 'admin';
    const key = String(action.key ?? '').trim();
    if (!/^[a-zA-Z0-9._:-]{1,220}$/.test(key)) {
      this.error.set(this.i18n.translate('translations.addKey.invalid'));
      return;
    }

    this.namespace.set(namespace);
    this.namespaces.set(this.withCurrentNamespace(this.namespaces()));
    await this.load();
    this.newKey.set(key);
    this.newValueEs.set(String(action.values?.es ?? ''));
    this.newValueEn.set(String(action.values?.en ?? ''));
    this.filter.set(key);
    this.message.set(this.i18n.translate('translations.addKey.assistantApplied'));
  }
}

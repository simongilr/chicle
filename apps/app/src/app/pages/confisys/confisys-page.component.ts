import { Component, OnInit, inject } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { AdminFilterBarComponent } from '../../shared/admin-filter-bar/admin-filter-bar.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';

type ConfisysValueType = 'string' | 'number' | 'boolean' | 'json';

interface ConfisysEntry {
  key: string;
  value: unknown;
  valueType: ConfisysValueType;
  category: string;
  description?: string | null;
  isPublic: boolean;
  editable: boolean;
  source: string;
  updatedAt?: string;
  draftValue?: string;
  saving?: boolean;
  saved?: boolean;
  error?: string;
}

interface ConfisysSaveResponse {
  entry: ConfisysEntry;
  restartRequired: boolean;
}

@Component({
  selector: 'app-confisys-page',
  standalone: true,
  imports: [
    AdminFilterBarComponent,
    DynamicFieldControlComponent,
    LoadingSkeletonComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    UiKitButtonComponent
  ],
  styles: [
    `
      .shell {
        display: grid;
        gap: 18px;
      }

      .param-row {
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        box-shadow: 0 16px 42px color-mix(in srgb, var(--ch-color-text) 6%, transparent);
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        color: var(--ch-color-text);
        font-size: 1.7rem;
        line-height: 1.18;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      p,
      .meta,
      .hint {
        color: var(--ch-color-muted);
        line-height: 1.5;
      }

      .params {
        display: grid;
        gap: 12px;
      }

      .param-row {
        display: grid;
        grid-template-columns: minmax(210px, 0.75fr) minmax(260px, 1fr) 120px;
        gap: 14px;
        padding: 16px;
      }

      .key-block,
      .value-block,
      .action-block {
        display: grid;
        align-content: start;
        gap: 8px;
      }

      .key-name {
        color: var(--ch-color-text);
        font-weight: 850;
        overflow-wrap: anywhere;
      }

      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .badge {
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
        padding: 5px 8px;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .badge.private {
        background: var(--ch-color-surface-muted);
        color: var(--ch-color-primary);
      }

      .state {
        min-height: 20px;
        color: var(--ch-color-success);
        font-size: 0.85rem;
        font-weight: 800;
      }

      .error {
        color: var(--ch-color-danger);
      }

      @media (max-width: 760px) {
        .param-row {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Configuración">
      <div class="shell">
        <app-module-header
          eyebrow="Administración del runtime"
          title="Confisys"
          description="Parámetros cargados en memoria al iniciar la API. Los cambios se guardan en base de datos y aplican después de reiniciar el backend."
          badge="Configuración"
        ></app-module-header>

        <app-admin-filter-bar ariaLabel="Confisys filters" minColumnWidth="220px">
          <app-dynamic-field-control
            [field]="searchField"
            [value]="filter"
            (valueChange)="filter = asString($event)"
          ></app-dynamic-field-control>
          <app-dynamic-field-control
            [field]="categoryField"
            [value]="category"
            (valueChange)="category = asString($event)"
          ></app-dynamic-field-control>
        </app-admin-filter-bar>

        <section class="params">
          @if (loading) {
            <app-loading-skeleton
              variant="list"
              label="Cargando parámetros"
              [rows]="5"
            ></app-loading-skeleton>
          }

          @if (!loading && filteredEntries.length === 0) {
            <article class="param-row">
              <div class="key-block">
                <h2>No hay parámetros para este filtro.</h2>
              </div>
            </article>
          }

          @for (entry of filteredEntries; track entry.key) {
            <article class="param-row">
              <div class="key-block">
                <div class="key-name">{{ entry.key }}</div>
                <div class="badges">
                  <span class="badge">{{ entry.category }}</span>
                  <span class="badge">{{ entry.valueType }}</span>
                  <span class="badge" [class.private]="!entry.isPublic">
                    {{ entry.isPublic ? 'public' : 'private' }}
                  </span>
                  <span class="badge">{{ entry.source }}</span>
                </div>
                <p class="hint">{{ entry.description || 'Sin descripción todavía.' }}</p>
              </div>

              <div class="value-block">
                <app-dynamic-field-control
                  [field]="entryValueField(entry)"
                  [value]="entry.draftValue"
                  [disabled]="!entry.editable"
                  (valueChange)="entry.draftValue = asString($event)"
                ></app-dynamic-field-control>
                <span class="meta">Editable: {{ entry.editable ? 'sí' : 'no' }}</span>
              </div>

              <div class="action-block">
                <app-ui-kit-button
                  label="Guardar"
                  tone="primary"
                  [disabled]="!canUpdate || !entry.editable || !!entry.saving"
                  (pressed)="save(entry)"
                ></app-ui-kit-button>
                <span class="state" [class.error]="entry.error">
                  {{ entry.error || (entry.saved ? 'Guardado. Reinicia API.' : '') }}
                </span>
              </div>
            </article>
          }
        </section>
      </div>
    </app-page-shell>
  `
})
export class ConfisysPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  readonly searchField: RuntimeField = {
    name: 'confisysSearch',
    type: 'search',
    label: 'Buscar',
    placeholder: 'Key, categoría o descripción'
  };

  entries: ConfisysEntry[] = [];
  loading = true;
  filter = '';
  category = '';

  get categories() {
    return Array.from(new Set(this.entries.map((entry) => entry.category))).sort();
  }

  get categoryField(): RuntimeField {
    return {
      name: 'confisysCategory',
      type: 'select',
      label: 'Categoría',
      options: [
        { label: 'Todas las categorías', value: '' },
        ...this.categories.map((item) => ({ label: item, value: item }))
      ]
    };
  }

  get filteredEntries() {
    const search = this.filter.trim().toLowerCase();
    return this.entries.filter((entry) => {
      const matchesCategory = !this.category || entry.category === this.category;
      const haystack = `${entry.key} ${entry.category} ${entry.description ?? ''}`.toLowerCase();
      return matchesCategory && (!search || haystack.includes(search));
    });
  }

  get canUpdate() {
    return this.auth.state.hasPermission('confisys.update');
  }

  entryValueField(entry: ConfisysEntry): RuntimeField {
    if (entry.valueType === 'boolean') {
      return {
        name: `${entry.key}-value`,
        type: 'select',
        label: 'Valor',
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' }
        ]
      };
    }

    return {
      name: `${entry.key}-value`,
      type: 'textarea',
      label: 'Valor',
      placeholder: 'Valor del parámetro',
      config: {
        rows: entry.valueType === 'json' ? 6 : 3
      }
    };
  }

  asString(value: unknown) {
    return value === null || value === undefined ? '' : String(value);
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.get<ConfisysEntry[]>('confisys').subscribe({
      next: (entries) => {
        this.entries = entries.map((entry) => ({
          ...entry,
          draftValue: this.toDraft(entry)
        }));
        this.loading = false;
      },
      error: () => {
        this.entries = [];
        this.loading = false;
      }
    });
  }

  save(entry: ConfisysEntry) {
    if (!this.canUpdate) {
      entry.error = 'No tienes permiso para guardar.';
      return;
    }

    entry.saving = true;
    entry.saved = false;
    entry.error = undefined;

    let parsedValue: unknown;
    try {
      parsedValue = this.fromDraft(entry);
    } catch {
      entry.saving = false;
      entry.error = 'JSON inválido.';
      return;
    }

    this.api
      .put<ConfisysSaveResponse>(`confisys/${encodeURIComponent(entry.key)}`, {
        value: parsedValue,
        valueType: entry.valueType,
        category: entry.category,
        description: entry.description,
        isPublic: entry.isPublic,
        editable: entry.editable
      })
      .subscribe({
        next: (response) => {
          entry.value = response.entry.value;
          entry.draftValue = this.toDraft(response.entry);
          entry.source = response.entry.source;
          entry.updatedAt = response.entry.updatedAt;
          entry.saving = false;
          entry.saved = response.restartRequired;
        },
        error: () => {
          entry.saving = false;
          entry.error = 'No se pudo guardar.';
        }
      });
  }

  private toDraft(entry: ConfisysEntry) {
    if (entry.valueType === 'json') {
      return JSON.stringify(entry.value, null, 2);
    }

    return String(entry.value);
  }

  private fromDraft(entry: ConfisysEntry): unknown {
    if (entry.valueType === 'number') {
      return Number(entry.draftValue);
    }

    if (entry.valueType === 'boolean') {
      return entry.draftValue === 'true';
    }

    if (entry.valueType === 'json') {
      return JSON.parse(entry.draftValue ?? 'null');
    }

    return entry.draftValue ?? '';
  }
}

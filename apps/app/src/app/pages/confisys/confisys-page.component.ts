import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';

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
  imports: [FormsModule, IonContent, MainNavComponent],
  styles: [
    `
      ion-content {
        --background: #f5f7fb;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid #d9e2ec;
        background: #ffffff;
        padding: 14px 24px;
      }

      .brand {
        color: #12324f;
        font-weight: 800;
      }

      .top-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .link,
      button {
        min-height: 38px;
        border: 1px solid #c8d6e4;
        border-radius: 8px;
        background: #ffffff;
        color: #173b5f;
        padding: 8px 12px;
        text-decoration: none;
        font: inherit;
        font-weight: 800;
      }

      button.primary {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .shell {
        display: grid;
        gap: 18px;
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px 0 54px;
      }

      .intro,
      .toolbar,
      .param-row {
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 42px rgba(20, 50, 80, 0.06);
      }

      .intro,
      .toolbar {
        padding: 18px;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        color: #102f4d;
        font-size: 1.7rem;
        line-height: 1.18;
      }

      h2 {
        color: #173b5f;
        font-size: 1rem;
      }

      p,
      .meta,
      .hint {
        color: #526577;
        line-height: 1.5;
      }

      .toolbar {
        display: grid;
        grid-template-columns: minmax(180px, 1fr) minmax(160px, 220px);
        gap: 12px;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
        color: #102f4d;
        padding: 10px 12px;
        font: inherit;
      }

      textarea {
        min-height: 86px;
        resize: vertical;
      }

      input:focus,
      select:focus,
      textarea:focus {
        outline: 3px solid rgba(21, 84, 162, 0.18);
        border-color: #1554a2;
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
        color: #102f4d;
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
        background: #eaf3fc;
        color: #16496f;
        padding: 5px 8px;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .badge.private {
        background: #f1edf8;
        color: #5a367a;
      }

      .state {
        min-height: 20px;
        color: #2e6f48;
        font-size: 0.85rem;
        font-weight: 800;
      }

      .error {
        color: #a33a2b;
      }

      @media (max-width: 760px) {
        .toolbar,
        .param-row {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <ion-content class="ion-padding">
      <app-main-nav contextLabel="Configuración" />

      <main class="shell">
        <section class="intro">
          <h1>Confisys</h1>
          <p>
            Parámetros de sistema cargados en memoria al iniciar la API. Los cambios se guardan en
            base de datos y aplican después de reiniciar el backend.
          </p>
        </section>

        <section class="toolbar">
          <input
            type="search"
            [(ngModel)]="filter"
            placeholder="Buscar por key, categoría o descripción"
            aria-label="Buscar confisys"
          />
          <select [(ngModel)]="category" aria-label="Filtrar categoría">
            <option value="">Todas las categorías</option>
            @for (item of categories; track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select>
        </section>

        <section class="params">
          @if (loading) {
            <article class="param-row">
              <div class="key-block">
                <h2>Cargando parámetros...</h2>
              </div>
            </article>
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
                @if (entry.valueType === 'boolean') {
                  <select [(ngModel)]="entry.draftValue" [disabled]="!entry.editable">
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                } @else {
                  <textarea [(ngModel)]="entry.draftValue" [disabled]="!entry.editable"></textarea>
                }
                <span class="meta">Editable: {{ entry.editable ? 'sí' : 'no' }}</span>
              </div>

              <div class="action-block">
                <button
                  class="primary"
                  type="button"
                  [disabled]="!canUpdate || !entry.editable || entry.saving"
                  (click)="save(entry)"
                >
                  Guardar
                </button>
                <span class="state" [class.error]="entry.error">
                  {{ entry.error || (entry.saved ? 'Guardado. Reinicia API.' : '') }}
                </span>
              </div>
            </article>
          }
        </section>
      </main>
    </ion-content>
  `
})
export class ConfisysPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  entries: ConfisysEntry[] = [];
  loading = true;
  filter = '';
  category = '';

  get categories() {
    return Array.from(new Set(this.entries.map((entry) => entry.category))).sort();
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

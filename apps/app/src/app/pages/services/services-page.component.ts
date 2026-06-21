import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';

type DynamicServiceStatus = 'draft' | 'published' | 'archived';
type ServiceIntent = 'query' | 'get_one' | 'create' | 'update' | 'delete' | 'validate' | 'sync' | 'notify' | 'custom';
type ServiceSource = 'external_api' | 'internal_table' | 'dynamic_record' | 'future_connector';
type ServiceResultKind = 'none' | 'single' | 'list' | 'paginated_list' | 'boolean' | 'file';
type ServiceEffect = 'none' | 'show_response' | 'update_record' | 'update_custom_table' | 'emit_event';
type ServiceQueryMode = 'single_table' | 'multi_table' | 'advanced_read_model';

interface DynamicServiceDefinition {
  intent?: ServiceIntent;
  source?: ServiceSource;
  resultKind?: ServiceResultKind;
  pagination?: {
    enabled: boolean;
    mode?: 'page' | 'offset' | 'cursor';
    pageParam?: string;
    pageSizeParam?: string;
    itemsPath?: string;
    totalPath?: string;
  };
  effects?: Array<{
    type: ServiceEffect;
    target?: string;
    map?: Record<string, string>;
  }>;
  dataTarget?: {
    queryMode: ServiceQueryMode;
    primaryTable?: string;
    involvedTables?: string[];
    recordKey?: string;
    relationNotes?: string;
    filterNotes?: string;
  };
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retry?: {
    attempts?: number;
    backoffMs?: number;
  };
  responseMap?: Record<string, string>;
}

interface DynamicServiceVersion {
  id: string;
  serviceId: string;
  version: number;
  status: DynamicServiceStatus;
  definition: DynamicServiceDefinition;
  publishedAt?: string | null;
  createdAt: string;
}

interface DynamicServiceItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  active: boolean;
  type: 'http_request';
  latestVersion?: DynamicServiceVersion | null;
  publishedVersion?: DynamicServiceVersion | null;
}

interface DynamicServiceRun {
  id: string;
  status: string;
  triggerType: string;
  requestSnapshot?: Record<string, unknown> | null;
  responseSnapshot?: Record<string, unknown> | null;
  error?: string | null;
  durationMs: number;
  timeoutMs?: number | null;
  createdAt: string;
}

interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
  editable: boolean;
}

interface DatabaseTable {
  name: string;
  scope: string;
  source: string;
  columns: DatabaseColumn[];
}

interface DatabaseTablesResponse {
  tables: DatabaseTable[];
}

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [FormsModule, IonContent, JsonPipe, MainNavComponent],
  styles: [
    `
      ion-content {
        --background: #f5f7fb;
      }

      .shell {
        display: grid;
        gap: 18px;
        max-width: 1260px;
        margin: 0 auto;
        padding: 24px 0 54px;
      }

      .intro,
      .panel,
      .designer {
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 42px rgba(20, 50, 80, 0.06);
      }

      .intro,
      .panel {
        padding: 18px;
      }

      .intro {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        color: #12324f;
        font-size: 1.85rem;
      }

      h2 {
        color: #173b5f;
        font-size: 1.15rem;
      }

      h3 {
        color: #173b5f;
        font-size: 1rem;
      }

      .meta,
      .intro p {
        color: #52677a;
        line-height: 1.45;
      }

      .badge {
        border: 1px solid #c7d8e8;
        border-radius: 999px;
        background: #eef6ff;
        color: #173b5f;
        padding: 6px 10px;
        font-size: 0.82rem;
        font-weight: 850;
      }

      .designer {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr);
        min-height: 680px;
        overflow: hidden;
      }

      .services-list {
        display: grid;
        align-content: start;
        gap: 12px;
        overflow: auto;
        border-right: 1px solid #d9e2ec;
        background: #fbfcfe;
        padding: 14px;
      }

      .list-header,
      .section-head,
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .service-button {
        display: grid;
        gap: 6px;
        width: 100%;
        min-height: 78px;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        color: #173b5f;
        padding: 12px;
        text-align: left;
        font: inherit;
        line-height: 1.3;
        cursor: pointer;
      }

      .service-button.active {
        border-color: #b7cce2;
        background: #eaf3fc;
      }

      .service-button strong,
      .service-button span {
        overflow-wrap: anywhere;
      }

      .workspace {
        display: grid;
        gap: 16px;
        align-content: start;
        min-width: 0;
        overflow: auto;
        padding: 16px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .guide-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .field,
      .block,
      .result {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      label {
        color: #173b5f;
        font-weight: 850;
      }

      input,
      select,
      textarea,
      button {
        min-height: 38px;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
        color: #102f4d;
        padding: 8px 10px;
        font: inherit;
      }

      textarea {
        min-height: 150px;
        resize: vertical;
      }

      .code {
        min-height: 270px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
          "Courier New", monospace;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      button {
        color: #173b5f;
        font-weight: 850;
        cursor: pointer;
      }

      button.primary {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .notice {
        display: grid;
        gap: 8px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #f8fbfe;
        color: #254057;
        padding: 14px;
      }

      .notice.error {
        border-color: #f1b4b4;
        background: #fff6f6;
        color: #8b2323;
      }

      .notice.success {
        border-color: #a9ddb7;
        background: #f4fbf6;
        color: #17643a;
      }

      .summary-box {
        display: grid;
        gap: 8px;
        border: 1px solid #b7cce2;
        border-left: 4px solid #1554a2;
        border-radius: 8px;
        background: #f7fbff;
        color: #173b5f;
        padding: 14px;
      }

      select[multiple] {
        min-height: 128px;
      }

      .summary-box strong {
        color: #12324f;
      }

      .run-list {
        display: grid;
        gap: 10px;
      }

      .status-flow {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .status-step {
        display: grid;
        gap: 5px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #f8fbfe;
        color: #254057;
        padding: 10px;
      }

      .status-step.ready {
        border-color: #a9ddb7;
        background: #f4fbf6;
        color: #17643a;
      }

      .status-step strong {
        color: inherit;
      }

      .run-item {
        display: grid;
        gap: 8px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        padding: 12px;
      }

      pre {
        max-height: 320px;
        overflow: auto;
        border-radius: 8px;
        background: #102033;
        color: #e9f1fb;
        padding: 12px;
        font-size: 0.84rem;
        line-height: 1.45;
        white-space: pre-wrap;
      }

      @media (max-width: 940px) {
        .designer,
        .grid,
        .guide-grid {
          grid-template-columns: 1fr;
        }

        .designer {
          min-height: 0;
          overflow: visible;
        }

        .services-list {
          max-height: 340px;
          border-right: 0;
          border-bottom: 1px solid #d9e2ec;
        }
      }
    `
  ],
  template: `
    <ion-content class="ion-padding">
      <app-main-nav contextLabel="Servicios" />

      <main class="shell">
        <section class="intro">
          <div>
            <h1>Servicios dinámicos</h1>
            <p>
              Diseña servicios configurables por organización, publica versiones y prueba respuestas
              desde backend con límites de seguridad.
            </p>
          </div>
          <span class="badge">Tenant services</span>
        </section>

        @if (!canRead) {
          <section class="panel">
            <h2>Acceso restringido</h2>
            <p>Necesitas permiso services.read para ver este módulo.</p>
          </section>
        } @else {
          <section class="designer">
            <aside class="services-list">
              <div class="list-header">
                <h2>Servicios</h2>
                <button type="button" (click)="newService()" [disabled]="!canManage">Nuevo</button>
              </div>

              @if (loading) {
                <p class="meta">Cargando servicios...</p>
              } @else if (error) {
                <div class="notice error">
                  <strong>No se pudieron cargar</strong>
                  <span>{{ error }}</span>
                  <button type="button" (click)="load()">Reintentar</button>
                </div>
              } @else if (!services.length) {
                <div class="notice">
                  <strong>Sin servicios todavía</strong>
                  <span>Crea el primer servicio dinámico de esta organización.</span>
                </div>
              }

              @for (service of services; track service.id) {
                <button
                  class="service-button"
                  type="button"
                  [class.active]="selected?.id === service.id"
                  (click)="select(service)"
                >
                  <strong>{{ service.name }}</strong>
                  <span class="meta">{{ service.key }} · {{ service.active ? 'activo' : 'inactivo' }}</span>
                  <span class="meta">
                    publicada:
                    {{ service.publishedVersion ? 'v' + service.publishedVersion.version : 'sin publicar' }}
                  </span>
                </button>
              }
            </aside>

            <div class="workspace">
              <section class="panel">
                <div class="section-head">
                  <div>
                    <h2>{{ selected ? 'Editar servicio' : 'Crear servicio' }}</h2>
                    <p class="meta">El servicio es el objeto del tenant; la ejecución vive en versiones publicadas.</p>
                  </div>
                  <div class="actions">
                    <button type="button" (click)="load()">Refrescar</button>
                    <button class="primary" type="button" (click)="saveService()" [disabled]="!canManage || saving">
                      Guardar
                    </button>
                  </div>
                </div>

                <div class="grid">
                  <div class="field">
                    <label for="service-key">Key</label>
                    <input id="service-key" [(ngModel)]="draft.key" placeholder="validar_serial" />
                  </div>
                  <div class="field">
                    <label for="service-name">Nombre</label>
                    <input id="service-name" [(ngModel)]="draft.name" placeholder="Validar serial" />
                  </div>
                </div>
                <div class="field">
                  <label for="service-description">Descripción</label>
                  <input id="service-description" [(ngModel)]="draft.description" placeholder="Qué hace este servicio" />
                </div>
                <label class="meta">
                  <input type="checkbox" [(ngModel)]="draft.active" />
                  Servicio activo
                </label>
              </section>

              @if (selected) {
                <section class="panel">
                  <div class="section-head">
                    <div>
                      <h2>Qué hace este servicio</h2>
                      <p class="meta">
                        Define primero la intención. El JSON técnico se actualiza con esta guía para
                        que luego workflows, acciones y eventos sepan cómo usarlo.
                      </p>
                    </div>
                    <button type="button" (click)="syncGuideToDefinition()">Actualizar JSON</button>
                  </div>

                  <div class="guide-grid">
                    <div class="field">
                      <label for="service-intent">Intención</label>
                      <select id="service-intent" [(ngModel)]="guide.intent" (ngModelChange)="syncGuideToDefinition()">
                        <option value="query">Consultar lista</option>
                        <option value="get_one">Consultar uno</option>
                        <option value="create">Crear</option>
                        <option value="update">Editar</option>
                        <option value="delete">Borrar</option>
                        <option value="validate">Validar</option>
                        <option value="sync">Sincronizar</option>
                        <option value="notify">Notificar</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="service-source">Dónde opera</label>
                      <select id="service-source" [(ngModel)]="guide.source" (ngModelChange)="syncGuideToDefinition()">
                        <option value="external_api">API externa</option>
                        <option value="internal_table">Tabla interna</option>
                        <option value="dynamic_record">Records</option>
                        <option value="future_connector">Conector futuro</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="service-result">Qué devuelve</label>
                      <select id="service-result" [(ngModel)]="guide.resultKind" (ngModelChange)="syncGuideToDefinition()">
                        <option value="none">Nada</option>
                        <option value="single">Un registro</option>
                        <option value="list">Lista</option>
                        <option value="paginated_list">Lista paginada</option>
                        <option value="boolean">Sí / no</option>
                        <option value="file">Archivo</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="service-effect">Qué hace con la respuesta</label>
                      <select id="service-effect" [(ngModel)]="guide.effect" (ngModelChange)="syncGuideToDefinition()">
                        <option value="none">Solo guardar historial</option>
                        <option value="show_response">Mostrar respuesta</option>
                        <option value="update_record">Actualizar record</option>
                        <option value="update_custom_table">Actualizar tabla custom</option>
                        <option value="emit_event">Emitir evento</option>
                      </select>
                    </div>
                  </div>

                  @if (guide.resultKind === 'paginated_list') {
                    <div class="grid">
                      <div class="field">
                        <label for="page-param">Parámetro página</label>
                        <input id="page-param" [(ngModel)]="guide.pageParam" (ngModelChange)="syncGuideToDefinition()" />
                      </div>
                      <div class="field">
                        <label for="page-size-param">Parámetro tamaño</label>
                        <input id="page-size-param" [(ngModel)]="guide.pageSizeParam" (ngModelChange)="syncGuideToDefinition()" />
                      </div>
                      <div class="field">
                        <label for="items-path">Ruta items</label>
                        <input id="items-path" [(ngModel)]="guide.itemsPath" (ngModelChange)="syncGuideToDefinition()" />
                      </div>
                      <div class="field">
                        <label for="total-path">Ruta total</label>
                        <input id="total-path" [(ngModel)]="guide.totalPath" (ngModelChange)="syncGuideToDefinition()" />
                      </div>
                    </div>
                  }

                  @if (guide.source === 'internal_table' || guide.source === 'dynamic_record') {
                    <div class="grid">
                      <div class="field">
                        <label for="query-mode">Modo de consulta</label>
                        <select id="query-mode" [(ngModel)]="guide.queryMode" (ngModelChange)="syncGuideToDefinition()">
                          <option value="single_table">Una tabla</option>
                          <option value="multi_table">Varias tablas relacionadas</option>
                          <option value="advanced_read_model">Vista/modelo de lectura futuro</option>
                        </select>
                      </div>
                      <div class="field">
                        <label for="primary-table">Tabla principal</label>
                        <select id="primary-table" [(ngModel)]="guide.primaryTable" (ngModelChange)="syncGuideToDefinition()">
                          <option value="">Selecciona una tabla</option>
                          @for (table of tableOptions; track table.name) {
                            <option [value]="table.name">
                              {{ table.name }} · {{ table.source === 'schema' ? 'custom' : table.scope }}
                            </option>
                          }
                        </select>
                      </div>
                    </div>

                    @if (guide.queryMode !== 'single_table') {
                      <div class="field">
                        <label for="involved-tables">Tablas involucradas</label>
                        <select
                          id="involved-tables"
                          multiple
                          [(ngModel)]="guide.involvedTableList"
                          (ngModelChange)="syncGuideToDefinition()"
                        >
                          @for (table of tableOptions; track table.name) {
                            <option [value]="table.name">
                              {{ table.name }} · {{ table.source === 'schema' ? 'custom' : table.scope }}
                            </option>
                          }
                        </select>
                        <span class="meta">Usa Cmd/Ctrl para seleccionar varias tablas.</span>
                      </div>
                    }

                    <div class="grid">
                      <div class="field">
                        <label for="relation-notes">Cómo se relacionan</label>
                        <input
                          id="relation-notes"
                          [(ngModel)]="guide.relationNotes"
                          (ngModelChange)="syncGuideToDefinition()"
                          placeholder="custom_clients.id = records.data.clientId"
                        />
                      </div>
                      <div class="field">
                        <label for="filter-notes">Filtros esperados</label>
                        <input
                          id="filter-notes"
                          [(ngModel)]="guide.filterNotes"
                          (ngModelChange)="syncGuideToDefinition()"
                          placeholder="tenant actual, estado activo, rango de fechas"
                        />
                      </div>
                    </div>

                    <div class="notice">
                      Las consultas internas complejas se describen como plan seguro. No usamos SQL libre desde la UI.
                    </div>

                    @if (tablesError) {
                      <div class="notice error">{{ tablesError }}</div>
                    }

                    @if (!tablesError && !tableOptions.length) {
                      <div class="notice">
                        <strong>Sin tablas cargadas</strong>
                        <span>Recarga el catálogo para seleccionar tabla principal e involucradas.</span>
                        <button type="button" (click)="loadTables()">Recargar tablas</button>
                      </div>
                    }

                    @if (selectedPrimaryTable) {
                      <div class="notice">
                        <strong>Columnas de {{ selectedPrimaryTable.name }}</strong>
                        <span>{{ columnSummary(selectedPrimaryTable) }}</span>
                      </div>
                    }
                  }

                  @if (guideWarnings.length) {
                    <div class="notice error">
                      <strong>Antes de crear versión</strong>
                      @for (warning of guideWarnings; track warning) {
                        <span>{{ warning }}</span>
                      }
                    </div>
                  }

                  <div class="summary-box">
                    <strong>Resumen</strong>
                    <span>{{ serviceSummary }}</span>
                  </div>
                </section>

                <section class="panel">
                  <div class="section-head">
                    <div>
                      <h2>Definición HTTP</h2>
                      <p class="meta">Crea una versión draft y publícala para habilitar pruebas y ejecuciones.</p>
                    </div>
                    <div class="actions">
                      <button type="button" (click)="loadPublishedDefinition()">Usar publicada</button>
                      <button class="primary" type="button" (click)="createVersion()" [disabled]="!canCreateVersion">
                        Crear versión
                      </button>
                      <button
                        type="button"
                        (click)="publishLatest()"
                        [disabled]="!canManage || !selected.latestVersion || selected.latestVersion.status === 'published' || saving"
                      >
                        Publicar última
                      </button>
                    </div>
                  </div>

                  <textarea class="code" [(ngModel)]="definitionText" spellcheck="false"></textarea>

                  @if (selected.latestVersion) {
                    <p class="meta">
                      Última versión: v{{ selected.latestVersion.version }} · {{ selected.latestVersion.status }}
                    </p>
                  } @else {
                    <p class="meta">Aún no hay versiones. Crea una versión con la definición actual.</p>
                  }
                </section>

                <section class="panel">
                  <div class="section-head">
                    <div>
                      <h2>Prueba en vivo</h2>
                      <p class="meta">El navegador pide al backend ejecutar el servicio. Los secretos no vuelven expuestos.</p>
                    </div>
                    <button class="primary" type="button" (click)="testService()" [disabled]="!canTest">
                      Probar servicio
                    </button>
                  </div>

                  <div class="status-flow">
                    <div class="status-step ready">
                      <strong>1. Servicio</strong>
                      <span>Guardado</span>
                    </div>
                    <div class="status-step" [class.ready]="Boolean(selected.latestVersion)">
                      <strong>2. Versión</strong>
                      <span>{{ selected.latestVersion ? 'v' + selected.latestVersion.version : 'Pendiente' }}</span>
                    </div>
                    <div class="status-step" [class.ready]="Boolean(selected.publishedVersion)">
                      <strong>3. Publicación</strong>
                      <span>{{ selected.publishedVersion ? 'Lista para probar' : 'Publica una versión' }}</span>
                    </div>
                  </div>

                  <div class="grid">
                    <div class="block">
                      <label for="test-context">Contexto de prueba</label>
                      <textarea id="test-context" class="code" [(ngModel)]="contextText" spellcheck="false"></textarea>
                    </div>
                    <div class="block">
                      <label>Última respuesta</label>
                      @if (lastRun) {
                        <pre>{{ lastRun | json }}</pre>
                      } @else if (!selected.publishedVersion) {
                        <div class="notice">
                          Primero crea una versión y publícala. La prueba solo ejecuta versiones publicadas.
                        </div>
                      } @else {
                        <div class="notice">Ejecuta una prueba para ver request, response, duración y errores.</div>
                      }
                    </div>
                  </div>
                </section>

                <section class="panel">
                  <div class="section-head">
                    <div>
                      <h2>Historial</h2>
                      <p class="meta">Últimas ejecuciones registradas para este servicio.</p>
                    </div>
                    <button type="button" (click)="loadRuns()" [disabled]="runsLoading">Actualizar historial</button>
                  </div>

                  <div class="run-list">
                    @for (run of runs; track run.id) {
                      <article class="run-item">
                        <div class="section-head">
                          <strong>{{ run.status }}</strong>
                          <span class="meta">{{ run.durationMs }} ms · {{ run.createdAt }}</span>
                        </div>
                        @if (run.error) {
                          <div class="notice error">{{ run.error }}</div>
                        }
                        <pre>{{ run.responseSnapshot ?? run.requestSnapshot | json }}</pre>
                      </article>
                    } @empty {
                      <div class="notice">Sin ejecuciones todavía.</div>
                    }
                  </div>
                </section>
              }

              @if (message) {
                <div class="notice success">{{ message }}</div>
              }
              @if (formError) {
                <div class="notice error">{{ formError }}</div>
              }
            </div>
          </section>
        }
      </main>
    </ion-content>
  `
})
export class ServicesPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  services: DynamicServiceItem[] = [];
  tableOptions: DatabaseTable[] = [];
  selected?: DynamicServiceItem;
  runs: DynamicServiceRun[] = [];
  lastRun?: DynamicServiceRun;
  loading = false;
  saving = false;
  testing = false;
  runsLoading = false;
  error = '';
  tablesError = '';
  formError = '';
  message = '';

  draft = {
    key: '',
    name: '',
    description: '',
    active: true
  };

  guide = {
    intent: 'validate' as ServiceIntent,
    source: 'external_api' as ServiceSource,
    resultKind: 'boolean' as ServiceResultKind,
    effect: 'show_response' as ServiceEffect,
    queryMode: 'single_table' as ServiceQueryMode,
    primaryTable: '',
    involvedTableList: [] as string[],
    relationNotes: '',
    filterNotes: '',
    pageParam: 'page',
    pageSizeParam: 'pageSize',
    itemsPath: 'response.body.items',
    totalPath: 'response.body.total'
  };

  definitionText = JSON.stringify(
    {
      intent: 'validate',
      source: 'external_api',
      resultKind: 'boolean',
      pagination: {
        enabled: false
      },
      effects: [
        {
          type: 'show_response'
        }
      ],
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: '',
        involvedTables: [],
        relationNotes: '',
        filterNotes: ''
      },
      method: 'POST',
      url: 'https://api.example.com/validar',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer {{input.token}}'
      },
      body: {
        serial: '{{input.serial}}',
        tenant: '{{tenant.slug}}'
      },
      timeoutMs: 8000,
      retry: {
        attempts: 0,
        backoffMs: 0
      },
      responseMap: {}
    },
    null,
    2
  );

  contextText = JSON.stringify(
    {
      serial: 'ABC-123',
      token: 'solo-para-prueba'
    },
    null,
    2
  );

  get canManage() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasAllPermissions(['services.manage']);
  }

  get canExecute() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasAllPermissions(['services.execute']);
  }

  get canTest() {
    return Boolean(this.canExecute && this.selected?.publishedVersion && !this.testing);
  }

  get canRead() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasAllPermissions(['services.read']);
  }

  get selectedPrimaryTable() {
    return this.tableOptions.find((table) => table.name === this.guide.primaryTable);
  }

  get guideWarnings() {
    const warnings: string[] = [];
    if (this.guide.source === 'internal_table' || this.guide.source === 'dynamic_record') {
      if (!this.guide.primaryTable) {
        warnings.push('Selecciona la tabla principal donde opera el servicio.');
      } else if (this.tableOptions.length && !this.selectedPrimaryTable) {
        warnings.push(`La tabla principal "${this.guide.primaryTable}" no existe en el catálogo visible.`);
      }

      if (this.guide.queryMode !== 'single_table' && this.guide.involvedTableList.length === 0) {
        warnings.push('Selecciona al menos una tabla involucrada para consultas de varias tablas.');
      }

      const invalidTables = this.guide.involvedTableList.filter(
        (tableName) => !this.tableOptions.some((table) => table.name === tableName)
      );
      if (invalidTables.length) {
        warnings.push(`Estas tablas involucradas no existen en el catálogo visible: ${invalidTables.join(', ')}.`);
      }
    }

    if (this.guide.resultKind === 'paginated_list') {
      if (!this.guide.pageParam || !this.guide.pageSizeParam) {
        warnings.push('Define los parámetros de página y tamaño para la paginación.');
      }
      if (!this.guide.itemsPath || !this.guide.totalPath) {
        warnings.push('Define las rutas de items y total para interpretar la respuesta paginada.');
      }
    }

    return warnings;
  }

  get canCreateVersion() {
    return this.canManage && !this.saving && this.guideWarnings.length === 0;
  }

  get serviceSummary() {
    const intent = this.intentLabels[this.guide.intent];
    const source = this.sourceLabels[this.guide.source];
    const result = this.resultLabels[this.guide.resultKind];
    const effect = this.effectLabels[this.guide.effect];
    const pagination =
      this.guide.resultKind === 'paginated_list'
        ? ` Usa paginación con ${this.guide.pageParam} y ${this.guide.pageSizeParam}.`
        : '';
    const target = this.targetSummary();
    return `Este servicio sirve para ${intent}, opera sobre ${source}${target}, devuelve ${result} y al terminar ${effect}.${pagination}`;
  }

  private readonly intentLabels: Record<ServiceIntent, string> = {
    query: 'consultar una lista',
    get_one: 'consultar un registro',
    create: 'crear información',
    update: 'editar información',
    delete: 'borrar información',
    validate: 'validar información',
    sync: 'sincronizar información',
    notify: 'enviar una notificación',
    custom: 'ejecutar una operación personalizada'
  };

  private readonly sourceLabels: Record<ServiceSource, string> = {
    external_api: 'una API externa',
    internal_table: 'una tabla interna',
    dynamic_record: 'records del tenant',
    future_connector: 'un conector futuro'
  };

  private readonly resultLabels: Record<ServiceResultKind, string> = {
    none: 'ningún dato',
    single: 'un solo resultado',
    list: 'una lista',
    paginated_list: 'una lista paginada',
    boolean: 'un resultado sí/no',
    file: 'un archivo'
  };

  private readonly effectLabels: Record<ServiceEffect, string> = {
    none: 'solo guarda el historial de ejecución',
    show_response: 'muestra o expone la respuesta para revisión',
    update_record: 'prepara la respuesta para actualizar un record',
    update_custom_table: 'prepara la respuesta para actualizar una tabla custom',
    emit_event: 'prepara la emisión de un evento'
  };

  private readonly queryModeLabels: Record<ServiceQueryMode, string> = {
    single_table: 'una sola tabla',
    multi_table: 'varias tablas relacionadas',
    advanced_read_model: 'un modelo de lectura preparado'
  };

  ngOnInit() {
    if (this.canRead) {
      this.load();
      this.loadTables();
    }
  }

  load() {
    this.loading = true;
    this.error = '';
    this.api.get<DynamicServiceItem[]>('dynamic-services').subscribe({
      next: (services) => {
        this.services = services;
        this.loading = false;
        if (this.selected) {
          const refreshed = services.find((service) => service.id === this.selected?.id);
          refreshed ? this.select(refreshed) : this.newService();
        } else if (services.length) {
          this.select(services[0]);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = this.errorMessage(error);
      }
    });
  }

  newService() {
    this.selected = undefined;
    this.runs = [];
    this.lastRun = undefined;
    this.draft = { key: '', name: '', description: '', active: true };
  }

  select(service: DynamicServiceItem) {
    this.selected = service;
    this.draft = {
      key: service.key,
      name: service.name,
      description: service.description ?? '',
      active: service.active
    };
    this.definitionText = JSON.stringify(
      service.latestVersion?.definition ?? service.publishedVersion?.definition ?? JSON.parse(this.definitionText),
      null,
      2
    );
    this.loadGuideFromDefinition();
    this.formError = '';
    this.message = '';
    this.loadRuns();
  }

  saveService() {
    this.saving = true;
    this.formError = '';
    this.message = '';
    const request = {
      key: this.draft.key,
      name: this.draft.name,
      description: this.draft.description,
      active: this.draft.active
    };
    const call = this.selected
      ? this.api.patch<DynamicServiceItem>(`dynamic-services/${this.selected.id}`, request)
      : this.api.post<DynamicServiceItem>('dynamic-services', request);

    call.subscribe({
      next: (service) => {
        this.saving = false;
        this.message = 'Servicio guardado.';
        this.selected = service;
        this.load();
      },
      error: (error) => {
        this.saving = false;
        this.formError = this.errorMessage(error);
      }
    });
  }

  createVersion() {
    if (!this.selected) {
      return;
    }
    if (this.guideWarnings.length) {
      this.formError = this.guideWarnings.join(' ');
      return;
    }
    const definition = this.parseJson<DynamicServiceDefinition>(this.definitionText);
    if (!definition) {
      return;
    }

    this.saving = true;
    this.formError = '';
    this.api
      .post<DynamicServiceVersion>(`dynamic-services/${this.selected.id}/versions`, { definition })
      .subscribe({
        next: () => {
          this.saving = false;
          this.message = 'Versión draft creada.';
          this.load();
        },
        error: (error) => {
          this.saving = false;
          this.formError = this.errorMessage(error);
        }
      });
  }

  publishLatest() {
    if (!this.selected?.latestVersion) {
      return;
    }
    this.saving = true;
    this.api
      .post<DynamicServiceVersion>(
        `dynamic-services/${this.selected.id}/versions/${this.selected.latestVersion.id}/publish`,
        {}
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.message = 'Versión publicada.';
          this.load();
        },
        error: (error) => {
          this.saving = false;
          this.formError = this.errorMessage(error);
        }
      });
  }

  loadPublishedDefinition() {
    if (this.selected?.publishedVersion) {
      this.definitionText = JSON.stringify(this.selected.publishedVersion.definition, null, 2);
      this.loadGuideFromDefinition();
    }
  }

  testService() {
    if (!this.selected) {
      return;
    }
    if (!this.selected.publishedVersion) {
      this.formError = 'Primero crea una versión y publícala antes de probar el servicio.';
      return;
    }
    const context = this.parseJson<Record<string, unknown>>(this.contextText);
    if (!context) {
      return;
    }

    this.testing = true;
    this.formError = '';
    this.api.post<DynamicServiceRun>(`dynamic-services/${this.selected.id}/test`, { context }).subscribe({
      next: (run) => {
        this.testing = false;
        this.lastRun = run;
        this.message = 'Prueba ejecutada.';
        this.loadRuns();
      },
      error: (error) => {
        this.testing = false;
        this.formError = this.errorMessage(error);
      }
    });
  }

  loadRuns() {
    if (!this.selected) {
      return;
    }
    this.runsLoading = true;
    this.api.get<DynamicServiceRun[]>(`dynamic-services/${this.selected.id}/runs`).subscribe({
      next: (runs) => {
        this.runs = runs;
        this.runsLoading = false;
      },
      error: () => {
        this.runs = [];
        this.runsLoading = false;
      }
    });
  }

  loadTables() {
    this.tablesError = '';
    this.api.get<DatabaseTablesResponse>('dynamic-services/catalog/tables').subscribe({
      next: (response) => {
        this.tableOptions = response.tables;
        this.syncGuideToDefinition();
      },
      error: () => {
        this.tableOptions = [];
        this.tablesError = 'No se pudo cargar el catálogo de tablas del diseñador de servicios.';
      }
    });
  }

  columnSummary(table: DatabaseTable) {
    return table.columns.map((column) => column.name).join(', ');
  }

  private parseJson<T>(value: string): T | null {
    try {
      return JSON.parse(value) as T;
    } catch {
      this.formError = 'El JSON no es válido.';
      return null;
    }
  }

  syncGuideToDefinition() {
    const definition = this.parseDefinitionOrDefault();
    definition.intent = this.guide.intent;
    definition.source = this.guide.source;
    definition.resultKind = this.guide.resultKind;
    definition.pagination = {
      enabled: this.guide.resultKind === 'paginated_list',
      mode: 'page',
      pageParam: this.guide.pageParam || 'page',
      pageSizeParam: this.guide.pageSizeParam || 'pageSize',
      itemsPath: this.guide.itemsPath || 'response.body.items',
      totalPath: this.guide.totalPath || 'response.body.total'
    };
    definition.effects = [
      {
        type: this.guide.effect
      }
    ];
    definition.dataTarget = {
      queryMode: this.guide.queryMode,
      primaryTable: this.guide.primaryTable.trim(),
      involvedTables: this.guide.involvedTableList,
      relationNotes: this.guide.relationNotes.trim(),
      filterNotes: this.guide.filterNotes.trim()
    };

    if (this.guide.intent === 'query' || this.guide.intent === 'get_one') {
      definition.method = 'GET';
      definition.body = null;
    } else if (this.guide.intent === 'delete') {
      definition.method = 'DELETE';
      definition.body = null;
    } else if (this.guide.intent === 'update') {
      definition.method = 'PATCH';
    } else if (definition.method === 'GET' || definition.method === 'DELETE') {
      definition.method = 'POST';
    }

    if (this.guide.resultKind === 'paginated_list') {
      definition.query = {
        ...(definition.query ?? {}),
        [this.guide.pageParam || 'page']: '{{input.page}}',
        [this.guide.pageSizeParam || 'pageSize']: '{{input.pageSize}}'
      };
      definition.responseMap = {
        ...(definition.responseMap ?? {}),
        items: `{{${this.guide.itemsPath || 'response.body.items'}}}`,
        total: `{{${this.guide.totalPath || 'response.body.total'}}}`
      };
    }

    this.definitionText = JSON.stringify(definition, null, 2);
  }

  private loadGuideFromDefinition() {
    const definition = this.parseDefinitionOrDefault();
    const effect = definition.effects?.[0]?.type;
    const dataTarget = definition.dataTarget;
    this.guide = {
      intent: definition.intent ?? this.guide.intent,
      source: definition.source ?? this.guide.source,
      resultKind: definition.resultKind ?? this.guide.resultKind,
      effect: effect ?? this.guide.effect,
      queryMode: dataTarget?.queryMode ?? this.guide.queryMode,
      primaryTable: dataTarget?.primaryTable ?? this.guide.primaryTable,
      involvedTableList: dataTarget?.involvedTables ?? this.guide.involvedTableList,
      relationNotes: dataTarget?.relationNotes ?? this.guide.relationNotes,
      filterNotes: dataTarget?.filterNotes ?? this.guide.filterNotes,
      pageParam: definition.pagination?.pageParam ?? this.guide.pageParam,
      pageSizeParam: definition.pagination?.pageSizeParam ?? this.guide.pageSizeParam,
      itemsPath: definition.pagination?.itemsPath ?? this.guide.itemsPath,
      totalPath: definition.pagination?.totalPath ?? this.guide.totalPath
    };
  }

  private parseDefinitionOrDefault(): DynamicServiceDefinition {
    try {
      return JSON.parse(this.definitionText) as DynamicServiceDefinition;
    } catch {
      return {
        intent: this.guide.intent,
        source: this.guide.source,
        resultKind: this.guide.resultKind,
        pagination: { enabled: false },
        effects: [{ type: this.guide.effect }],
        dataTarget: {
          queryMode: this.guide.queryMode,
          primaryTable: this.guide.primaryTable,
          involvedTables: this.guide.involvedTableList,
          relationNotes: this.guide.relationNotes,
          filterNotes: this.guide.filterNotes
        },
        method: 'POST',
        url: 'https://api.example.com/validar',
        headers: { 'Content-Type': 'application/json' },
        body: {},
        timeoutMs: 8000,
        retry: { attempts: 0, backoffMs: 0 },
        responseMap: {}
      };
    }
  }

  private targetSummary() {
    if (this.guide.source !== 'internal_table' && this.guide.source !== 'dynamic_record') {
      return '';
    }

    const table = this.guide.primaryTable.trim() || 'una tabla pendiente de definir';
    const mode = this.queryModeLabels[this.guide.queryMode];
    const involved = this.guide.involvedTableList;
    const involvedText =
      this.guide.queryMode !== 'single_table' && involved.length
        ? ` e involucra ${involved.join(', ')}`
        : '';
    return ` en ${mode}; tabla principal ${table}${involvedText}`;
  }

  private errorMessage(error: unknown) {
    const response = error as { error?: { message?: string | string[] }; message?: string };
    const message = response.error?.message ?? response.message;
    const text = Array.isArray(message) ? message.join(', ') : message || 'Error inesperado.';
    const translations: Record<string, string> = {
      'Publish a service version before testing it':
        'Primero crea una versión y publícala antes de probar el servicio.',
      'Service is inactive': 'El servicio está inactivo.',
      'Dynamic service not found': 'No se encontró el servicio dinámico.',
      'Definition is required': 'La definición del servicio es obligatoria.',
      'Unsupported HTTP method': 'El método HTTP no está soportado.',
      'URL is required': 'La URL del servicio es obligatoria.',
      'Service URL is invalid': 'La URL del servicio no es válida.',
      'Only HTTP and HTTPS URLs are allowed': 'Solo se permiten URLs HTTP o HTTPS.',
      'Private hosts are blocked for dynamic services':
        'Los hosts privados están bloqueados para servicios dinámicos.',
      'Private network targets are blocked for dynamic services':
        'Las redes privadas están bloqueadas para servicios dinámicos.'
    };
    return translations[text] ?? text;
  }
}

import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { DynamicServiceClientService } from '../../core/services/dynamic-service-client.service';
import { CatalogHeaderComponent } from '../../shared/catalog-header/catalog-header.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { DesignerWorkspaceComponent } from '../../shared/designer-workspace/designer-workspace.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { ProcessStepItem, ProcessStepsComponent } from '../../shared/process-steps/process-steps.component';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { WorkflowGuideComponent } from '../../shared/workflow-guide/workflow-guide.component';

type DynamicServiceStatus = 'draft' | 'published' | 'archived';
type ServiceIntent = 'query' | 'get_one' | 'create' | 'update' | 'delete' | 'validate' | 'sync' | 'notify' | 'custom';
type ServiceSource = 'external_api' | 'internal_table' | 'dynamic_record' | 'future_connector';
type ServiceResultKind = 'none' | 'single' | 'list' | 'paginated_list' | 'boolean' | 'file';
type ServiceEffect = 'none' | 'show_response' | 'update_record' | 'update_custom_table' | 'emit_event';
type ServiceQueryMode = 'single_table' | 'multi_table' | 'advanced_read_model';
type ServiceFilterOperator =
  | 'equals'
  | 'contains'
  | 'starts_with'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal';
type ServiceFilterValueSource = 'input' | 'literal' | 'tenant' | 'current_user';
type ServiceFilterMatchMode = 'all' | 'any';

interface ServiceGuideState {
  stepLabel: string;
  title: string;
  description: string;
  tone: 'info' | 'success' | 'warning';
}

interface NoteOption {
  label: string;
  value: string;
}

interface ServiceFilter {
  field: string;
  operator: ServiceFilterOperator;
  valueSource: ServiceFilterValueSource;
  inputKey?: string;
  value?: string;
  required?: boolean;
}

interface ServiceGuideFilter {
  field: string;
  customField: string;
  operator: ServiceFilterOperator;
  valueSource: ServiceFilterValueSource;
  inputKey: string;
  value: string;
  required: boolean;
}

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
    matchMode?: ServiceFilterMatchMode;
    filters?: ServiceFilter[];
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
  trashedAt?: string | null;
  trashedByUserId?: string | null;
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

const DATABASE_TABLE_CACHE_KEY = 'chicle.databaseTables';
const CUSTOM_NOTE_VALUE = '__custom__';
const FALLBACK_TABLE_OPTIONS: DatabaseTable[] = [
  { name: 'records', scope: 'tenant', source: 'entity', columns: [] },
  { name: 'dynamic_forms', scope: 'tenant', source: 'entity', columns: [] },
  { name: 'dynamic_services', scope: 'tenant', source: 'entity', columns: [] },
  { name: 'users', scope: 'tenant', source: 'entity', columns: [] },
  { name: 'tenants', scope: 'current_tenant', source: 'entity', columns: [] },
  { name: 'menus', scope: 'tenant', source: 'entity', columns: [] },
  { name: 'roles', scope: 'tenant', source: 'entity', columns: [] },
  { name: 'confisys', scope: 'global', source: 'entity', columns: [] }
];

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [
    FormsModule,
    JsonPipe,
    ProcessStepsComponent,
    WorkflowGuideComponent,
    DesignerWorkspaceComponent,
    LoadingSkeletonComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    CatalogHeaderComponent,
    CatalogItemComponent,
    SectionHeaderComponent,
    StatusNoticeComponent
  ],
  styles: [
    `
      .shell {
        display: grid;
        gap: 18px;
      }

      .panel {
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 42px rgba(20, 50, 80, 0.06);
      }

      .panel {
        padding: 18px;
      }

      .panel {
        display: grid;
        gap: 16px;
        align-content: start;
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

      .meta {
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

      .section-head,
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .guide-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 16px;
        align-items: start;
      }

      .table-grid {
        grid-template-columns: minmax(240px, 0.9fr) minmax(300px, 1.1fr);
      }

      .notes-grid {
        grid-template-columns: repeat(2, minmax(260px, 1fr));
      }

      .filter-builder {
        display: grid;
        grid-column: 1 / -1;
        gap: 12px;
      }

      .filter-row {
        display: grid;
        grid-template-columns: minmax(150px, 1fr) minmax(135px, 0.8fr) minmax(155px, 0.9fr) minmax(160px, 1fr) auto;
        gap: 10px;
        align-items: end;
        border: 1px solid #d4e0ec;
        border-radius: 8px;
        background: #f8fbfe;
        padding: 12px;
      }

      .filter-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: flex-end;
      }

      .checkline {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        width: auto;
        color: #435b73;
        font-size: 0.82rem;
        font-weight: 800;
      }

      .checkline input {
        width: auto;
        min-height: auto;
      }

      .field,
      .block,
      .result {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      label,
      .field-label {
        color: #173b5f;
        font-size: 0.9rem;
        font-weight: 850;
        line-height: 1.25;
      }

      input,
      select,
      textarea,
      button {
        box-sizing: border-box;
        width: 100%;
        min-height: 38px;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
        color: #102f4d;
        padding: 8px 10px;
        font: inherit;
      }

      input[type='checkbox'] {
        width: auto;
        min-height: auto;
        padding: 0;
      }

      textarea {
        min-height: 150px;
        resize: vertical;
      }

      .code {
        min-height: 270px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      button {
        color: #173b5f;
        font-weight: 850;
        cursor: pointer;
      }

      .actions button,
      .section-head > button,
      .notice button {
        width: auto;
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
        .grid,
        .guide-grid,
        .table-grid,
        .notes-grid,
        .filter-row {
          grid-template-columns: 1fr;
        }

      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Servicios">
      <div class="shell">
        <app-module-header
          title="Servicios dinámicos"
          description="Diseña servicios configurables por organización, publica versiones y prueba respuestas desde backend con límites de seguridad."
          badge="Tenant services"
        ></app-module-header>

        @if (canRead) {
          <app-process-steps
            [items]="serviceProcessSteps"
            [activeKey]="serviceActiveStep"
            (selected)="goToServiceStep($event)"
          ></app-process-steps>
          <app-workflow-guide
            [stepLabel]="serviceGuide.stepLabel"
            [title]="serviceGuide.title"
            [description]="serviceGuide.description"
            [tone]="serviceGuide.tone"
          ></app-workflow-guide>
        }

        @if (!canRead) {
          <section class="panel">
            <h2>Acceso restringido</h2>
            <p>Necesitas permiso services.read para ver este módulo.</p>
          </section>
        } @else {
          <app-designer-workspace>
            <ng-container designer-navigation>
              <app-catalog-header
                [title]="viewingTrash ? 'Papelera' : 'Servicios'"
                [summary]="services.length + (services.length === 1 ? ' servicio' : ' servicios')"
              >
                <button type="button" (click)="toggleTrash()">{{ viewingTrash ? 'Activos' : 'Papelera' }}</button>
                @if (!viewingTrash) {
                  <button type="button" (click)="newService()" [disabled]="!canManage">Nuevo</button>
                }
              </app-catalog-header>

              @if (loading) {
                <app-loading-skeleton
                  variant="list"
                  label="Cargando servicios"
                  [rows]="4"
                ></app-loading-skeleton>
              } @else if (error) {
                <app-status-notice title="No se pudieron cargar" tone="error">
                  <span>{{ error }}</span>
                  <button notice-action type="button" (click)="load()">Reintentar</button>
                </app-status-notice>
              } @else if (!services.length) {
                <app-status-notice [title]="viewingTrash ? 'Papelera vacía' : 'Sin servicios todavía'">
                  <span>{{
                    viewingTrash
                      ? 'Los servicios enviados a papelera aparecerán aquí.'
                      : 'Crea el primer servicio dinámico de esta organización.'
                  }}</span>
                </app-status-notice>
              }

              @for (service of services; track service.id) {
                <app-catalog-item
                  [title]="service.name"
                  [meta]="
                    service.key + ' · ' + (service.trashedAt ? 'en papelera' : service.active ? 'activo' : 'inactivo')
                  "
                  [detail]="
                    'publicada: ' + (service.publishedVersion ? 'v' + service.publishedVersion.version : 'sin publicar')
                  "
                  [active]="selected?.id === service.id"
                  (selected)="select(service)"
                ></app-catalog-item>
              }
            </ng-container>

            <ng-container designer-workspace>
              <section class="panel" id="service-data">
                <app-section-header
                  [title]="selected ? 'Editar servicio' : 'Crear servicio'"
                  description="Guarda solo los datos base: key, nombre, descripción y estado."
                  stepLabel="Paso 1"
                >
                  <button type="button" (click)="load()">Refrescar</button>
                  @if (selected?.trashedAt) {
                    <button class="primary" type="button" (click)="restoreService()" [disabled]="!canManage || saving">
                      Restaurar
                    </button>
                  } @else {
                    @if (selected) {
                      <button type="button" (click)="trashService()" [disabled]="!canManage || saving">
                        Enviar a papelera
                      </button>
                    }
                    <button
                      class="primary"
                      type="button"
                      (click)="saveService()"
                      [disabled]="!canManage || saving || !serviceMetadataChanged"
                    >
                      Guardar datos
                    </button>
                  }
                </app-section-header>

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
                  <input
                    id="service-description"
                    [(ngModel)]="draft.description"
                    placeholder="Qué hace este servicio"
                  />
                </div>
                <label class="meta">
                  <input type="checkbox" [(ngModel)]="draft.active" [disabled]="!!selected?.trashedAt" />
                  Servicio activo
                </label>
                @if (selected && !serviceMetadataChanged) {
                  <div class="notice">
                    Los datos base no tienen cambios. Si editaste filtros, tablas o respuesta, continúa en Crear
                    versión.
                  </div>
                }
              </section>

              @if (selected) {
                <section class="panel" id="service-design">
                  <app-section-header
                    title="Qué hace este servicio"
                    description="Edita la lógica del servicio. Estos cambios se vuelven ejecutables al crear una versión y publicarla."
                    stepLabel="Paso 2"
                  >
                    <button type="button" (click)="syncGuideToDefinition()">Actualizar JSON</button>
                  </app-section-header>

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
                      <select id="service-source" [(ngModel)]="guide.source" (ngModelChange)="onSourceChange()">
                        <option value="external_api">API externa</option>
                        <option value="internal_table">Tabla interna</option>
                        <option value="dynamic_record">Records</option>
                        <option value="future_connector">Conector futuro</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="service-result">Qué devuelve</label>
                      <select
                        id="service-result"
                        [(ngModel)]="guide.resultKind"
                        (ngModelChange)="syncGuideToDefinition()"
                      >
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
                        <input
                          id="page-param"
                          [(ngModel)]="guide.pageParam"
                          (ngModelChange)="syncGuideToDefinition()"
                        />
                      </div>
                      <div class="field">
                        <label for="page-size-param">Parámetro tamaño</label>
                        <input
                          id="page-size-param"
                          [(ngModel)]="guide.pageSizeParam"
                          (ngModelChange)="syncGuideToDefinition()"
                        />
                      </div>
                      <div class="field">
                        <label for="items-path">Ruta items</label>
                        <input
                          id="items-path"
                          [(ngModel)]="guide.itemsPath"
                          (ngModelChange)="syncGuideToDefinition()"
                        />
                      </div>
                      <div class="field">
                        <label for="total-path">Ruta total</label>
                        <input
                          id="total-path"
                          [(ngModel)]="guide.totalPath"
                          (ngModelChange)="syncGuideToDefinition()"
                        />
                      </div>
                    </div>
                  }

                  @if (guide.source === 'internal_table' || guide.source === 'dynamic_record') {
                    <div class="grid table-grid">
                      <div class="field">
                        <label for="query-mode">Modo de consulta</label>
                        <select id="query-mode" [(ngModel)]="guide.queryMode" (ngModelChange)="onQueryModeChange()">
                          <option value="single_table">Una tabla</option>
                          <option value="multi_table">Varias tablas relacionadas</option>
                          <option value="advanced_read_model">Vista/modelo de lectura futuro</option>
                        </select>
                      </div>
                      <div class="field">
                        <label for="primary-table">Tabla principal</label>
                        <select
                          id="primary-table"
                          [(ngModel)]="guide.primaryTable"
                          (ngModelChange)="onPrimaryTableChange()"
                        >
                          <option value="">Selecciona una tabla</option>
                          @for (table of tableSelectOptions; track table.name) {
                            <option [value]="table.name">
                              {{ table.name }} · {{ table.source === 'schema' ? 'custom' : table.scope }}
                            </option>
                          }
                        </select>
                        @if (tablesLoading) {
                          <span class="meta">Cargando catálogo de tablas...</span>
                        }
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
                          @for (table of tableSelectOptions; track table.name) {
                            <option [value]="table.name">
                              {{ table.name }} · {{ table.source === 'schema' ? 'custom' : table.scope }}
                            </option>
                          }
                        </select>
                        <span class="meta">Usa Cmd/Ctrl para seleccionar varias tablas.</span>
                      </div>
                    }

                    @if (guide.queryMode === 'single_table') {
                      <div class="grid notes-grid">
                        <div class="field">
                          <label for="filter-match-mode">Cómo combinar filtros</label>
                          <select
                            id="filter-match-mode"
                            [(ngModel)]="guide.matchMode"
                            (ngModelChange)="syncGuideToDefinition()"
                          >
                            <option value="all">Todos deben coincidir</option>
                            <option value="any">Cualquiera puede coincidir</option>
                          </select>
                        </div>
                        <div class="field">
                          <div class="field-label">Filtros configurados</div>
                          <button type="button" (click)="addGuideFilter()">Agregar filtro</button>
                        </div>
                        <div class="filter-builder">
                          @for (filter of guide.filters; track $index; let index = $index) {
                            <div class="filter-row">
                              <div class="field">
                                <label [for]="'filter-field-' + index">Campo</label>
                                <select
                                  [id]="'filter-field-' + index"
                                  [(ngModel)]="filter.field"
                                  (ngModelChange)="onGuideFilterFieldChange(filter)"
                                >
                                  <option value="">Selecciona un campo</option>
                                  @for (column of filterColumnOptions; track column.name) {
                                    <option [value]="column.name">{{ column.name }} · {{ column.type }}</option>
                                  }
                                  <option [value]="customNoteValue">Otro campo</option>
                                </select>
                                @if (filter.field === customNoteValue) {
                                  <input
                                    [(ngModel)]="filter.customField"
                                    (ngModelChange)="syncGuideToDefinition()"
                                    placeholder="nombre_del_campo"
                                  />
                                }
                              </div>
                              <div class="field">
                                <label [for]="'filter-operator-' + index">Comparación</label>
                                <select
                                  [id]="'filter-operator-' + index"
                                  [(ngModel)]="filter.operator"
                                  (ngModelChange)="syncGuideToDefinition()"
                                >
                                  <option value="equals">Igual a</option>
                                  <option value="contains">Contiene</option>
                                  <option value="starts_with">Empieza por</option>
                                  <option value="greater_than">Mayor que</option>
                                  <option value="greater_or_equal">Mayor o igual</option>
                                  <option value="less_than">Menor que</option>
                                  <option value="less_or_equal">Menor o igual</option>
                                </select>
                              </div>
                              <div class="field">
                                <label [for]="'filter-source-' + index">Valor</label>
                                <select
                                  [id]="'filter-source-' + index"
                                  [(ngModel)]="filter.valueSource"
                                  (ngModelChange)="syncGuideToDefinition()"
                                >
                                  <option value="input">Viene del formulario/API</option>
                                  <option value="literal">Valor fijo</option>
                                  <option value="tenant">Tenant actual</option>
                                  <option value="current_user">Usuario actual</option>
                                </select>
                              </div>
                              <div class="field">
                                @if (filter.valueSource === 'literal') {
                                  <label [for]="'filter-literal-' + index">Valor fijo</label>
                                  <input
                                    [id]="'filter-literal-' + index"
                                    [(ngModel)]="filter.value"
                                    (ngModelChange)="syncGuideToDefinition()"
                                    placeholder="activo"
                                  />
                                } @else if (filter.valueSource === 'input') {
                                  <label [for]="'filter-input-key-' + index">Nombre del input</label>
                                  <input
                                    [id]="'filter-input-key-' + index"
                                    [(ngModel)]="filter.inputKey"
                                    (ngModelChange)="syncGuideToDefinition()"
                                    placeholder="name"
                                  />
                                } @else {
                                  <div class="field-label">Origen</div>
                                  <div class="notice">
                                    {{
                                      filter.valueSource === 'tenant'
                                        ? 'Usa el tenant actual.'
                                        : 'Usa el usuario autenticado.'
                                    }}
                                  </div>
                                }
                              </div>
                              <div class="filter-actions">
                                <label class="checkline">
                                  <input
                                    type="checkbox"
                                    [(ngModel)]="filter.required"
                                    (ngModelChange)="syncGuideToDefinition()"
                                  />
                                  Obligatorio
                                </label>
                                <button
                                  type="button"
                                  (click)="removeGuideFilter(index)"
                                  [disabled]="guide.filters.length === 1"
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    } @else {
                      <div class="grid notes-grid">
                        <div class="field">
                          <label for="relation-notes">Cómo se relacionan</label>
                          <select
                            id="relation-notes"
                            [(ngModel)]="guide.relationPreset"
                            (ngModelChange)="onRelationPresetChange($event)"
                          >
                            @for (option of relationPresetOptions; track option.value) {
                              <option [value]="option.value">{{ option.label }}</option>
                            }
                            <option [value]="customNoteValue">Otro</option>
                          </select>
                          @if (guide.relationPreset === customNoteValue) {
                            <input
                              [(ngModel)]="guide.relationNotes"
                              (ngModelChange)="syncGuideToDefinition()"
                              placeholder="custom_clients.id = records.data.clientId"
                            />
                          }
                        </div>
                        <div class="field">
                          <label for="filter-notes">Filtros esperados</label>
                          <select
                            id="filter-notes"
                            [(ngModel)]="guide.filterPreset"
                            (ngModelChange)="onFilterPresetChange($event)"
                          >
                            @for (option of filterPresetOptions; track option.value) {
                              <option [value]="option.value">{{ option.label }}</option>
                            }
                            <option [value]="customNoteValue">Otro</option>
                          </select>
                          @if (guide.filterPreset === customNoteValue) {
                            <input
                              [(ngModel)]="guide.filterNotes"
                              (ngModelChange)="syncGuideToDefinition()"
                              placeholder="tenant actual, estado activo, rango de fechas"
                            />
                          }
                        </div>
                      </div>
                    }

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
                  @if (definitionChanged) {
                    <div class="notice success">
                      Cambiaste la lógica del servicio. El siguiente paso es Crear versión y luego Publicar última.
                    </div>
                  }
                </section>

                <section class="panel" id="service-version">
                  <app-section-header
                    title="Versión ejecutable"
                    description="Guarda la lógica como versión y publícala para que el front, workflows y acciones la usen."
                    stepLabel="Pasos 3 y 4"
                  >
                    <button type="button" (click)="loadPublishedDefinition()">Usar publicada</button>
                    <button class="primary" type="button" (click)="createVersion()" [disabled]="!canCreateVersion">
                      {{ selected.latestVersion ? 'Crear nueva versión' : 'Crear versión' }}
                    </button>
                    <button
                      type="button"
                      (click)="publishLatest()"
                      [disabled]="
                        !canEditSelected ||
                        !selected.latestVersion ||
                        selected.latestVersion.status === 'published' ||
                        saving
                      "
                    >
                      Publicar última
                    </button>
                  </app-section-header>

                  <textarea class="code" [(ngModel)]="definitionText" spellcheck="false"></textarea>

                  @if (selected.latestVersion) {
                    <p class="meta">
                      Última versión: v{{ selected.latestVersion.version }} · {{ selected.latestVersion.status }}
                    </p>
                  } @else {
                    <p class="meta">Aún no hay versiones. Crea una versión con la definición actual.</p>
                  }
                  @if (selected.latestVersion?.status !== 'published') {
                    <div class="notice">
                      Hay una versión draft pendiente. Publícala para que sea la definición activa del servicio.
                    </div>
                  }
                </section>

                <section class="panel" id="service-test">
                  <app-section-header
                    title="Prueba en vivo"
                    description="El navegador pide al backend ejecutar el servicio. Los secretos no vuelven expuestos."
                    stepLabel="Verificación"
                  >
                    <button class="primary" type="button" (click)="testService()" [disabled]="!canTest">
                      Probar servicio
                    </button>
                  </app-section-header>

                  <app-process-steps
                    [items]="serviceReadinessSteps"
                    activeKey="publication"
                    [compact]="true"
                    [interactive]="false"
                    ariaLabel="Preparación de la prueba"
                  ></app-process-steps>

                  <div class="grid">
                    <div class="block">
                      <label for="test-context">JSON de consumo/prueba</label>
                      <textarea id="test-context" class="code" [(ngModel)]="contextText" spellcheck="false"></textarea>
                    </div>
                    <div class="block">
                      <div class="field-label">Última respuesta</div>
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

                <section class="panel" id="service-history">
                  <app-section-header
                    title="Historial"
                    description="Últimas ejecuciones registradas para este servicio."
                    stepLabel="Observabilidad"
                  >
                    <button type="button" (click)="loadRuns()" [disabled]="runsLoading">Actualizar historial</button>
                  </app-section-header>

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
                <app-status-notice tone="success">{{ message }}</app-status-notice>
              }
              @if (formError) {
                <app-status-notice tone="error">{{ formError }}</app-status-notice>
              }
            </ng-container>
          </app-designer-workspace>
        }
      </div>
    </app-page-shell>
  `
})
export class ServicesPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly serviceClient = inject(DynamicServiceClientService);
  readonly auth = inject(AuthService);

  services: DynamicServiceItem[] = [];
  tableOptions: DatabaseTable[] = [...FALLBACK_TABLE_OPTIONS];
  selected?: DynamicServiceItem;
  runs: DynamicServiceRun[] = [];
  lastRun?: DynamicServiceRun;
  loading = false;
  saving = false;
  testing = false;
  runsLoading = false;
  tablesLoading = false;
  tablesRequested = false;
  error = '';
  tablesError = '';
  tablesStatus = 'Catálogo pendiente de cargar.';
  formError = '';
  message = '';
  viewingTrash = false;
  private savedDraftSnapshot = '';
  readonly customNoteValue = CUSTOM_NOTE_VALUE;
  readonly relationPresetOptions: NoteOption[] = [
    { label: 'Selecciona relación', value: '' },
    { label: 'Tenant actual por tenantId', value: 'tenantId = tenant.id' },
    { label: 'ID principal desde input', value: 'id = input.id' },
    { label: 'Record a cliente custom', value: 'records.data.clientId = custom_clients.id' },
    { label: 'Record a usuario', value: 'records.data.userId = users.id' },
    { label: 'Usuario creador', value: 'createdByUserId = users.id' }
  ];
  readonly filterPresetOptions: NoteOption[] = [
    { label: 'Selecciona filtros', value: '' },
    { label: 'Tenant actual', value: 'tenant actual' },
    { label: 'Solo activos', value: 'estado activo' },
    { label: 'Tenant actual + activos', value: 'tenant actual, estado activo' },
    { label: 'Rango de fechas', value: 'rango de fechas' },
    { label: 'Búsqueda por texto', value: 'búsqueda por texto' },
    { label: 'Tenant + fechas', value: 'tenant actual, rango de fechas' }
  ];
  readonly filterOperatorLabels: Record<ServiceFilterOperator, string> = {
    equals: 'igual a',
    contains: 'contiene',
    starts_with: 'empieza por',
    greater_than: 'mayor que',
    greater_or_equal: 'mayor o igual que',
    less_than: 'menor que',
    less_or_equal: 'menor o igual que'
  };
  readonly filterSourceLabels: Record<ServiceFilterValueSource, string> = {
    input: 'input',
    literal: 'valor fijo',
    tenant: 'tenant actual',
    current_user: 'usuario actual'
  };

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
    matchMode: 'all' as ServiceFilterMatchMode,
    filters: [] as ServiceGuideFilter[],
    relationPreset: '',
    relationNotes: '',
    filterPreset: '',
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
        filterNotes: '',
        filters: []
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
    return Boolean(this.canExecute && this.selected?.publishedVersion && !this.selected?.trashedAt && !this.testing);
  }

  get canRead() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasAllPermissions(['services.read']);
  }

  get canEditSelected() {
    return this.canManage && !this.selected?.trashedAt;
  }

  get serviceActiveStep() {
    if (!this.selected || this.serviceMetadataChanged) {
      return 'data';
    }
    if (this.guideWarnings.length) {
      return 'design';
    }
    if (!this.selected.latestVersion) {
      return 'version';
    }
    if (!this.selected.publishedVersion) {
      return 'publication';
    }
    return 'test';
  }

  get serviceProcessSteps(): ProcessStepItem[] {
    const selected = this.selected;
    return [
      {
        key: 'data',
        label: 'Datos',
        summary: selected && !this.serviceMetadataChanged ? 'Guardados' : 'Nombre y estado',
        state: this.serviceActiveStep === 'data' ? 'active' : selected ? 'complete' : 'pending'
      },
      {
        key: 'design',
        label: 'Diseñar',
        summary: this.guideWarnings.length ? `${this.guideWarnings.length} puntos pendientes` : 'Lógica guiada',
        state:
          this.serviceActiveStep === 'design'
            ? 'active'
            : selected && !this.guideWarnings.length
              ? 'complete'
              : 'pending',
        disabled: !selected
      },
      {
        key: 'version',
        label: 'Versionar',
        summary: selected?.latestVersion ? `v${selected.latestVersion.version}` : 'Crear snapshot',
        state: this.serviceActiveStep === 'version' ? 'active' : selected?.latestVersion ? 'complete' : 'pending',
        disabled: !selected
      },
      {
        key: 'publication',
        label: 'Publicar',
        summary: selected?.publishedVersion ? `v${selected.publishedVersion.version} activa` : 'Habilitar consumo',
        state:
          this.serviceActiveStep === 'publication' ? 'active' : selected?.publishedVersion ? 'complete' : 'pending',
        disabled: !selected
      },
      {
        key: 'test',
        label: 'Probar',
        summary: this.lastRun ? `Última: ${this.lastRun.status}` : 'Ejecutar y revisar',
        state: this.serviceActiveStep === 'test' ? 'active' : this.lastRun ? 'complete' : 'pending',
        disabled: !selected?.publishedVersion
      }
    ];
  }

  get serviceReadinessSteps(): ProcessStepItem[] {
    return [
      {
        key: 'service',
        label: 'Servicio',
        summary: this.selected ? 'Guardado' : 'Pendiente',
        state: this.selected ? 'complete' : 'active'
      },
      {
        key: 'version',
        label: 'Versión',
        summary: this.selected?.latestVersion ? `v${this.selected.latestVersion.version}` : 'Pendiente',
        state: this.selected?.latestVersion ? 'complete' : 'pending'
      },
      {
        key: 'publication',
        label: 'Publicación',
        summary: this.selected?.publishedVersion ? 'Lista para probar' : 'Publica una versión',
        state: this.selected?.publishedVersion ? 'complete' : 'active'
      }
    ];
  }

  get serviceGuide(): ServiceGuideState {
    switch (this.serviceActiveStep) {
      case 'data':
        return {
          stepLabel: 'Paso 1 de 5',
          title: this.selected ? 'Guarda los cambios básicos del servicio' : 'Crea el servicio para comenzar',
          description:
            'Aquí solo defines su identidad. La operación, filtros y respuesta se configuran en el siguiente paso.',
          tone: 'info'
        };
      case 'design':
        return {
          stepLabel: 'Paso 2 de 5',
          title: 'Describe la operación con opciones guiadas',
          description: this.guideWarnings[0] ?? 'Define qué hace, dónde opera y qué devuelve sin escribir código.',
          tone: this.guideWarnings.length ? 'warning' : 'success'
        };
      case 'version':
        return {
          stepLabel: 'Paso 3 de 5',
          title: 'Crea una versión ejecutable',
          description:
            'La versión congela la lógica actual. Puedes seguir editando el servicio sin alterar lo que ya está publicado.',
          tone: 'info'
        };
      case 'publication':
        return {
          stepLabel: 'Paso 4 de 5',
          title: 'Publica la versión que debe consumir el sistema',
          description: 'Solo una versión publicada puede ser llamada desde pantallas, flows o integraciones.',
          tone: 'info'
        };
      case 'test':
        return {
          stepLabel: 'Paso 5 de 5',
          title: this.lastRun ? 'Revisa la respuesta observada' : 'Ejecuta el servicio con datos de ejemplo',
          description:
            'La prueba pasa por el backend real y registra request, response, duración y error sin exponer secretos.',
          tone: this.lastRun?.status === 'success' ? 'success' : 'info'
        };
    }
  }

  get serviceMetadataChanged() {
    if (!this.selected) {
      return Boolean(this.draft.key.trim() || this.draft.name.trim() || this.draft.description.trim());
    }
    return this.savedDraftSnapshot !== this.draftSnapshot();
  }

  goToServiceStep(stepKey: string) {
    const targetByStep: Record<string, string> = {
      data: 'service-data',
      design: 'service-design',
      version: 'service-version',
      publication: 'service-version',
      test: 'service-test'
    };
    const target = document.getElementById(targetByStep[stepKey] ?? '');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  get definitionChanged() {
    if (!this.selected) {
      return false;
    }
    const current = this.definitionSnapshot(this.definitionText);
    const saved = this.selected.latestVersion?.definition ?? this.selected.publishedVersion?.definition;
    if (!saved) {
      return Boolean(current);
    }
    return current !== JSON.stringify(saved);
  }

  get tableSelectOptions() {
    return this.tableOptions.length ? this.tableOptions : FALLBACK_TABLE_OPTIONS;
  }

  get selectedPrimaryTable() {
    return this.tableSelectOptions.find((table) => table.name === this.guide.primaryTable);
  }

  get filterColumnOptions() {
    return (this.selectedPrimaryTable?.columns ?? []).filter(
      (column) => !/password|token|secret|hash/i.test(column.name)
    );
  }

  get selectedGuideFilters() {
    return this.guide.filters
      .map((filter) => this.toServiceFilter(filter))
      .filter((filter): filter is ServiceFilter => Boolean(filter));
  }

  get guideWarnings() {
    const warnings: string[] = [];
    if (this.guide.source === 'internal_table' || this.guide.source === 'dynamic_record') {
      if (!this.guide.primaryTable) {
        warnings.push('Selecciona la tabla principal donde opera el servicio.');
      } else if (this.tableSelectOptions.length && !this.selectedPrimaryTable) {
        warnings.push(`La tabla principal "${this.guide.primaryTable}" no existe en el catálogo visible.`);
      }

      if (this.guide.queryMode !== 'single_table' && this.guide.involvedTableList.length === 0) {
        warnings.push('Selecciona al menos una tabla involucrada para consultas de varias tablas.');
      }

      if (this.guide.queryMode === 'single_table') {
        if (!this.guide.filters.length) {
          warnings.push('Agrega al menos un filtro para controlar la consulta.');
        } else if (!this.selectedGuideFilters.length) {
          warnings.push('Cada filtro debe tener un campo de la tabla.');
        }
      }

      const invalidTables = this.guide.involvedTableList.filter(
        (tableName) => !this.tableSelectOptions.some((table) => table.name === tableName)
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
    return this.canEditSelected && !this.saving && this.guideWarnings.length === 0;
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
    this.applyCachedTableCatalog();
    this.loadTables();
    if (this.canRead) {
      this.load();
    }
  }

  load() {
    this.loading = true;
    this.error = '';
    const endpoint = this.viewingTrash ? 'dynamic-services/trash' : 'dynamic-services';
    this.api.get<DynamicServiceItem[]>(endpoint).subscribe({
      next: (services) => {
        this.services = services;
        this.loading = false;
        if (this.selected) {
          const refreshed = services.find((service) => service.id === this.selected?.id);
          if (refreshed) {
            this.select(refreshed);
          } else {
            this.newService();
          }
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
    this.viewingTrash = false;
    this.selected = undefined;
    this.runs = [];
    this.lastRun = undefined;
    this.draft = { key: '', name: '', description: '', active: true };
    this.savedDraftSnapshot = this.draftSnapshot();
  }

  select(service: DynamicServiceItem) {
    this.selected = service;
    this.draft = {
      key: service.key,
      name: service.name,
      description: service.description ?? '',
      active: service.active
    };
    this.savedDraftSnapshot = this.draftSnapshot();
    this.definitionText = JSON.stringify(
      service.latestVersion?.definition ?? service.publishedVersion?.definition ?? JSON.parse(this.definitionText),
      null,
      2
    );
    this.loadGuideFromDefinition();
    this.ensureTableCatalog();
    this.ensurePrimaryTable();
    this.syncGuideToDefinition();
    this.formError = '';
    this.message = '';
    if (service.trashedAt) {
      this.runs = [];
      this.lastRun = undefined;
    } else {
      this.loadRuns();
    }
  }

  saveService() {
    if (this.selected?.trashedAt) {
      this.formError = 'Restaura el servicio antes de editarlo.';
      return;
    }

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
        this.draft = {
          key: service.key,
          name: service.name,
          description: service.description ?? '',
          active: service.active
        };
        this.savedDraftSnapshot = this.draftSnapshot();
        const existingIndex = this.services.findIndex((item) => item.id === service.id);
        if (existingIndex >= 0) {
          this.services = this.services.map((item) => (item.id === service.id ? service : item));
        } else {
          this.services = [service, ...this.services];
        }
      },
      error: (error) => {
        this.saving = false;
        this.formError = this.errorMessage(error);
      }
    });
  }

  toggleTrash() {
    this.viewingTrash = !this.viewingTrash;
    this.selected = undefined;
    this.runs = [];
    this.lastRun = undefined;
    this.load();
  }

  trashService() {
    if (!this.selected) {
      return;
    }

    this.saving = true;
    this.formError = '';
    this.api.post<DynamicServiceItem>(`dynamic-services/${this.selected.id}/trash`, {}).subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Servicio enviado a papelera.';
        this.selected = undefined;
        this.runs = [];
        this.lastRun = undefined;
        this.load();
      },
      error: (error) => {
        this.saving = false;
        this.formError = this.errorMessage(error);
      }
    });
  }

  restoreService() {
    if (!this.selected) {
      return;
    }

    this.saving = true;
    this.formError = '';
    this.api.post<DynamicServiceItem>(`dynamic-services/${this.selected.id}/restore`, {}).subscribe({
      next: (service) => {
        this.saving = false;
        this.viewingTrash = false;
        this.message = 'Servicio restaurado.';
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
    this.api.post<DynamicServiceVersion>(`dynamic-services/${this.selected.id}/versions`, { definition }).subscribe({
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
    this.serviceClient.executeRaw(this.selected.key, context).subscribe({
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
    this.tablesRequested = true;
    this.tablesLoading = true;
    this.tablesError = '';
    this.tablesStatus = 'Consultando catálogo de base de datos...';
    this.api.get<DatabaseTablesResponse>('database/tables').subscribe({
      next: (response) => {
        this.applyTableCatalog(response.tables ?? [], 'base de datos');
      },
      error: (error) => {
        if (!this.tableOptions.length) {
          this.tableOptions = [...FALLBACK_TABLE_OPTIONS];
        }
        this.tablesLoading = false;
        this.tablesRequested = false;
        this.tablesStatus = 'Usando tablas base mientras no responde el catálogo.';
        this.tablesError = `No se pudo cargar el catálogo vivo desde Base de Datos. ${this.errorMessage(error)}`;
        this.ensurePrimaryTable();
        this.syncGuideToDefinition();
      }
    });
  }

  private applyTableCatalog(tables: DatabaseTable[], source: string) {
    const safeTables = tables.length ? tables : FALLBACK_TABLE_OPTIONS;
    this.tableOptions = this.sortTableOptions(safeTables);
    sessionStorage.setItem(DATABASE_TABLE_CACHE_KEY, JSON.stringify(this.tableOptions));
    this.tablesLoading = false;
    this.tablesStatus = this.tableOptions.length
      ? `${this.tableOptions.length} tablas cargadas desde ${source}.`
      : `El catálogo de ${source} respondió sin tablas visibles.`;
    this.ensurePrimaryTable();
    this.syncGuideToDefinition();
  }

  private applyCachedTableCatalog() {
    const raw = sessionStorage.getItem(DATABASE_TABLE_CACHE_KEY);
    if (!raw) {
      this.tableOptions = this.sortTableOptions(FALLBACK_TABLE_OPTIONS);
      this.ensurePrimaryTable();
      return;
    }

    try {
      const tables = JSON.parse(raw) as DatabaseTable[];
      this.tableOptions = this.sortTableOptions(tables.length ? tables : FALLBACK_TABLE_OPTIONS);
      this.tablesStatus = `${this.tableOptions.length} tablas cargadas desde cache local.`;
      this.ensurePrimaryTable();
    } catch {
      sessionStorage.removeItem(DATABASE_TABLE_CACHE_KEY);
      this.tableOptions = this.sortTableOptions(FALLBACK_TABLE_OPTIONS);
      this.ensurePrimaryTable();
    }
  }

  private sortTableOptions(tables: DatabaseTable[]) {
    const priority = ['records', 'dynamic_forms', 'dynamic_services', 'users', 'tenants'];
    return [...tables].sort((a, b) => {
      const aPriority = priority.indexOf(a.name);
      const bPriority = priority.indexOf(b.name);
      if (aPriority !== -1 || bPriority !== -1) {
        return (aPriority === -1 ? priority.length : aPriority) - (bPriority === -1 ? priority.length : bPriority);
      }
      return a.name.localeCompare(b.name);
    });
  }

  private ensurePrimaryTable() {
    if (this.guide.source !== 'internal_table' && this.guide.source !== 'dynamic_record') {
      return;
    }

    if (this.guide.primaryTable) {
      this.ensureFilterField();
      return;
    }

    if (!this.tableSelectOptions.length) {
      return;
    }

    const preferred = this.tableSelectOptions.find((table) => table.name === 'records') ?? this.tableSelectOptions[0];
    this.guide.primaryTable = preferred.name;
    this.ensureFilterField();
  }

  columnSummary(table: DatabaseTable) {
    return table.columns.length
      ? table.columns.map((column) => column.name).join(', ')
      : 'Columnas pendientes de cargar.';
  }

  private draftSnapshot() {
    return JSON.stringify({
      key: this.draft.key.trim(),
      name: this.draft.name.trim(),
      description: this.draft.description.trim(),
      active: Boolean(this.draft.active)
    });
  }

  private definitionSnapshot(value: string) {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return value.trim();
    }
  }

  addGuideFilter() {
    const used = new Set(this.guide.filters.map((filter) => this.guideFilterField(filter)).filter(Boolean));
    const preferred =
      this.filterColumnOptions.find(
        (column) => !used.has(column.name) && ['email', 'name', 'key', 'slug', 'id'].includes(column.name)
      ) ??
      this.filterColumnOptions.find((column) => !used.has(column.name)) ??
      this.filterColumnOptions[0];
    this.guide.filters = [...this.guide.filters, this.createGuideFilter(preferred?.name ?? '')];
    this.syncGuideToDefinition();
  }

  removeGuideFilter(index: number) {
    if (this.guide.filters.length === 1) {
      return;
    }
    this.guide.filters = this.guide.filters.filter((_filter, filterIndex) => filterIndex !== index);
    this.syncGuideToDefinition();
  }

  onGuideFilterFieldChange(filter: ServiceGuideFilter) {
    const field = this.guideFilterField(filter);
    if (field && (!filter.inputKey || filter.inputKey === filter.customField || filter.inputKey === 'name')) {
      filter.inputKey = field;
    }
    this.syncGuideToDefinition();
  }

  private createGuideFilter(field: string): ServiceGuideFilter {
    return {
      field,
      customField: '',
      operator: field === 'name' ? 'contains' : 'equals',
      valueSource: 'input',
      inputKey: field || 'value',
      value: '',
      required: true
    };
  }

  private guideFilterField(filter: ServiceGuideFilter) {
    return filter.field === CUSTOM_NOTE_VALUE ? filter.customField.trim() : filter.field;
  }

  private ensureFilterField(force = false) {
    if (this.guide.queryMode !== 'single_table' || !this.filterColumnOptions.length) {
      return;
    }

    const currentIsValid = this.guide.filters.some(
      (filter) =>
        filter.field === CUSTOM_NOTE_VALUE || this.filterColumnOptions.some((column) => column.name === filter.field)
    );
    if (!force && currentIsValid) {
      return;
    }

    const preferredNames = ['name', 'email', 'key', 'slug', 'id'];
    const preferred =
      preferredNames.map((name) => this.filterColumnOptions.find((column) => column.name === name)).find(Boolean) ??
      this.filterColumnOptions[0];
    this.guide.filters = [this.createGuideFilter(preferred.name)];
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
    const filters = this.selectedGuideFilters;
    definition.dataTarget = {
      queryMode: this.guide.queryMode,
      primaryTable: this.guide.primaryTable.trim(),
      involvedTables: this.guide.involvedTableList,
      relationNotes: this.guide.queryMode === 'single_table' ? '' : this.guide.relationNotes.trim(),
      filterNotes: this.guide.queryMode === 'single_table' ? this.filterSummary() : this.guide.filterNotes.trim(),
      matchMode: this.guide.matchMode,
      filters
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
    this.syncContextProposal(definition);
  }

  onSourceChange() {
    this.ensureTableCatalog();
    this.ensurePrimaryTable();
    this.ensureFilterField();
    this.syncGuideToDefinition();
  }

  onQueryModeChange() {
    if (this.guide.queryMode === 'single_table') {
      this.guide.involvedTableList = [];
      this.guide.relationPreset = '';
      this.guide.relationNotes = '';
    }

    this.syncGuideToDefinition();
  }

  onPrimaryTableChange() {
    this.ensureFilterField(true);
    this.syncGuideToDefinition();
  }

  onRelationPresetChange(value: string) {
    if (value !== CUSTOM_NOTE_VALUE) {
      this.guide.relationNotes = value;
    } else if (this.matchesPreset(this.guide.relationNotes, this.relationPresetOptions)) {
      this.guide.relationNotes = '';
    }

    this.syncGuideToDefinition();
  }

  onFilterPresetChange(value: string) {
    if (value !== CUSTOM_NOTE_VALUE) {
      this.guide.filterNotes = value;
    } else if (this.matchesPreset(this.guide.filterNotes, this.filterPresetOptions)) {
      this.guide.filterNotes = '';
    }

    this.syncGuideToDefinition();
  }

  ensureTableCatalog() {
    if (
      (this.guide.source === 'internal_table' || this.guide.source === 'dynamic_record') &&
      !this.tableOptions.length &&
      !this.tablesLoading &&
      !this.tablesRequested
    ) {
      this.loadTables();
    }
  }

  private loadGuideFromDefinition() {
    const definition = this.parseDefinitionOrDefault();
    const effect = definition.effects?.[0]?.type;
    const dataTarget = definition.dataTarget;
    const relationNotes = dataTarget?.relationNotes ?? this.guide.relationNotes;
    const filterNotes = dataTarget?.filterNotes ?? this.guide.filterNotes;
    const filters = dataTarget?.filters?.length
      ? dataTarget.filters.map((filter) => this.fromServiceFilter(filter))
      : this.guide.filters.length
        ? this.guide.filters
        : [this.createGuideFilter('')];
    this.guide = {
      intent: definition.intent ?? this.guide.intent,
      source: definition.source ?? this.guide.source,
      resultKind: definition.resultKind ?? this.guide.resultKind,
      effect: effect ?? this.guide.effect,
      queryMode: dataTarget?.queryMode ?? this.guide.queryMode,
      primaryTable: dataTarget?.primaryTable ?? this.guide.primaryTable,
      involvedTableList: dataTarget?.involvedTables ?? this.guide.involvedTableList,
      matchMode: dataTarget?.matchMode ?? this.guide.matchMode,
      filters,
      relationPreset: this.presetValueFor(relationNotes, this.relationPresetOptions),
      relationNotes,
      filterPreset: this.presetValueFor(filterNotes, this.filterPresetOptions),
      filterNotes,
      pageParam: definition.pagination?.pageParam ?? this.guide.pageParam,
      pageSizeParam: definition.pagination?.pageSizeParam ?? this.guide.pageSizeParam,
      itemsPath: definition.pagination?.itemsPath ?? this.guide.itemsPath,
      totalPath: definition.pagination?.totalPath ?? this.guide.totalPath
    };
  }

  private presetValueFor(value: string, options: NoteOption[]) {
    if (!value) {
      return '';
    }

    return this.matchesPreset(value, options) ? value : CUSTOM_NOTE_VALUE;
  }

  private matchesPreset(value: string, options: NoteOption[]) {
    return options.some((option) => option.value === value);
  }

  private toServiceFilter(filter: ServiceGuideFilter) {
    const field = this.guideFilterField(filter);
    if (this.guide.queryMode !== 'single_table' || !field) {
      return null;
    }

    const serviceFilter: ServiceFilter = {
      field,
      operator: filter.operator,
      valueSource: filter.valueSource,
      required: filter.required
    };

    if (filter.valueSource === 'input') {
      serviceFilter.inputKey = filter.inputKey.trim() || field;
    } else if (filter.valueSource === 'literal') {
      serviceFilter.value = filter.value.trim();
    }

    return serviceFilter;
  }

  private fromServiceFilter(filter: ServiceFilter): ServiceGuideFilter {
    return {
      field: filter.field,
      customField: '',
      operator: filter.operator,
      valueSource: filter.valueSource,
      inputKey: filter.inputKey ?? filter.field,
      value: filter.value ?? '',
      required: filter.required ?? true
    };
  }

  private filterSummary() {
    const filters = this.selectedGuideFilters;
    if (!filters.length) {
      return '';
    }

    const joiner = this.guide.matchMode === 'any' ? ' o ' : ' y ';
    return filters.map((filter) => this.filterLabel(filter)).join(joiner);
  }

  private filterLabel(filter: ServiceFilter) {
    const value =
      filter.valueSource === 'input'
        ? `input.${filter.inputKey ?? filter.field}`
        : filter.valueSource === 'literal'
          ? `"${filter.value ?? ''}"`
          : this.filterSourceLabels[filter.valueSource];
    const optional = filter.required === false ? ' opcional' : '';
    return `${filter.field} ${this.filterOperatorLabels[filter.operator]} ${value}${optional}`;
  }

  private syncContextProposal(definition: DynamicServiceDefinition) {
    const current = this.readCurrentContext();
    const proposal: Record<string, unknown> = {};

    if (definition.source === 'internal_table') {
      for (const filter of definition.dataTarget?.filters ?? []) {
        if (filter.valueSource === 'input') {
          const key = filter.inputKey || filter.field;
          proposal[key] = current[key] ?? this.exampleForField(filter.field);
        }
      }
    } else {
      this.collectInputTemplateKeys(definition.headers, proposal, current);
      this.collectInputTemplateKeys(definition.query, proposal, current);
      this.collectInputTemplateKeys(definition.body, proposal, current);
    }

    if (definition.resultKind === 'paginated_list') {
      proposal['page'] = current['page'] ?? 1;
      proposal['pageSize'] = current['pageSize'] ?? 20;
    }

    if (Object.keys(proposal).length) {
      this.contextText = JSON.stringify(proposal, null, 2);
    }
  }

  private readCurrentContext() {
    try {
      const parsed = JSON.parse(this.contextText) as Record<string, unknown>;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  private collectInputTemplateKeys(
    value: unknown,
    proposal: Record<string, unknown>,
    current: Record<string, unknown>
  ) {
    if (typeof value === 'string') {
      const matches = value.matchAll(/\{\{\s*input\.([a-zA-Z0-9_]+)\s*\}\}/g);
      for (const match of matches) {
        const key = match[1];
        proposal[key] = current[key] ?? this.exampleForField(key);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => this.collectInputTemplateKeys(item, proposal, current));
      return;
    }

    if (value && typeof value === 'object') {
      Object.values(value as Record<string, unknown>).forEach((item) =>
        this.collectInputTemplateKeys(item, proposal, current)
      );
    }
  }

  private exampleForField(field: string) {
    const normalized = field.toLowerCase();
    if (normalized.includes('email')) {
      return 'admin@example.com';
    }
    if (normalized.includes('name')) {
      return 'simon';
    }
    if (normalized.includes('serial')) {
      return 'ABC-123';
    }
    if (normalized.includes('token')) {
      return 'solo-para-prueba';
    }
    if (normalized.includes('id')) {
      return 'id-de-prueba';
    }
    return 'valor-de-prueba';
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
          filterNotes: this.guide.filterNotes,
          matchMode: this.guide.matchMode,
          filters: this.selectedGuideFilters
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
      this.guide.queryMode !== 'single_table' && involved.length ? ` e involucra ${involved.join(', ')}` : '';
    const filterSummary = this.filterSummary();
    const filterText = this.guide.queryMode === 'single_table' && filterSummary ? `; filtros ${filterSummary}` : '';
    return ` en ${mode}; tabla principal ${table}${involvedText}${filterText}`;
  }

  private errorMessage(error: unknown) {
    const response = error as { error?: { message?: string | string[] }; message?: string };
    const message = response.error?.message ?? response.message;
    const text = Array.isArray(message) ? message.join(', ') : message || 'Error inesperado.';
    const translations: Record<string, string> = {
      'Publish a service version before testing it':
        'Primero crea una versión y publícala antes de probar el servicio.',
      'Publish a service version before executing it':
        'Primero crea una versión y publícala antes de ejecutar el servicio.',
      'At least one filter value is required': 'Envía al menos un valor de filtro para ejecutar la consulta.',
      'Service is inactive': 'El servicio está inactivo.',
      'Dynamic service not found': 'No se encontró el servicio dinámico.',
      'Definition is required': 'La definición del servicio es obligatoria.',
      'Unsupported HTTP method': 'El método HTTP no está soportado.',
      'URL is required': 'La URL del servicio es obligatoria.',
      'Service URL is invalid': 'La URL del servicio no es válida.',
      'Only HTTP and HTTPS URLs are allowed': 'Solo se permiten URLs HTTP o HTTPS.',
      'Private hosts are blocked for dynamic services': 'Los hosts privados están bloqueados para servicios dinámicos.',
      'Private network targets are blocked for dynamic services':
        'Las redes privadas están bloqueadas para servicios dinámicos.'
    };
    return translations[text] ?? text;
  }
}

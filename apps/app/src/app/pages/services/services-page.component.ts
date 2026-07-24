import { JsonPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { DynamicServiceClientService } from '../../core/services/dynamic-service-client.service';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import {
  AssignmentChecklistComponent,
  AssignmentChecklistOption
} from '../../shared/assignment-checklist/assignment-checklist.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { CodeTextareaComponent } from '../../shared/code-textarea/code-textarea.component';
import { DesignerCatalogPanelComponent } from '../../shared/designer-catalog-panel/designer-catalog-panel.component';
import { DesignerWorkspaceComponent } from '../../shared/designer-workspace/designer-workspace.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { JsonAuthoringPanelComponent } from '../../shared/json-authoring-panel/json-authoring-panel.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { ProcessStepItem, ProcessStepsComponent } from '../../shared/process-steps/process-steps.component';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { WorkflowGuideComponent } from '../../shared/workflow-guide/workflow-guide.component';
import {
  AiAssistantService,
  ApplyDynamicServiceJsonAction
} from '../../shared/ai-assistant-launcher/ai-assistant.service';

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
type ServicePublicSecurityMode = 'private' | 'none' | 'api_key' | 'bearer_token';
type ServicePublicInputMode = 'body_or_query' | 'body' | 'query';
type ServicePublicResponseMode = 'mapped_or_result' | 'result_only' | 'full_snapshot';

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
    primaryAlias?: string;
    involvedTables?: string[];
    joins?: Array<{
      type?: 'inner' | 'left';
      table: string;
      alias: string;
      on: Array<{
        left: string;
        operator?: 'equals';
        right: string;
      }>;
    }>;
    select?: Array<{
      field: string;
      alias?: string;
    }>;
    limit?: number;
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
  exposure?: {
    enabled: boolean;
    allowedMethods?: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
    inputMode?: ServicePublicInputMode;
    responseMode?: ServicePublicResponseMode;
    security?: {
      mode: ServicePublicSecurityMode;
      headerName?: string;
      apiKey?: string;
      token?: string;
      secretHash?: string;
      secretSalt?: string;
      algorithm?: 'scrypt-sha256';
    };
  };
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

interface DynamicServiceAuthoringResponse {
  artifactType: 'dynamic_service';
  id: string;
  key: string;
  service: DynamicServiceItem;
  version: DynamicServiceVersion;
  published: boolean;
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
  { name: 'user_roles', scope: 'tenant', source: 'entity', columns: [] },
  { name: 'confisys', scope: 'global', source: 'entity', columns: [] }
];

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [
    FormsModule,
    JsonPipe,
    AssignmentChecklistComponent,
    CodeTextareaComponent,
    ProcessStepsComponent,
    WorkflowGuideComponent,
    DesignerWorkspaceComponent,
    DynamicFieldControlComponent,
    JsonAuthoringPanelComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    CatalogItemComponent,
    DesignerCatalogPanelComponent,
    SectionHeaderComponent,
    StatusNoticeComponent,
    UiKitButtonComponent
  ],
  styles: [
    `
      .shell {
        display: grid;
        gap: 18px;
      }

      .panel {
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        box-shadow: 0 16px 42px color-mix(in srgb, var(--ch-color-text) 6%, transparent);
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
        color: var(--ch-color-text);
        font-size: 1.85rem;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.15rem;
      }

      h3 {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      .meta {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .badge {
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
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
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
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
        color: var(--ch-color-muted);
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
        color: var(--ch-color-text);
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
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
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
        color: var(--ch-color-text);
        font-weight: 850;
        cursor: pointer;
      }

      .actions button,
      .section-head > button,
      .notice button {
        width: auto;
      }

      button.primary {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .notice {
        display: grid;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 14px;
      }

      .notice.error {
        border-color: var(--ch-color-danger-border);
        background: var(--ch-color-surface)6f6;
        color: var(--ch-color-danger);
      }

      .notice.success {
        border-color: var(--ch-color-success-border);
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
      }

      .summary-box {
        display: grid;
        gap: 8px;
        border: 1px solid var(--ch-color-primary-border);
        border-left: 4px solid var(--ch-color-primary);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 14px;
      }

      select[multiple] {
        min-height: 128px;
      }

      .summary-box strong {
        color: var(--ch-color-text);
      }

      .public-exposure-box {
        display: grid;
        gap: 14px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 14px;
      }

      .public-exposure-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .public-exposure-head > div {
        display: grid;
        gap: 4px;
        max-width: 640px;
      }

      .public-exposure-head span,
      .field .meta {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .endpoint-box {
        display: grid;
        gap: 6px;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 8px;
        background: var(--ch-color-primary-soft);
        padding: 10px 12px;
      }

      .endpoint-box span {
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .endpoint-box code {
        display: block;
        overflow: auto;
        color: var(--ch-color-text);
        white-space: nowrap;
      }

      .run-list {
        display: grid;
        gap: 10px;
      }

      .run-item {
        display: grid;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
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
              <app-designer-catalog-panel
                [title]="viewingTrash ? 'Papelera' : 'Servicios'"
                [summary]="services.length + (services.length === 1 ? ' servicio' : ' servicios')"
                [loading]="loading"
                loadingLabel="Cargando servicios"
                [loadingRows]="4"
                [error]="error"
                [empty]="!services.length"
                [emptyTitle]="viewingTrash ? 'Papelera vacía' : 'Sin servicios todavía'"
                [emptyMessage]="
                  viewingTrash
                    ? 'Los servicios enviados a papelera aparecerán aquí.'
                    : 'Crea el primer servicio dinámico de esta organización.'
                "
                (retry)="load()"
              >
                <app-ui-kit-button
                  catalog-actions
                  [label]="viewingTrash ? 'Activos' : 'Papelera'"
                  tone="secondary"
                  variant="outline"
                  (pressed)="toggleTrash()"
                ></app-ui-kit-button>
                @if (!viewingTrash) {
                  <app-ui-kit-button
                    catalog-actions
                    label="Nuevo"
                    tone="primary"
                    [disabled]="!canManage"
                    (pressed)="newService()"
                  ></app-ui-kit-button>
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
              </app-designer-catalog-panel>
            </ng-container>

            <ng-container designer-workspace>
              <section class="panel" id="service-data">
                <app-section-header
                  [title]="selected ? 'Editar servicio' : 'Crear servicio'"
                  description="Guarda solo los datos base: key, nombre, descripción y estado."
                  stepLabel="Paso 1"
                >
                  <app-ui-kit-button
                    label="Refrescar"
                    tone="secondary"
                    variant="outline"
                    (pressed)="load()"
                  ></app-ui-kit-button>
                  @if (selected?.trashedAt) {
                    <app-ui-kit-button
                      label="Restaurar"
                      tone="primary"
                      [disabled]="!canManage || saving"
                      (pressed)="restoreService()"
                    ></app-ui-kit-button>
                  } @else {
                    @if (selected) {
                      <app-ui-kit-button
                        label="Enviar a papelera"
                        tone="secondary"
                        variant="outline"
                        [disabled]="!canManage || saving"
                        (pressed)="trashService()"
                      ></app-ui-kit-button>
                    }
                    <app-ui-kit-button
                      label="Guardar datos"
                      tone="primary"
                      [disabled]="!canManage || saving || !serviceMetadataChanged"
                      (pressed)="saveService()"
                    ></app-ui-kit-button>
                  }
                </app-section-header>

                <div class="grid">
                  <app-dynamic-field-control
                    [field]="runtimeField('serviceKey', 'text', 'Key', 'validar_serial')"
                    [value]="draft.key"
                    (valueChange)="draft.key = asString($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('serviceName', 'text', 'Nombre', 'Validar serial')"
                    [value]="draft.name"
                    (valueChange)="draft.name = asString($event)"
                  ></app-dynamic-field-control>
                </div>
                <app-dynamic-field-control
                  [field]="runtimeField('serviceDescription', 'text', 'Descripción', 'Qué hace este servicio')"
                  [value]="draft.description"
                  (valueChange)="draft.description = asString($event)"
                ></app-dynamic-field-control>
                <app-dynamic-field-control
                  [field]="runtimeField('serviceActive', 'checkbox', 'Servicio activo', 'Servicio activo')"
                  [value]="draft.active"
                  [disabled]="!!selected?.trashedAt"
                  (valueChange)="draft.active = asBoolean($event)"
                ></app-dynamic-field-control>
                @if (selected && !serviceMetadataChanged) {
                  <div class="notice">
                    Los datos base no tienen cambios. Si editaste filtros, tablas o respuesta, continúa en Crear
                    versión.
                  </div>
                }
              </section>

              @if (hasServiceDraft) {
                <section class="panel" id="service-design">
                  <app-section-header
                    title="Qué hace este servicio"
                    description="Edita la lógica del servicio. Estos cambios se vuelven ejecutables al crear una versión y publicarla."
                    stepLabel="Paso 2"
                  >
                    <app-ui-kit-button
                      label="Actualizar JSON"
                      tone="secondary"
                      variant="outline"
                      (pressed)="syncGuideToDefinition()"
                    ></app-ui-kit-button>
                  </app-section-header>

                  <div class="guide-grid">
                    <app-dynamic-field-control
                      [field]="runtimeField('serviceIntent', 'select', 'Intención', '', serviceIntentOptions)"
                      [value]="guide.intent"
                      (valueChange)="setGuideValue('intent', $event)"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('serviceSource', 'select', 'Dónde opera', '', serviceSourceOptions)"
                      [value]="guide.source"
                      (valueChange)="setGuideSource($event)"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('serviceResult', 'select', 'Qué devuelve', '', serviceResultOptions)"
                      [value]="guide.resultKind"
                      (valueChange)="setGuideValue('resultKind', $event)"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('serviceEffect', 'select', 'Qué hace con la respuesta', '', serviceEffectOptions)"
                      [value]="guide.effect"
                      (valueChange)="setGuideValue('effect', $event)"
                    ></app-dynamic-field-control>
                  </div>

                  @if (guide.resultKind === 'paginated_list') {
                    <div class="grid">
                      <app-dynamic-field-control
                        [field]="runtimeField('pageParam', 'text', 'Parámetro página', 'page')"
                        [value]="guide.pageParam"
                        (valueChange)="setGuideValue('pageParam', asString($event))"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('pageSizeParam', 'text', 'Parámetro tamaño', 'pageSize')"
                        [value]="guide.pageSizeParam"
                        (valueChange)="setGuideValue('pageSizeParam', asString($event))"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('itemsPath', 'text', 'Ruta items', 'response.body.items')"
                        [value]="guide.itemsPath"
                        (valueChange)="setGuideValue('itemsPath', asString($event))"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('totalPath', 'text', 'Ruta total', 'response.body.total')"
                        [value]="guide.totalPath"
                        (valueChange)="setGuideValue('totalPath', asString($event))"
                      ></app-dynamic-field-control>
                    </div>
                  }

                  @if (guide.source === 'internal_table' || guide.source === 'dynamic_record') {
                    <div class="grid table-grid">
                      <app-dynamic-field-control
                        [field]="runtimeField('queryMode', 'select', 'Modo de consulta', '', serviceQueryModeOptions)"
                        [value]="guide.queryMode"
                        (valueChange)="setGuideQueryMode($event)"
                      ></app-dynamic-field-control>
                      <div>
                        <app-dynamic-field-control
                          [field]="tableField('primaryTable', 'Tabla principal')"
                          [value]="guide.primaryTable"
                          (valueChange)="setGuidePrimaryTable($event)"
                        ></app-dynamic-field-control>
                        @if (tablesLoading) {
                          <span class="meta">Cargando catálogo de tablas...</span>
                        }
                      </div>
                    </div>

                    @if (guide.queryMode !== 'single_table') {
                      <div>
                        <div class="field-label">Tablas involucradas</div>
                        <app-assignment-checklist
                          [options]="involvedTableOptionsForChecklist()"
                          emptyText="No hay tablas relacionadas disponibles."
                          (optionToggle)="toggleInvolvedTable($event)"
                        ></app-assignment-checklist>
                      </div>
                    }

                    @if (guide.queryMode === 'single_table') {
                      <div class="grid notes-grid">
                        <app-dynamic-field-control
                          [field]="runtimeField('filterMatchMode', 'select', 'Cómo combinar filtros', '', serviceMatchModeOptions)"
                          [value]="guide.matchMode"
                          (valueChange)="setGuideValue('matchMode', $event)"
                        ></app-dynamic-field-control>
                        <div class="field">
                          <div class="field-label">Filtros configurados</div>
                          <app-ui-kit-button
                            label="Agregar filtro"
                            tone="secondary"
                            variant="outline"
                            (pressed)="addGuideFilter()"
                          ></app-ui-kit-button>
                        </div>
                        <div class="filter-builder">
                          @for (filter of guide.filters; track $index; let index = $index) {
                            <div class="filter-row">
                              <div>
                                <app-dynamic-field-control
                                  [field]="filterFieldOptionField(index)"
                                  [value]="filter.field"
                                  (valueChange)="filter.field = asString($event); onGuideFilterFieldChange(filter)"
                                ></app-dynamic-field-control>
                                @if (filter.field === customNoteValue) {
                                  <app-dynamic-field-control
                                    [field]="runtimeField('filterCustomField' + index, 'text', 'Campo custom', 'nombre_del_campo')"
                                    [value]="filter.customField"
                                    (valueChange)="setFilterValue(filter, 'customField', asString($event))"
                                  ></app-dynamic-field-control>
                                }
                              </div>
                              <app-dynamic-field-control
                                [field]="runtimeField('filterOperator' + index, 'select', 'Comparación', '', serviceFilterOperatorOptions)"
                                [value]="filter.operator"
                                (valueChange)="setFilterValue(filter, 'operator', asString($event))"
                              ></app-dynamic-field-control>
                              <app-dynamic-field-control
                                [field]="runtimeField('filterSource' + index, 'select', 'Valor', '', serviceFilterSourceOptions)"
                                [value]="filter.valueSource"
                                (valueChange)="setFilterValue(filter, 'valueSource', asString($event))"
                              ></app-dynamic-field-control>
                              <div class="field">
                                @if (filter.valueSource === 'literal') {
                                  <app-dynamic-field-control
                                    [field]="runtimeField('filterLiteral' + index, 'text', 'Valor fijo', 'activo')"
                                    [value]="filter.value"
                                    (valueChange)="setFilterValue(filter, 'value', asString($event))"
                                  ></app-dynamic-field-control>
                                } @else if (filter.valueSource === 'input') {
                                  <app-dynamic-field-control
                                    [field]="runtimeField('filterInputKey' + index, 'text', 'Nombre del input', 'name')"
                                    [value]="filter.inputKey"
                                    (valueChange)="setFilterValue(filter, 'inputKey', asString($event))"
                                  ></app-dynamic-field-control>
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
                                <app-dynamic-field-control
                                  [field]="runtimeField('filterRequired' + index, 'checkbox', 'Obligatorio', 'Obligatorio')"
                                  [value]="filter.required"
                                  (valueChange)="setFilterValue(filter, 'required', asBoolean($event))"
                                ></app-dynamic-field-control>
                                <app-ui-kit-button
                                  label="Quitar"
                                  tone="danger"
                                  variant="outline"
                                  [disabled]="guide.filters.length === 1"
                                  (pressed)="removeGuideFilter(index)"
                                ></app-ui-kit-button>
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    } @else {
                      <div class="grid notes-grid">
                        <div>
                          <app-dynamic-field-control
                            [field]="notePresetField('relationNotesPreset', 'Cómo se relacionan', availableRelationPresetOptions)"
                            [value]="guide.relationPreset"
                            (valueChange)="onRelationPresetChange(asString($event))"
                          ></app-dynamic-field-control>
                          @if (guide.relationPreset === customNoteValue) {
                            <app-dynamic-field-control
                              [field]="runtimeField('relationNotesCustom', 'text', 'Relación custom', 'custom_clients.id = records.data.clientId')"
                              [value]="guide.relationNotes"
                              (valueChange)="setGuideValue('relationNotes', asString($event))"
                            ></app-dynamic-field-control>
                          }
                        </div>
                        <div>
                          <app-dynamic-field-control
                            [field]="notePresetField('filterNotesPreset', 'Filtros esperados', availableFilterPresetOptions)"
                            [value]="guide.filterPreset"
                            (valueChange)="onFilterPresetChange(asString($event))"
                          ></app-dynamic-field-control>
                          @if (guide.filterPreset === customNoteValue) {
                            <app-dynamic-field-control
                              [field]="runtimeField('filterNotesCustom', 'text', 'Filtro custom', 'tenant actual, estado activo, rango de fechas')"
                              [value]="guide.filterNotes"
                              (valueChange)="setGuideValue('filterNotes', asString($event))"
                            ></app-dynamic-field-control>
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
                        <app-ui-kit-button
                          label="Recargar tablas"
                          tone="secondary"
                          variant="outline"
                          (pressed)="loadTables()"
                        ></app-ui-kit-button>
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
                  <div class="public-exposure-box">
                    <div class="public-exposure-head">
                      <div>
                        <strong>Consumo público</strong>
                        <span>
                          Por defecto el servicio es privado. Activa una URL pública solo cuando una API externa deba
                          consumirlo.
                        </span>
                      </div>
                      <app-dynamic-field-control
                        [field]="runtimeField('publicEnabled', 'checkbox', 'Endpoint público', 'Habilitar endpoint público')"
                        [value]="guide.publicEnabled"
                        (valueChange)="setGuideBoolean('publicEnabled', $event)"
                      ></app-dynamic-field-control>
                    </div>

                    @if (guide.publicEnabled) {
                      <div class="guide-grid">
                        <app-dynamic-field-control
                          [field]="runtimeField('publicSecurityMode', 'select', 'Nivel de seguridad', '', publicSecurityModeOptions)"
                          [value]="guide.publicSecurityMode"
                          (valueChange)="setGuideValue('publicSecurityMode', $event)"
                        ></app-dynamic-field-control>
                        <app-dynamic-field-control
                          [field]="runtimeField('publicMethods', 'select', 'Métodos permitidos', '', publicMethodPresetOptions)"
                          [value]="guide.publicMethodPreset"
                          (valueChange)="setGuideValue('publicMethodPreset', asString($event))"
                        ></app-dynamic-field-control>
                        <app-dynamic-field-control
                          [field]="runtimeField('publicInputMode', 'select', 'Entrada', '', publicInputModeOptions)"
                          [value]="guide.publicInputMode"
                          (valueChange)="setGuideValue('publicInputMode', $event)"
                        ></app-dynamic-field-control>
                        <app-dynamic-field-control
                          [field]="runtimeField('publicResponseMode', 'select', 'Respuesta', '', publicResponseModeOptions)"
                          [value]="guide.publicResponseMode"
                          (valueChange)="setGuideValue('publicResponseMode', $event)"
                        ></app-dynamic-field-control>
                        @if (guide.publicSecurityMode === 'api_key') {
                          <app-dynamic-field-control
                            [field]="runtimeField('publicHeaderName', 'text', 'Header', 'x-chicle-api-key')"
                            [value]="guide.publicHeaderName"
                            (valueChange)="setGuideValue('publicHeaderName', asString($event))"
                          ></app-dynamic-field-control>
                        }
                        @if (guide.publicSecurityMode === 'api_key' || guide.publicSecurityMode === 'bearer_token') {
                          <div>
                            <app-dynamic-field-control
                              [field]="runtimeField('publicSecret', 'password', 'Nueva key/token', 'Mínimo 16 caracteres')"
                              [value]="guide.publicSecret"
                              (valueChange)="setGuideValue('publicSecret', asString($event))"
                            ></app-dynamic-field-control>
                            <span class="meta">El backend guarda hash, no el valor en claro.</span>
                          </div>
                        }
                      </div>
                      <div class="endpoint-box">
                        <span>URL pública</span>
                        <code>{{ publicServiceUrl }}</code>
                      </div>
                    }
                  </div>
                  @if (definitionChanged) {
                    <div class="notice success">
                      Cambiaste la lógica del servicio. El siguiente paso es Crear versión y luego Publicar última.
                    </div>
                  }
                </section>

                <div id="service-version">
                  <app-json-authoring-panel
                    artifactLabel="Servicio"
                    title="JSON ejecutable del servicio"
                    description="Puedes configurar el servicio con la guía o editar directamente este JSON. Guardar draft y publicar usan el endpoint estándar para asistentes."
                    stepLabel="Authoring JSON"
                    endpoint="/api/dynamic-services/authoring/json"
                    [value]="definitionText"
                    [error]="definitionAuthoringError"
                    [ready]="definitionAuthoringReady"
                    [isBusy]="saving"
                    [resetDisabled]="!selected?.publishedVersion"
                    [draftDisabled]="!canEditSelected"
                    [publishDisabled]="!canEditSelected"
                    (valueChange)="onDefinitionTextChange($event)"
                    (resetJson)="loadPublishedDefinition()"
                    (applyJson)="applyServiceJsonToGuide()"
                    (saveDraft)="saveServiceJsonOnly(false)"
                    (saveAndPublish)="saveServiceJsonOnly(true)"
                  >
                    @if (selected?.latestVersion; as latestVersion) {
                      <p class="meta">
                        Última versión: v{{ latestVersion.version }} · {{ latestVersion.status }}
                      </p>
                    } @else {
                      <p class="meta">Aún no hay versiones. Guardar draft crea una versión con la definición actual.</p>
                    }
                  </app-json-authoring-panel>
                </div>

                <section class="panel" id="service-test">
                  <app-section-header
                    title="Prueba en vivo"
                    description="El navegador pide al backend ejecutar el servicio. Los secretos no vuelven expuestos."
                    stepLabel="Verificación"
                  >
                    <app-ui-kit-button
                      label="Probar servicio"
                      tone="primary"
                      [disabled]="!canTest"
                      (pressed)="testService()"
                    ></app-ui-kit-button>
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
                      <app-code-textarea
                        controlId="test-context"
                        label="JSON de consumo/prueba"
                        [value]="contextText"
                        minHeight="220px"
                        (valueChange)="contextText = $event"
                      ></app-code-textarea>
                    </div>
                    <div class="block">
                      <div class="field-label">Última respuesta</div>
                      @if (lastRun) {
                        <pre>{{ lastRun | json }}</pre>
                      } @else if (!selected?.publishedVersion) {
                        <div class="notice">
                          Primero guarda/publica el servicio. La prueba solo ejecuta versiones publicadas.
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
                    <app-ui-kit-button
                      label="Actualizar historial"
                      tone="secondary"
                      variant="outline"
                      [disabled]="runsLoading"
                      (pressed)="loadRuns()"
                    ></app-ui-kit-button>
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
export class ServicesPageComponent implements OnDestroy, OnInit {
  private readonly api = inject(ApiClientService);
  private readonly serviceClient = inject(DynamicServiceClientService);
  private readonly assistant = inject(AiAssistantService);
  readonly auth = inject(AuthService);
  private appliedAssistantProposalId = 0;
  private readonly unregisterAssistantState = this.assistant.registerScreenStateProvider('services', () =>
    this.assistantScreenState()
  );
  private readonly assistantProposalEffect = effect(() => {
    const proposal = this.assistant.proposal();
    if (!proposal || proposal.id === this.appliedAssistantProposalId || proposal.scope !== 'services') {
      return;
    }

    const action = proposal.actions.find(
      (item): item is ApplyDynamicServiceJsonAction => item.type === 'apply_dynamic_service_json'
    );
    if (!action) {
      return;
    }

    this.appliedAssistantProposalId = proposal.id;
    this.applyAssistantServiceProposal(action);
  });

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
  assistantDraftMode = false;
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
  readonly serviceIntentOptions = [
    { label: 'Consultar lista', value: 'query' },
    { label: 'Consultar uno', value: 'get_one' },
    { label: 'Crear', value: 'create' },
    { label: 'Editar', value: 'update' },
    { label: 'Borrar', value: 'delete' },
    { label: 'Validar', value: 'validate' },
    { label: 'Sincronizar', value: 'sync' },
    { label: 'Notificar', value: 'notify' },
    { label: 'Personalizado', value: 'custom' }
  ];
  readonly serviceSourceOptions = [
    { label: 'API externa', value: 'external_api' },
    { label: 'Tabla interna', value: 'internal_table' },
    { label: 'Records', value: 'dynamic_record' },
    { label: 'Conector futuro', value: 'future_connector' }
  ];
  readonly serviceResultOptions = [
    { label: 'Nada', value: 'none' },
    { label: 'Un registro', value: 'single' },
    { label: 'Lista', value: 'list' },
    { label: 'Lista paginada', value: 'paginated_list' },
    { label: 'Sí / no', value: 'boolean' },
    { label: 'Archivo', value: 'file' }
  ];
  readonly serviceEffectOptions = [
    { label: 'Solo guardar historial', value: 'none' },
    { label: 'Mostrar respuesta', value: 'show_response' },
    { label: 'Actualizar record', value: 'update_record' },
    { label: 'Actualizar tabla custom', value: 'update_custom_table' },
    { label: 'Emitir evento', value: 'emit_event' }
  ];
  readonly serviceQueryModeOptions = [
    { label: 'Una tabla', value: 'single_table' },
    { label: 'Varias tablas relacionadas', value: 'multi_table' },
    { label: 'Vista/modelo de lectura futuro', value: 'advanced_read_model' }
  ];
  readonly serviceMatchModeOptions = [
    { label: 'Todos deben coincidir', value: 'all' },
    { label: 'Cualquiera puede coincidir', value: 'any' }
  ];
  readonly serviceFilterOperatorOptions = [
    { label: 'Igual a', value: 'equals' },
    { label: 'Contiene', value: 'contains' },
    { label: 'Empieza por', value: 'starts_with' },
    { label: 'Mayor que', value: 'greater_than' },
    { label: 'Mayor o igual', value: 'greater_or_equal' },
    { label: 'Menor que', value: 'less_than' },
    { label: 'Menor o igual', value: 'less_or_equal' }
  ];
  readonly serviceFilterSourceOptions = [
    { label: 'Viene del formulario/API', value: 'input' },
    { label: 'Valor fijo', value: 'literal' },
    { label: 'Tenant actual', value: 'tenant' },
    { label: 'Usuario actual', value: 'current_user' }
  ];
  readonly publicSecurityModeOptions = [
    { label: 'API key por header', value: 'api_key' },
    { label: 'Bearer token fijo', value: 'bearer_token' },
    { label: 'Sin auth solo GET lectura', value: 'none' }
  ];
  readonly publicMethodPresetOptions = [
    { label: 'POST', value: 'POST' },
    { label: 'GET', value: 'GET' },
    { label: 'GET + POST', value: 'GET_POST' },
    { label: 'POST + PUT + PATCH', value: 'WRITE' },
    { label: 'Todos', value: 'ALL' }
  ];
  readonly publicInputModeOptions = [
    { label: 'Body o query según método', value: 'body_or_query' },
    { label: 'Solo body JSON', value: 'body' },
    { label: 'Solo query params', value: 'query' }
  ];
  readonly publicResponseModeOptions = [
    { label: 'Mapeada o resultado', value: 'mapped_or_result' },
    { label: 'Solo result', value: 'result_only' },
    { label: 'Snapshot completo saneado', value: 'full_snapshot' }
  ];

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
    totalPath: 'response.body.total',
    publicEnabled: false,
    publicSecurityMode: 'api_key' as ServicePublicSecurityMode,
    publicHeaderName: 'x-chicle-api-key',
    publicSecret: '',
    publicMethodPreset: 'POST',
    publicInputMode: 'body_or_query' as ServicePublicInputMode,
    publicResponseMode: 'mapped_or_result' as ServicePublicResponseMode
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
      responseMap: {},
      exposure: {
        enabled: false,
        allowedMethods: [],
        inputMode: 'body_or_query',
        responseMode: 'mapped_or_result',
        security: {
          mode: 'private'
        }
      }
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

  get hasServiceDraft() {
    return Boolean(this.selected || this.assistantDraftMode);
  }

  get serviceActiveStep() {
    if (!this.hasServiceDraft) {
      return 'data';
    }
    if (this.assistantDraftMode && this.guideWarnings.length) {
      return 'design';
    }
    if (this.assistantDraftMode && !this.selected && !this.guideWarnings.length) {
      return 'version';
    }
    if (this.serviceMetadataChanged) {
      return 'data';
    }
    if (this.guideWarnings.length) {
      return 'design';
    }
    if (!this.selected?.latestVersion) {
      return 'version';
    }
    if (!this.selected?.publishedVersion) {
      return 'publication';
    }
    return 'test';
  }

  get serviceProcessSteps(): ProcessStepItem[] {
    const selected = this.selected;
    const hasDraft = this.hasServiceDraft;
    return [
      {
        key: 'data',
        label: 'Datos',
        summary: selected && !this.serviceMetadataChanged ? 'Guardados' : 'Nombre y estado',
        state: this.serviceActiveStep === 'data' ? 'active' : hasDraft ? 'complete' : 'pending'
      },
      {
        key: 'design',
        label: 'Diseñar',
        summary: this.guideWarnings.length ? `${this.guideWarnings.length} puntos pendientes` : 'Lógica guiada',
        state:
          this.serviceActiveStep === 'design'
            ? 'active'
            : hasDraft && !this.guideWarnings.length
              ? 'complete'
              : 'pending',
        disabled: !hasDraft
      },
      {
        key: 'version',
        label: 'Versionar',
        summary: selected?.latestVersion ? `v${selected.latestVersion.version}` : 'Crear snapshot',
        state: this.serviceActiveStep === 'version' ? 'active' : selected?.latestVersion ? 'complete' : 'pending',
        disabled: !hasDraft
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
        summary: this.selected ? 'Guardado' : this.assistantDraftMode ? 'Borrador listo' : 'Pendiente',
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

  get definitionAuthoringReady() {
    return !this.definitionAuthoringError;
  }

  get definitionAuthoringError() {
    try {
      JSON.parse(this.definitionText || '{}');
      return '';
    } catch {
      return 'El JSON no es válido. Corrige llaves, comas o valores antes de guardar.';
    }
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

  get involvedTableOptions() {
    return this.tableSelectOptions.filter((table) => table.name !== this.guide.primaryTable);
  }

  get selectedInvolvedTables() {
    return this.guide.involvedTableList
      .map((name) => this.tableSelectOptions.find((table) => table.name === name))
      .filter((table): table is DatabaseTable => Boolean(table));
  }

  get availableRelationPresetOptions() {
    return this.uniqueNoteOptions([
      { label: 'Selecciona relación', value: '' },
      ...this.dynamicRelationPresetOptions,
      ...this.relationPresetOptions.filter((option) => option.value)
    ]);
  }

  get availableFilterPresetOptions() {
    return this.uniqueNoteOptions([
      { label: 'Selecciona filtros', value: '' },
      ...this.dynamicFilterPresetOptions,
      ...this.filterPresetOptions.filter((option) => option.value)
    ]);
  }

  get dynamicRelationPresetOptions(): NoteOption[] {
    const primary = this.guide.primaryTable;
    const involved = new Set(this.guide.involvedTableList);
    const options: NoteOption[] = [];

    if (primary === 'users' && involved.has('user_roles') && involved.has('roles')) {
      options.push({
        label: 'Usuario a roles asignados',
        value: 'users.id -> user_roles.userId -> roles.id'
      });
    }

    if (primary === 'records' && involved.has('users')) {
      options.push({
        label: 'Record a usuario',
        value: 'records.data.userId = users.id'
      });
    }

    if (primary === 'records' && this.guide.involvedTableList.some((table) => table.startsWith('custom_'))) {
      options.push({
        label: 'Record a tabla custom',
        value: 'records.data.customId = custom_table.id'
      });
    }

    return options;
  }

  get dynamicFilterPresetOptions(): NoteOption[] {
    const alias = this.primaryAliasForGuide();
    const columns = this.filterColumnOptions;
    const options: NoteOption[] = [];

    for (const columnName of ['name', 'email', 'key', 'id', 'status', 'active']) {
      if (columns.some((column) => column.name === columnName)) {
        const operator = columnName === 'name' ? 'contains' : 'equals';
        options.push({
          label: `${this.guide.primaryTable}.${columnName} ${this.operatorLabel(operator)}`,
          value: `${alias}.${columnName} ${operator} input.${columnName}`
        });
      }
    }

    return options;
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

    if (this.guide.publicEnabled) {
      const methods = this.publicMethodsFromPreset(this.guide.publicMethodPreset);
      const hasStoredSecret = Boolean(this.parseDefinitionOrDefault().exposure?.security?.secretHash);
      const needsSecret = this.guide.publicSecurityMode === 'api_key' || this.guide.publicSecurityMode === 'bearer_token';
      if (needsSecret && !this.guide.publicSecret.trim() && !hasStoredSecret) {
        warnings.push('Define una key/token inicial para exponer el servicio públicamente.');
      }
      if (this.guide.publicSecret.trim() && this.guide.publicSecret.trim().length < 16) {
        warnings.push('La key/token pública debe tener mínimo 16 caracteres.');
      }
      if (this.guide.publicSecurityMode === 'none') {
        const readOnly = methods.every((method) => method === 'GET');
        const safeIntent = ['query', 'get_one', 'validate'].includes(this.guide.intent);
        if (!readOnly || !safeIntent) {
          warnings.push('Sin autenticación solo se permite GET de lectura o validación.');
        }
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

  get publicServiceUrl() {
    const tenantSlug = this.auth.state.session()?.tenant.slug ?? ':tenantSlug';
    const key = this.draft.key || this.selected?.key || ':serviceKey';
    return `/api/public/${tenantSlug}/services/${key}`;
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

  ngOnDestroy() {
    this.unregisterAssistantState();
  }

  asString(value: unknown) {
    return value == null ? '' : String(value);
  }

  asBoolean(value: unknown) {
    return value === true || value === 'true' || value === '1';
  }

  runtimeField(
    name: string,
    type: string,
    label: string,
    placeholder = '',
    options: Array<{ label: string; value: unknown }> = []
  ): RuntimeField {
    return {
      name,
      type,
      label,
      placeholder,
      options
    };
  }

  tableField(name: string, label: string): RuntimeField {
    return this.runtimeField(
      name,
      'select',
      label,
      'Selecciona una tabla',
      [
        { label: 'Selecciona una tabla', value: '' },
        ...this.tableSelectOptions.map((table) => ({
          label: `${table.name} · ${table.source === 'schema' ? 'custom' : table.scope}`,
          value: table.name
        }))
      ]
    );
  }

  involvedTableField(name: string, label: string): RuntimeField {
    return this.runtimeField(
      name,
      'select',
      label,
      'Selecciona una tabla',
      [
        { label: 'Selecciona una tabla', value: '' },
        ...this.involvedTableOptions.map((table) => ({
          label: `${table.name} · ${table.source === 'schema' ? 'custom' : table.scope}`,
          value: table.name
        }))
      ]
    );
  }

  involvedTableOptionsForChecklist(): AssignmentChecklistOption[] {
    return this.involvedTableOptions.map((table) => ({
      key: table.name,
      label: table.name,
      description: table.source === 'schema' ? 'custom' : table.scope,
      checked: this.guide.involvedTableList.includes(table.name)
    }));
  }

  toggleInvolvedTable(tableName: string) {
    const exists = this.guide.involvedTableList.includes(tableName);
    this.guide.involvedTableList = exists
      ? this.guide.involvedTableList.filter((item) => item !== tableName)
      : [...this.guide.involvedTableList, tableName];
    this.onInvolvedTablesChange();
  }

  filterFieldOptionField(index: number): RuntimeField {
    return this.runtimeField(
      `filterField${index}`,
      'select',
      'Campo',
      'Selecciona un campo',
      [
        { label: 'Selecciona un campo', value: '' },
        ...this.filterColumnOptions.map((column) => ({ label: `${column.name} · ${column.type}`, value: column.name })),
        { label: 'Otro campo', value: this.customNoteValue }
      ]
    );
  }

  notePresetField(name: string, label: string, options: NoteOption[]): RuntimeField {
    return this.runtimeField(
      name,
      'select',
      label,
      '',
      [...options, { label: 'Otro', value: this.customNoteValue }]
    );
  }

  setGuideValue(key: keyof typeof this.guide, value: unknown) {
    (this.guide as Record<string, unknown>)[key] = value;
    this.syncGuideToDefinition();
  }

  setGuideBoolean(key: keyof typeof this.guide, value: unknown) {
    (this.guide as Record<string, unknown>)[key] = this.asBoolean(value);
    this.syncGuideToDefinition();
  }

  setGuideSource(value: unknown) {
    this.guide.source = this.asString(value) as ServiceSource;
    this.onSourceChange();
  }

  setGuideQueryMode(value: unknown) {
    this.guide.queryMode = this.asString(value) as ServiceQueryMode;
    this.onQueryModeChange();
  }

  setGuidePrimaryTable(value: unknown) {
    this.guide.primaryTable = this.asString(value);
    this.onPrimaryTableChange();
  }

  setFilterValue(filter: ServiceGuideFilter, key: keyof ServiceGuideFilter, value: unknown) {
    (filter as unknown as Record<string, unknown>)[key] = value;
    this.syncGuideToDefinition();
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
    this.assistantDraftMode = false;
    this.runs = [];
    this.lastRun = undefined;
    this.draft = { key: '', name: '', description: '', active: true };
    this.savedDraftSnapshot = this.draftSnapshot();
  }

  select(service: DynamicServiceItem) {
    this.selected = service;
    this.assistantDraftMode = false;
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
        this.assistantDraftMode = false;
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
    this.assistantDraftMode = false;
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
        this.assistantDraftMode = false;
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

  restoreService(overwrite = false) {
    if (!this.selected) {
      return;
    }

    this.saving = true;
    this.formError = '';
    this.api.post<DynamicServiceItem>(`dynamic-services/${this.selected.id}/restore`, { overwrite }).subscribe({
      next: (service) => {
        this.saving = false;
        this.viewingTrash = false;
        this.message = 'Servicio restaurado.';
        this.selected = service;
        this.load();
      },
      error: (error) => {
        this.saving = false;
        if (!overwrite && this.isRestoreConflict(error)) {
          const accepted = window.confirm(
            'Ya existe un servicio activo con esa key. ¿Quieres enviar el activo a papelera y restaurar este servicio?'
          );
          if (accepted) {
            this.restoreService(true);
            return;
          }
        }
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

  saveServiceJsonOnly(publish: boolean) {
    if (!this.canEditSelected) {
      this.formError = 'No tienes permisos para guardar este servicio.';
      return;
    }
    const document = this.parseJson<DynamicServiceDefinition>(this.definitionText);
    if (!document) {
      return;
    }

    this.saving = true;
    this.formError = '';
    this.message = '';
    this.api
      .post<DynamicServiceAuthoringResponse>('dynamic-services/authoring/json', {
        key: this.draft.key || this.selected?.key,
        name: this.draft.name || this.selected?.name,
        description: this.draft.description || this.selected?.description,
        active: this.draft.active,
        document,
        publish
      })
      .subscribe({
        next: (response) => {
          const service: DynamicServiceItem = {
            ...response.service,
            latestVersion: response.version,
            publishedVersion: response.published ? response.version : response.service.publishedVersion ?? null
          };
          this.saving = false;
          this.selected = service;
          this.draft = {
            key: service.key,
            name: service.name,
            description: service.description ?? '',
            active: service.active
          };
          this.savedDraftSnapshot = this.draftSnapshot();
          this.definitionText = JSON.stringify(response.version.definition, null, 2);
          this.services = this.services.some((item) => item.id === service.id)
            ? this.services.map((item) => (item.id === service.id ? service : item))
            : [service, ...this.services];
          this.loadGuideFromDefinition();
          this.syncContextProposal(response.version.definition);
          this.message = publish
            ? `Servicio ${response.key} guardado y publicado.`
            : `Servicio ${response.key} guardado como draft.`;
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
      this.syncContextProposal(this.selected.publishedVersion.definition);
    }
  }

  applyServiceJsonToGuide() {
    this.loadGuideFromDefinition();
    this.syncContextProposal(this.parseDefinitionOrDefault());
  }

  onDefinitionTextChange(value: string) {
    this.definitionText = value;
    this.formError = '';
    try {
      this.syncContextProposal(JSON.parse(value) as DynamicServiceDefinition);
    } catch {
      // The authoring panel already shows JSON validation feedback while typing.
    }
  }

  private applyAssistantServiceProposal(action: ApplyDynamicServiceJsonAction) {
    this.viewingTrash = false;
    this.selected = undefined;
    this.assistantDraftMode = true;
    this.runs = [];
    this.lastRun = undefined;
    this.draft = {
      key: action.key,
      name: action.name,
      description: action.description ?? '',
      active: true
    };
    this.definitionText = JSON.stringify(action.document, null, 2);
    this.loadGuideFromDefinition();
    this.syncContextProposal(this.parseDefinitionOrDefault());
    this.ensureTableCatalog();
    this.ensurePrimaryTable();
    this.savedDraftSnapshot = this.draftSnapshot();
    this.formError = '';
    this.message =
      'Chicle AI aplicó una propuesta al diseñador. Revisa la guía y el JSON; luego usa Guardar draft o Guardar y publicar.';
  }

  private assistantScreenState() {
    return {
      mode: this.selected ? 'editing_existing_service' : this.assistantDraftMode ? 'editing_ai_draft' : 'new_service',
      selected: this.selected
        ? {
            key: this.selected.key,
            name: this.selected.name,
            active: this.selected.active,
            hasLatestVersion: Boolean(this.selected.latestVersion),
            hasPublishedVersion: Boolean(this.selected.publishedVersion)
          }
        : null,
      draft: {
        key: this.draft.key,
        name: this.draft.name,
        description: this.draft.description,
        active: this.draft.active
      },
      guide: {
        intent: this.guide.intent,
        source: this.guide.source,
        resultKind: this.guide.resultKind,
        queryMode: this.guide.queryMode,
        primaryTable: this.guide.primaryTable,
        filters: this.selectedGuideFilters,
        warnings: this.guideWarnings
      },
      definition: this.parseDefinitionOrDefault(),
      testContext: this.readCurrentContext(),
      lastRun: this.lastRun
        ? {
            status: this.lastRun.status,
            error: this.lastRun.error ?? null,
            durationMs: this.lastRun.durationMs
          }
        : null,
      availableTables: this.tableOptions.map((table) => ({
        name: table.name,
        columns: table.columns.map((column) => column.name)
      }))
    };
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

  private advancedPlanFromGuide(): Partial<NonNullable<DynamicServiceDefinition['dataTarget']>> {
    if (
      this.guide.primaryTable === 'users' &&
      this.guide.involvedTableList.includes('user_roles') &&
      this.guide.involvedTableList.includes('roles') &&
      this.guide.relationNotes === 'users.id -> user_roles.userId -> roles.id'
    ) {
      const filter = this.filterFromAdvancedPreset() ?? {
        field: 'u.name',
        operator: 'contains' as ServiceFilterOperator,
        valueSource: 'input' as ServiceFilterValueSource,
        inputKey: 'name',
        required: true
      };

      return {
        primaryAlias: 'u',
        joins: [
          {
            type: 'left',
            table: 'user_roles',
            alias: 'ur',
            on: [{ left: 'u.id', operator: 'equals', right: 'ur.userId' }]
          },
          {
            type: 'left',
            table: 'roles',
            alias: 'r',
            on: [{ left: 'ur.roleId', operator: 'equals', right: 'r.id' }]
          }
        ],
        select: [
          { field: 'u.id', alias: 'userId' },
          { field: 'u.email', alias: 'userEmail' },
          { field: 'u.name', alias: 'userName' },
          { field: 'r.id', alias: 'roleId' },
          { field: 'r.key', alias: 'roleKey' },
          { field: 'r.name', alias: 'roleName' }
        ],
        filters: [filter],
        limit: 100
      };
    }

    const filter = this.filterFromAdvancedPreset();
    return {
      primaryAlias: this.primaryAliasForGuide(),
      filters: filter ? [filter] : []
    };
  }

  private filterFromAdvancedPreset(): ServiceFilter | null {
    const value = this.guide.filterNotes.trim();
    const match = value.match(
      /^([A-Za-z][A-Za-z0-9_]*\.[A-Za-z][A-Za-z0-9_]*)\s+(equals|contains|starts_with|greater_than|greater_or_equal|less_than|less_or_equal)\s+input\.([A-Za-z][A-Za-z0-9_]*)$/
    );
    if (!match) {
      return null;
    }

    return {
      field: match[1],
      operator: match[2] as ServiceFilterOperator,
      valueSource: 'input',
      inputKey: match[3],
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

    if (this.guide.queryMode !== 'single_table') {
      definition.dataTarget = {
        ...definition.dataTarget,
        ...this.advancedPlanFromGuide()
      };
    }

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

    definition.exposure = this.publicExposureFromGuide(definition);

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
      this.guide.filterPreset = '';
      this.guide.filterNotes = '';
    }

    this.syncGuideToDefinition();
  }

  onPrimaryTableChange() {
    this.guide.involvedTableList = this.guide.involvedTableList.filter((table) => table !== this.guide.primaryTable);
    this.refreshAdvancedPresets();
    this.ensureFilterField(true);
    this.syncGuideToDefinition();
  }

  onInvolvedTablesChange() {
    this.guide.involvedTableList = [...new Set(this.guide.involvedTableList)].filter(
      (table) => table !== this.guide.primaryTable
    );
    this.refreshAdvancedPresets();
    this.syncGuideToDefinition();
  }

  onRelationPresetChange(value: string) {
    if (value !== CUSTOM_NOTE_VALUE) {
      this.guide.relationNotes = value;
    } else if (this.matchesPreset(this.guide.relationNotes, this.availableRelationPresetOptions)) {
      this.guide.relationNotes = '';
    }

    this.syncGuideToDefinition();
  }

  onFilterPresetChange(value: string) {
    if (value !== CUSTOM_NOTE_VALUE) {
      this.guide.filterNotes = value;
    } else if (this.matchesPreset(this.guide.filterNotes, this.availableFilterPresetOptions)) {
      this.guide.filterNotes = '';
    }

    this.syncGuideToDefinition();
  }

  private refreshAdvancedPresets() {
    if (this.guide.queryMode === 'single_table') {
      return;
    }

    if (
      this.guide.relationPreset &&
      this.guide.relationPreset !== CUSTOM_NOTE_VALUE &&
      !this.availableRelationPresetOptions.some((option) => option.value === this.guide.relationPreset)
    ) {
      this.guide.relationPreset = '';
      this.guide.relationNotes = '';
    }

    if (
      this.guide.filterPreset &&
      this.guide.filterPreset !== CUSTOM_NOTE_VALUE &&
      !this.availableFilterPresetOptions.some((option) => option.value === this.guide.filterPreset)
    ) {
      this.guide.filterPreset = '';
      this.guide.filterNotes = '';
    }
  }

  private uniqueNoteOptions(options: NoteOption[]) {
    const seen = new Set<string>();
    return options.filter((option) => {
      const key = option.value || '__empty__';
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private primaryAliasForGuide() {
    if (this.guide.primaryTable === 'users') {
      return 'u';
    }
    if (this.guide.primaryTable === 'roles') {
      return 'r';
    }
    if (this.guide.primaryTable === 'records') {
      return 'rec';
    }
    return 'base';
  }

  private operatorLabel(operator: string) {
    const labels: Record<string, string> = {
      equals: 'igual a',
      contains: 'contiene',
      starts_with: 'empieza por',
      greater_than: 'mayor que',
      greater_or_equal: 'mayor o igual',
      less_than: 'menor que',
      less_or_equal: 'menor o igual'
    };

    return labels[operator] ?? operator;
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
      relationPreset: '',
      relationNotes,
      filterPreset: '',
      filterNotes,
      pageParam: definition.pagination?.pageParam ?? this.guide.pageParam,
      pageSizeParam: definition.pagination?.pageSizeParam ?? this.guide.pageSizeParam,
      itemsPath: definition.pagination?.itemsPath ?? this.guide.itemsPath,
      totalPath: definition.pagination?.totalPath ?? this.guide.totalPath,
      publicEnabled: Boolean(definition.exposure?.enabled),
      publicSecurityMode:
        definition.exposure?.security?.mode && definition.exposure.security.mode !== 'private'
          ? definition.exposure.security.mode
          : this.guide.publicSecurityMode,
      publicHeaderName: definition.exposure?.security?.headerName ?? this.guide.publicHeaderName,
      publicSecret: '',
      publicMethodPreset: this.methodPresetFromExposure(definition.exposure?.allowedMethods),
      publicInputMode: definition.exposure?.inputMode ?? this.guide.publicInputMode,
      publicResponseMode: definition.exposure?.responseMode ?? this.guide.publicResponseMode
    };
    this.guide.relationPreset = this.presetValueFor(relationNotes, this.availableRelationPresetOptions);
    this.guide.filterPreset = this.presetValueFor(filterNotes, this.availableFilterPresetOptions);
  }

  private presetValueFor(value: string, options: NoteOption[]) {
    if (!value) {
      return '';
    }

    return this.matchesPreset(value, options) ? value : CUSTOM_NOTE_VALUE;
  }

  private publicExposureFromGuide(definition: DynamicServiceDefinition): NonNullable<DynamicServiceDefinition['exposure']> {
    const current = definition.exposure;
    if (!this.guide.publicEnabled) {
      return {
        enabled: false,
        allowedMethods: [],
        inputMode: this.guide.publicInputMode,
        responseMode: this.guide.publicResponseMode,
        security: {
          mode: 'private'
        }
      };
    }

    const security: NonNullable<NonNullable<DynamicServiceDefinition['exposure']>['security']> = {
      mode: this.guide.publicSecurityMode,
      headerName: this.publicHeaderNameForGuide()
    };
    if (this.guide.publicSecret.trim()) {
      if (this.guide.publicSecurityMode === 'bearer_token') {
        security.token = this.guide.publicSecret.trim();
      } else if (this.guide.publicSecurityMode === 'api_key') {
        security.apiKey = this.guide.publicSecret.trim();
      }
    } else if (current?.security?.secretHash && current.security.secretSalt) {
      security.secretHash = current.security.secretHash;
      security.secretSalt = current.security.secretSalt;
      security.algorithm = current.security.algorithm ?? 'scrypt-sha256';
    }

    return {
      enabled: true,
      allowedMethods: this.publicMethodsFromPreset(this.guide.publicMethodPreset),
      inputMode: this.guide.publicInputMode,
      responseMode: this.guide.publicResponseMode,
      security
    };
  }

  private publicMethodsFromPreset(preset: string): Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> {
    const options: Record<string, Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>> = {
      GET: ['GET'],
      POST: ['POST'],
      GET_POST: ['GET', 'POST'],
      WRITE: ['POST', 'PUT', 'PATCH'],
      ALL: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    };
    return options[preset] ?? ['POST'];
  }

  private methodPresetFromExposure(methods?: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>) {
    const key = (methods ?? []).join('_');
    const presets: Record<string, string> = {
      GET: 'GET',
      POST: 'POST',
      GET_POST: 'GET_POST',
      POST_PUT_PATCH: 'WRITE',
      GET_POST_PUT_PATCH_DELETE: 'ALL'
    };
    return presets[key] ?? 'POST';
  }

  private publicHeaderNameForGuide() {
    if (this.guide.publicSecurityMode === 'bearer_token') {
      return 'authorization';
    }
    return this.guide.publicHeaderName.trim() || 'x-chicle-api-key';
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
    if (normalized === 'key' || normalized.endsWith('key')) {
      return 'ai.';
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
        responseMap: {},
        exposure: {
          enabled: false,
          allowedMethods: [],
          inputMode: 'body_or_query',
          responseMode: 'mapped_or_result',
          security: {
            mode: 'private'
          }
        }
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

  private isRestoreConflict(error: unknown) {
    const response = error as { status?: number; error?: { message?: string | string[] }; message?: string };
    const message = response.error?.message ?? response.message ?? '';
    const text = Array.isArray(message) ? message.join(', ') : message;
    return response.status === 409 || text.includes('Confirm overwrite');
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '../../core/api/api-client.service';
import { UiPresentationConfig } from '../../core/ui/ui-presentation.types';
import {
  AvailableDynamicService,
  DynamicServiceClientService
} from '../../core/services/dynamic-service-client.service';
import {
  AvailableDynamicFlow,
  DynamicFlowClientService
} from '../../core/services/dynamic-flow-client.service';
import { FormRuntimeService, RuntimeForm } from '../../engine/forms/form-runtime.service';
import { CatalogHeaderComponent } from '../../shared/catalog-header/catalog-header.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { DesignerWorkspaceComponent } from '../../shared/designer-workspace/designer-workspace.component';
import { FieldShellComponent } from '../../shared/field-shell/field-shell.component';
import { FormlyRuntimeComponent } from '../../shared/formly-runtime/formly-runtime.component';
import { JsonAuthoringPanelComponent } from '../../shared/json-authoring-panel/json-authoring-panel.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { PreviewViewportComponent, PreviewViewportMode } from '../../shared/preview-viewport/preview-viewport.component';
import { ProcessStepItem, ProcessStepsComponent } from '../../shared/process-steps/process-steps.component';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { WorkflowGuideComponent } from '../../shared/workflow-guide/workflow-guide.component';

type FormLifecycleStatus = 'draft' | 'published' | 'archived';
type DesignerPhase = 'define' | 'fields' | 'publish' | 'preview';
type PersistenceMode = 'record' | 'service' | 'flow' | 'hybrid' | 'none';
type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'currency'
  | 'tel'
  | 'url'
  | 'password'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'toggle'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'image'
  | 'gps';
type FieldLayout = 'full' | 'half' | 'third';
type ConditionOperator = 'equals' | 'not_equals' | 'truthy' | 'falsy' | 'contains';
type PresentationKit = 'auto' | 'primeng' | 'ionic' | 'native';
type ThemeMode = 'system' | 'light' | 'dark';
type DensityMode = 'comfortable' | 'compact' | 'spacious';
type DesktopLayoutMode = 'step_cards' | 'single_form' | 'wizard' | 'auto';
type MobileLayoutMode = 'step_screens' | 'single_scroll' | 'auto';
type FormCommandType = 'execute_service' | 'execute_flow' | 'show_message';
type HybridActionType = 'none' | 'execute_service' | 'execute_flow';

interface FormTemplate {
  key: 'blank' | 'capture' | 'lookup' | 'approval' | 'inspection';
  title: string;
  description: string;
  badge: string;
}

interface FieldOptionDraft {
  label: string;
  value: string;
}

interface DynamicFormItem {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  category?: string | null;
  version: number;
  schema: Record<string, unknown>;
  published: boolean;
  status?: FormLifecycleStatus;
  publishedVersionId?: string | null;
}

interface DynamicFormVersion {
  id: string;
  formId: string;
  version: number;
  status: FormLifecycleStatus;
  schema: Record<string, unknown>;
  publishedAt?: string | null;
  createdAt: string;
}

interface DynamicFormAuthoringResponse {
  artifactType: 'dynamic_form';
  id: string;
  key: string;
  form: DynamicFormItem;
  version?: DynamicFormVersion | null;
  published: boolean;
}

interface FieldDraft {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string;
  help: string;
  defaultValue: string;
  layout: FieldLayout;
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  options: FieldOptionDraft[];
  dataSourceServiceKey: string;
  validationServiceKey: string;
  visibleWhenField: string;
  visibleWhenOperator: ConditionOperator;
  visibleWhenValue: string;
  requiredPermission: string;
  requiredRole: string;
  readonlyPermission: string;
}

interface StepDraft {
  key: string;
  title: string;
  description: string;
  fields: FieldDraft[];
}

interface FormCommandDraft {
  key: string;
  label: string;
  type: FormCommandType;
  serviceKey: string;
  flowKey: string;
  payloadMapText: string;
  responseMode: 'show_response' | 'silent';
  requiredPermission: string;
  requiredRole: string;
  requiresValidForm: boolean;
  confirmMessage: string;
}

interface FormDraft {
  templateKey: FormTemplate['key'];
  key: string;
  title: string;
  description: string;
  category: string;
  submitLabel: string;
  kit: PresentationKit;
  theme: string;
  themeMode: ThemeMode;
  density: DensityMode;
  desktopMode: DesktopLayoutMode;
  desktopColumns: number;
  mobileMode: MobileLayoutMode;
  autosave: boolean;
  offlineEnabled: boolean;
  timeoutMs: number;
  maxPayloadKb: number;
  persistenceMode: PersistenceMode;
  recordType: string;
  serviceKey: string;
  flowKey: string;
  hybridActionType: HybridActionType;
  hybridServiceKey: string;
  hybridFlowKey: string;
  payloadMapText: string;
  responseMapText: string;
  idempotencyKey: string;
  commands: FormCommandDraft[];
  steps: StepDraft[];
}

const DEFAULT_FIELD: FieldDraft = {
  key: 'nombre',
  label: 'Nombre',
  type: 'text',
  required: true,
  placeholder: 'Escribe el nombre',
  help: '',
  defaultValue: '',
  layout: 'half',
  minLength: null,
  maxLength: null,
  min: null,
  max: null,
  options: [],
  dataSourceServiceKey: '',
  validationServiceKey: '',
  visibleWhenField: '',
  visibleWhenOperator: 'equals',
  visibleWhenValue: '',
  requiredPermission: '',
  requiredRole: '',
  readonlyPermission: ''
};

const FIELD_PALETTE: Array<{
  type: FieldType;
  label: string;
  description: string;
  defaults?: Partial<FieldDraft>;
}> = [
  { type: 'text', label: 'Texto', description: 'Nombre, serial, código o dato corto.' },
  { type: 'email', label: 'Email', description: 'Correo con validación visual.' },
  { type: 'number', label: 'Número', description: 'Cantidad, valor o medida.' },
  { type: 'currency', label: 'Moneda', description: 'Valor económico o tarifa.', defaults: { placeholder: '0.00' } },
  { type: 'tel', label: 'Teléfono', description: 'Número de contacto.', defaults: { placeholder: '+57 300 000 0000' } },
  { type: 'url', label: 'URL', description: 'Enlace web o recurso externo.', defaults: { placeholder: 'https://empresa.com' } },
  { type: 'password', label: 'Password', description: 'Dato sensible de entrada oculta.' },
  { type: 'textarea', label: 'Texto largo', description: 'Observaciones y descripciones.', defaults: { layout: 'full' } },
  {
    type: 'select',
    label: 'Lista',
    description: 'Opciones fijas o cargadas por servicio.',
    defaults: {
      options: [
        { label: 'Opción 1', value: 'opcion_1' },
        { label: 'Opción 2', value: 'opcion_2' }
      ]
    }
  },
  {
    type: 'radio',
    label: 'Opciones',
    description: 'Selección visible entre pocas alternativas.',
    defaults: {
      options: [
        { label: 'Sí', value: 'yes' },
        { label: 'No', value: 'no' }
      ]
    }
  },
  { type: 'checkbox', label: 'Sí / no', description: 'Confirmación, aceptación o bandera.' },
  { type: 'toggle', label: 'Switch', description: 'Activar o desactivar una opción.' },
  { type: 'date', label: 'Fecha', description: 'Fecha de evento, visita o vencimiento.' },
  { type: 'time', label: 'Hora', description: 'Hora de visita, evento o ejecución.' },
  { type: 'datetime', label: 'Fecha y hora', description: 'Momento exacto de una actividad.' },
  { type: 'file', label: 'Archivo', description: 'Documento o evidencia general.', defaults: { layout: 'full' } },
  { type: 'image', label: 'Imagen', description: 'Foto o evidencia visual.', defaults: { layout: 'full' } },
  { type: 'gps', label: 'GPS', description: 'Captura de ubicación desde navegador o móvil.', defaults: { layout: 'full' } }
];

const FORM_TEMPLATES: FormTemplate[] = [
  {
    key: 'capture',
    title: 'Captura de datos',
    description: 'Formulario estándar para crear un registro con datos básicos y contacto.',
    badge: 'Recomendado'
  },
  {
    key: 'lookup',
    title: 'Consulta / validación',
    description: 'Recibe uno o varios datos, consulta un servicio o flow y muestra respuesta.',
    badge: 'Sin guardar'
  },
  {
    key: 'approval',
    title: 'Solicitud con aprobación',
    description: 'Captura una solicitud y la envía a un flow de revisión o negocio.',
    badge: 'Flow'
  },
  {
    key: 'inspection',
    title: 'Inspección móvil',
    description: 'Pasos cortos, observaciones y listo para evidencias/offline.',
    badge: 'Móvil'
  },
  {
    key: 'blank',
    title: 'Comenzar vacío',
    description: 'Solo deja la estructura mínima para construir desde cero.',
    badge: 'Avanzado'
  }
];

@Component({
  selector: 'app-forms-page',
  standalone: true,
  imports: [
    FormsModule,
    CatalogHeaderComponent,
    CatalogItemComponent,
    DesignerWorkspaceComponent,
    FieldShellComponent,
    FormlyRuntimeComponent,
    JsonAuthoringPanelComponent,
    LoadingSkeletonComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    PreviewViewportComponent,
    ProcessStepsComponent,
    SectionHeaderComponent,
    StatusNoticeComponent,
    WorkflowGuideComponent
  ],
  styles: [
    `
      .shell {
        display: grid;
        gap: 18px;
      }

      .panel,
      .json-panel,
      .preview-panel {
        display: grid;
        gap: 16px;
        align-content: start;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        padding: 18px;
      }

      .toolbar,
      .inline-actions,
      .field-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .toolbar {
        justify-content: space-between;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .grid.three {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .step-list,
      .field-list {
        display: grid;
        gap: 10px;
      }

      .template-grid,
      .helper-grid,
      .checklist-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .template-card,
      .helper-card,
      .checklist-card {
        display: grid;
        gap: 8px;
        align-content: start;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #fbfcfe;
        padding: 12px;
        text-align: left;
      }

      .template-card.active,
      .checklist-card.ready {
        border-color: #8fd0a8;
        background: #f3fbf6;
      }

      .template-card strong,
      .helper-card strong,
      .checklist-card strong {
        color: #173b5f;
      }

      .template-card small,
      .helper-card small,
      .checklist-card small {
        color: #52677a;
        line-height: 1.35;
      }

      .command-bar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
      }

      .command-bar .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .issue-list {
        display: grid;
        gap: 6px;
        margin: 0;
        padding-left: 18px;
      }

      .issue-list li {
        color: #71400f;
        line-height: 1.35;
      }

      .field-preview {
        display: grid;
        gap: 6px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        padding: 10px;
      }

      .toggle-card {
        position: relative;
        display: flex;
        gap: 10px;
        align-items: center;
        min-height: 50px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #fbfcfe;
        color: #173b5f;
        padding: 10px 12px;
        font-weight: 850;
        cursor: pointer;
      }

      .toggle-card input {
        position: absolute;
        width: 1px;
        height: 1px;
        min-height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .toggle-mark {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 22px;
        height: 22px;
        border: 1px solid #b8cce0;
        border-radius: 7px;
        background: #ffffff;
        color: transparent;
        font-size: 0.82rem;
        line-height: 1;
      }

      .toggle-card input:checked + .toggle-mark {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      .toggle-card input:focus-visible + .toggle-mark {
        outline: 3px solid rgba(21, 84, 162, 0.18);
        outline-offset: 2px;
      }

      .toggle-copy {
        display: grid;
        gap: 2px;
      }

      .toggle-copy small {
        color: #52677a;
        font-weight: 500;
        line-height: 1.3;
      }

      .status-chip {
        display: inline-flex;
        gap: 6px;
        align-items: center;
        width: fit-content;
        border: 1px solid #c9d8e6;
        border-radius: 999px;
        background: #f4f8fc;
        color: #173b5f;
        padding: 4px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .status-chip.ready {
        border-color: #8fd0a8;
        background: #effaf3;
        color: #17643a;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: currentColor;
      }

      .builder-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 16px;
        align-items: start;
      }

      .palette,
      .inspector,
      .test-panel,
      .live-json-card {
        display: grid;
        gap: 10px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #fbfcfe;
        padding: 12px;
      }

      .palette-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .palette button {
        display: grid;
        gap: 4px;
        min-height: 66px;
        text-align: left;
      }

      .palette small,
      .inspector small {
        color: #52677a;
        line-height: 1.35;
      }

      .step-item,
      .field-item {
        display: grid;
        gap: 12px;
        border: 1px solid #dbe6f0;
        border-radius: 8px;
        background: #f8fbfe;
        padding: 12px;
      }

      .step-item.active {
        border-color: #1554a2;
        background: #eef6ff;
      }

      .field-item {
        background: #ffffff;
      }

      .field-item.selected {
        border-color: #1554a2;
        background: #eef6ff;
      }

      .field-row {
        display: grid;
        grid-template-columns: minmax(110px, 0.8fr) minmax(160px, 1.1fr) minmax(110px, 0.7fr) auto;
        gap: 10px;
        align-items: end;
      }

      .option-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        gap: 8px;
        align-items: end;
      }

      .test-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 14px;
      }

      .preview-workbench {
        display: grid;
        gap: 14px;
      }

      .preview-contract {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .preview-contract-card {
        display: grid;
        gap: 5px;
        min-width: 0;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #fbfcfe;
        padding: 12px;
      }

      .preview-contract-card strong {
        color: #173b5f;
      }

      .preview-contract-card small {
        overflow-wrap: anywhere;
        color: #52677a;
        line-height: 1.35;
      }

      .preview-form-shell {
        display: grid;
        gap: 16px;
        min-height: 340px;
        padding: 18px;
      }

      .preview-form-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
        border-bottom: 1px solid #d9e2ec;
        padding-bottom: 14px;
      }

      .preview-form-title {
        display: grid;
        gap: 5px;
      }

      .preview-form-title h2,
      .preview-form-title p {
        margin: 0;
      }

      .preview-form-title h2 {
        color: #143653;
        font-size: clamp(1.2rem, 1.6vw, 1.55rem);
        line-height: 1.15;
      }

      .preview-form-title p {
        color: #52677a;
        line-height: 1.45;
      }

      .preview-form-meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 7px;
      }

      .test-output {
        min-height: 220px;
        overflow: auto;
        border-radius: 8px;
        background: #10263e;
        color: #e9f3ff;
        padding: 12px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.82rem;
        white-space: pre-wrap;
      }

      input,
      select,
      textarea {
        width: 100%;
        min-height: 38px;
        border: 1px solid #b8cce0;
        border-radius: 8px;
        background: #ffffff;
        color: #143653;
        padding: 8px 10px;
        font: inherit;
      }

      textarea {
        min-height: 340px;
        resize: vertical;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.82rem;
        line-height: 1.45;
      }

      textarea.compact-json {
        min-height: 120px;
      }

      textarea.live-json-text {
        min-height: 220px;
      }

      .live-json-toolbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
      }

      .live-json-toolbar .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      button {
        min-height: 38px;
        border: 1px solid #b8cce0;
        border-radius: 8px;
        background: #ffffff;
        color: #143653;
        padding: 8px 12px;
        font: inherit;
        font-weight: 850;
        cursor: pointer;
      }

      button.primary {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      button.danger {
        border-color: #e2aaa1;
        color: #9c2f25;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .muted {
        margin: 0;
        color: #52677a;
        line-height: 1.45;
      }

      .readiness-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: start;
        border: 1px solid #c9d8e6;
        border-left: 4px solid #1554a2;
        border-radius: 8px;
        background: #f7fbff;
        padding: 14px;
      }

      .readiness-card h3,
      .readiness-card p {
        margin: 0;
      }

      .readiness-copy {
        display: grid;
        gap: 5px;
      }

      .readiness-metrics {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        border: 1px solid #c9d8e6;
        border-radius: 999px;
        background: #f4f8fc;
        color: #173b5f;
        padding: 4px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .json-panel.invalid,
      .live-json-card.invalid {
        border-color: #f0aaaa;
      }

      @media (max-width: 980px) {
        .readiness-card {
          grid-template-columns: 1fr;
        }

        .readiness-metrics {
          justify-content: flex-start;
        }

        .grid,
        .grid.three,
        .template-grid,
        .helper-grid,
        .checklist-grid,
        .builder-grid,
        .test-grid,
        .preview-contract,
        .preview-form-header,
        .field-row {
          grid-template-columns: 1fr;
        }

        .preview-form-meta {
          justify-content: flex-start;
        }

        .palette-grid,
        .option-row {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Formularios">
      <div class="shell">
        <app-module-header
          eyebrow="Dynamic Forms"
          title="Diseñador de formularios"
          description="Crea formularios versionados para web y móvil desde la guía visual o directamente desde el JSON editable."
          badge="V1"
        ></app-module-header>

        <app-process-steps
          [items]="processItems"
          [activeKey]="phase"
          (selected)="setPhase($event)"
        ></app-process-steps>

        <app-workflow-guide
          [stepLabel]="guide.stepLabel"
          [title]="guide.title"
          [description]="guide.description"
          [tone]="guide.tone"
        >
          <button type="button" (click)="refresh()">Refrescar</button>
          <button class="primary" type="button" (click)="newForm()">Nuevo formulario</button>
          <button type="button" (click)="goNext()" [disabled]="!nextPhase">Continuar</button>
        </app-workflow-guide>

        <app-designer-workspace>
          <div designer-navigation>
            <app-catalog-header
              title="Formularios"
              [summary]="forms.length + (forms.length === 1 ? ' formulario' : ' formularios')"
            ></app-catalog-header>

            @if (loading) {
              <app-loading-skeleton variant="list" label="Cargando formularios" [rows]="5"></app-loading-skeleton>
            } @else if (!forms.length) {
              <app-status-notice tone="info">
                No hay formularios todavía. Crea el primero y publícalo para usarlo desde pantallas, flows o apps móviles.
              </app-status-notice>
            } @else {
              @for (form of forms; track form.id) {
                <app-catalog-item
                  [title]="form.title"
                  [meta]="form.key + ' · v' + form.version"
                  [detail]="statusLabel(form)"
                  [active]="selected?.id === form.id"
                  (selected)="select(form)"
                ></app-catalog-item>
              }
            }
          </div>

          <div designer-workspace>
            @if (message) {
              <app-status-notice tone="success">{{ message }}</app-status-notice>
            }
            @if (error) {
              <app-status-notice tone="error">{{ error }}</app-status-notice>
            }

            <section class="readiness-card">
              <div class="readiness-copy">
                <span class="pill">Paso actual: {{ guide.stepLabel }}</span>
                <h3>{{ nextAction.title }}</h3>
                <p class="muted">{{ nextAction.description }}</p>
              </div>
              <div class="readiness-metrics" aria-label="Resumen del formulario">
                <span class="pill">{{ draft.steps.length }} {{ draft.steps.length === 1 ? 'paso' : 'pasos' }}</span>
                <span class="pill">{{ totalFields }} {{ totalFields === 1 ? 'campo' : 'campos' }}</span>
                <span class="pill">{{ persistenceLabel }}</span>
                <span class="pill">{{ selected ? 'borrador guardado' : 'sin guardar' }}</span>
              </div>
            </section>

            @if (validationIssues.length) {
              <app-status-notice tone="warning" title="Pendientes antes de publicar">
                <ul class="issue-list">
                  @for (issue of validationIssues; track issue) {
                    <li>{{ issue }}</li>
                  }
                </ul>
              </app-status-notice>
            }

            @if (phase === 'define') {
              <section class="panel">
                <app-section-header
                  stepLabel="Paso 1"
                  title="Define el propósito"
                  description="Empieza por identidad, categoría y persistencia. El JSON se arma automáticamente mientras configuras."
                ></app-section-header>

                <section class="template-grid" aria-label="Plantillas de formulario">
                  @for (template of formTemplates; track template.key) {
                    <button
                      type="button"
                      class="template-card"
                      [class.active]="draft.templateKey === template.key"
                      (click)="applyTemplate(template.key)"
                    >
                      <span class="pill">{{ template.badge }}</span>
                      <strong>{{ template.title }}</strong>
                      <small>{{ template.description }}</small>
                    </button>
                  }
                </section>

                <div class="grid">
                  <app-field-shell label="Key" forId="form-key" [required]="true" help="Identificador técnico estable. Ejemplo: cliente_onboarding.">
                    <input id="form-key" [(ngModel)]="draft.key" [disabled]="!!selected" (ngModelChange)="syncJson()" />
                  </app-field-shell>
                  <app-field-shell label="Título" forId="form-title" [required]="true">
                    <input id="form-title" [(ngModel)]="draft.title" (ngModelChange)="syncJson()" />
                  </app-field-shell>
                  <app-field-shell label="Categoría" forId="form-category">
                    <input id="form-category" [(ngModel)]="draft.category" (ngModelChange)="syncJson()" />
                  </app-field-shell>
                  <app-field-shell label="Texto del botón" forId="form-submit">
                    <input id="form-submit" [(ngModel)]="draft.submitLabel" (ngModelChange)="syncJson()" />
                  </app-field-shell>
                </div>

                <app-field-shell label="Descripción" forId="form-description">
                  <input id="form-description" [(ngModel)]="draft.description" (ngModelChange)="syncJson()" />
                </app-field-shell>

                <app-section-header
                  title="Comportamiento visual"
                  description="Define cómo se adapta el mismo formulario en web y móvil. Puedes cambiarlo sin tocar código."
                ></app-section-header>

                <div class="grid three">
                  <app-field-shell label="Kit visual" forId="form-kit">
                    <select id="form-kit" [(ngModel)]="draft.kit" (ngModelChange)="syncJson()">
                      <option value="auto">Automático</option>
                      <option value="primeng">PrimeNG web</option>
                      <option value="ionic">Ionic móvil</option>
                      <option value="native">Nativo accesible</option>
                    </select>
                  </app-field-shell>
                  <app-field-shell label="Tema" forId="form-theme">
                    <input id="form-theme" [(ngModel)]="draft.theme" (ngModelChange)="syncJson()" />
                  </app-field-shell>
                  <app-field-shell label="Modo" forId="form-theme-mode">
                    <select id="form-theme-mode" [(ngModel)]="draft.themeMode" (ngModelChange)="syncJson()">
                      <option value="system">Sistema</option>
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                    </select>
                  </app-field-shell>
                  <app-field-shell label="Densidad" forId="form-density">
                    <select id="form-density" [(ngModel)]="draft.density" (ngModelChange)="syncJson()">
                      <option value="comfortable">Cómoda</option>
                      <option value="compact">Compacta</option>
                      <option value="spacious">Amplia</option>
                    </select>
                  </app-field-shell>
                  <app-field-shell label="Web" forId="form-desktop-mode">
                    <select id="form-desktop-mode" [(ngModel)]="draft.desktopMode" (ngModelChange)="syncJson()">
                      <option value="step_cards">Pasos como cards</option>
                      <option value="single_form">Formulario continuo</option>
                      <option value="wizard">Wizard</option>
                      <option value="auto">Automático</option>
                    </select>
                  </app-field-shell>
                  <app-field-shell label="Móvil" forId="form-mobile-mode">
                    <select id="form-mobile-mode" [(ngModel)]="draft.mobileMode" (ngModelChange)="syncJson()">
                      <option value="step_screens">Un paso por pantalla</option>
                      <option value="single_scroll">Scroll continuo</option>
                      <option value="auto">Automático</option>
                    </select>
                  </app-field-shell>
                </div>

                <div class="grid">
                  <app-field-shell label="Qué hace al enviar" forId="form-persistence" help="Record es el default seguro para capturar datos. Service o Flow conectan lógica de negocio.">
                    <select id="form-persistence" [(ngModel)]="draft.persistenceMode" (ngModelChange)="syncJson()">
                      <option value="record">Guardar record genérico</option>
                      <option value="service">Ejecutar servicio dinámico</option>
                      <option value="flow">Ejecutar flow</option>
                      <option value="hybrid">Guardar record y orquestar después</option>
                      <option value="none">Solo validar / consultar</option>
                    </select>
                  </app-field-shell>
                  <app-field-shell label="Idempotencia" forId="form-idempotency" help="Evita duplicados en reintentos u offline.">
                    <input id="form-idempotency" [(ngModel)]="draft.idempotencyKey" (ngModelChange)="syncJson()" />
                  </app-field-shell>
                </div>

                <div class="grid three">
                  <label class="toggle-card">
                    <input type="checkbox" [(ngModel)]="draft.offlineEnabled" (ngModelChange)="syncJson()" />
                    <span class="toggle-mark">✓</span>
                    <span class="toggle-copy">
                      <strong>Cola offline</strong>
                      <small>Permite reintentar envíos desde móvil cuando no hay red.</small>
                    </span>
                  </label>
                  <label class="toggle-card">
                    <input type="checkbox" [(ngModel)]="draft.autosave" (ngModelChange)="syncJson()" />
                    <span class="toggle-mark">✓</span>
                    <span class="toggle-copy">
                      <strong>Autosave</strong>
                      <small>Reserva guardado parcial para formularios largos.</small>
                    </span>
                  </label>
                  <app-field-shell label="Timeout ms" forId="form-timeout">
                    <input id="form-timeout" type="number" [(ngModel)]="draft.timeoutMs" (ngModelChange)="syncJson()" />
                  </app-field-shell>
                </div>

                @if (draft.persistenceMode === 'record' || draft.persistenceMode === 'hybrid') {
                  <app-field-shell label="Tipo de record" forId="form-record-type">
                    <input id="form-record-type" [(ngModel)]="draft.recordType" (ngModelChange)="syncJson()" />
                  </app-field-shell>
                }
                @if (draft.persistenceMode === 'service') {
                  <app-field-shell label="Servicio publicado" forId="form-service-key">
                    @if (availableServices.length) {
                      <select id="form-service-key" [(ngModel)]="draft.serviceKey" (ngModelChange)="syncJson()">
                        <option value="">Selecciona un servicio</option>
                        @for (service of availableServices; track service.id) {
                          <option [value]="service.key">{{ service.name }} · v{{ service.version }}</option>
                        }
                      </select>
                    } @else {
                      <input id="form-service-key" [(ngModel)]="draft.serviceKey" (ngModelChange)="syncJson()" />
                    }
                  </app-field-shell>
                }
                @if (draft.persistenceMode === 'flow') {
                  <app-field-shell label="Flow publicado" forId="form-flow-key">
                    @if (availableFlows.length) {
                      <select id="form-flow-key" [(ngModel)]="draft.flowKey" (ngModelChange)="syncJson()">
                        <option value="">Selecciona un flow</option>
                        @for (flow of availableFlows; track flow.id) {
                          <option [value]="flow.key">{{ flow.name }}</option>
                        }
                      </select>
                    } @else {
                      <input id="form-flow-key" [(ngModel)]="draft.flowKey" (ngModelChange)="syncJson()" />
                    }
                  </app-field-shell>
                }
                @if (draft.persistenceMode === 'hybrid') {
                  <div class="grid">
                    <app-field-shell
                      label="Después de guardar"
                      forId="form-hybrid-action"
                      help="El formulario crea primero el record y luego puede ejecutar un servicio o flow con el mismo input."
                    >
                      <select id="form-hybrid-action" [(ngModel)]="draft.hybridActionType" (ngModelChange)="syncJson()">
                        <option value="none">Solo guardar record</option>
                        <option value="execute_service">Ejecutar servicio</option>
                        <option value="execute_flow">Ejecutar flow</option>
                      </select>
                    </app-field-shell>
                    @if (draft.hybridActionType === 'execute_service') {
                      <app-field-shell label="Servicio posterior" forId="form-hybrid-service-key">
                        <select id="form-hybrid-service-key" [(ngModel)]="draft.hybridServiceKey" (ngModelChange)="syncJson()">
                          <option value="">Selecciona un servicio</option>
                          @for (service of availableServices; track service.id) {
                            <option [value]="service.key">{{ service.name }} · v{{ service.version }}</option>
                          }
                        </select>
                      </app-field-shell>
                    }
                    @if (draft.hybridActionType === 'execute_flow') {
                      <app-field-shell label="Flow posterior" forId="form-hybrid-flow-key">
                        <select id="form-hybrid-flow-key" [(ngModel)]="draft.hybridFlowKey" (ngModelChange)="syncJson()">
                          <option value="">Selecciona un flow</option>
                          @for (flow of availableFlows; track flow.id) {
                            <option [value]="flow.key">{{ flow.name }}</option>
                          }
                        </select>
                      </app-field-shell>
                    }
                  </div>
                }

                @if (draft.persistenceMode === 'service' || draft.persistenceMode === 'flow') {
                  <div class="grid">
                    <app-field-shell
                      label="Payload map"
                      forId="form-payload-map"
                      help="Define qué datos recibe el servicio o flow. Puedes usar plantillas tipo input o input.campo dentro del JSON."
                    >
                      <textarea
                        id="form-payload-map"
                        class="compact-json"
                        [(ngModel)]="draft.payloadMapText"
                        (ngModelChange)="syncJson()"
                        spellcheck="false"
                      ></textarea>
                    </app-field-shell>
                    <app-field-shell
                      label="Response map"
                      forId="form-response-map"
                      help="Mapa reservado para normalizar salida. Se usará al completar bindings avanzados."
                    >
                      <textarea
                        id="form-response-map"
                        class="compact-json"
                        [(ngModel)]="draft.responseMapText"
                        (ngModelChange)="syncJson()"
                        spellcheck="false"
                      ></textarea>
                    </app-field-shell>
                  </div>
                }

                <app-section-header
                  title="Botones y acciones extra"
                  description="Agrega comandos que el usuario puede ejecutar sin cambiar el botón principal del formulario."
                >
                  <button type="button" (click)="addCommand()">Agregar botón</button>
                </app-section-header>

                @if (!draft.commands.length) {
                  <app-status-notice tone="info">
                    Sin botones extra. El formulario solo usará el botón principal: {{ draft.submitLabel || 'Enviar' }}.
                  </app-status-notice>
                } @else {
                  <div class="step-list">
                    @for (command of draft.commands; track command.key; let commandIndex = $index) {
                      <section class="step-item">
                        <div class="toolbar">
                          <strong>{{ command.label || command.key }}</strong>
                          <button class="danger" type="button" (click)="removeCommand(commandIndex)">Quitar</button>
                        </div>
                        <div class="grid">
                          <app-field-shell label="Key" [forId]="'command-key-' + commandIndex">
                            <input [id]="'command-key-' + commandIndex" [(ngModel)]="command.key" (ngModelChange)="syncJson()" />
                          </app-field-shell>
                          <app-field-shell label="Texto del botón" [forId]="'command-label-' + commandIndex">
                            <input [id]="'command-label-' + commandIndex" [(ngModel)]="command.label" (ngModelChange)="syncJson()" />
                          </app-field-shell>
                          <app-field-shell label="Acción" [forId]="'command-type-' + commandIndex">
                            <select [id]="'command-type-' + commandIndex" [(ngModel)]="command.type" (ngModelChange)="syncJson()">
                              <option value="execute_service">Ejecutar servicio</option>
                              <option value="execute_flow">Ejecutar flow</option>
                              <option value="show_message">Mostrar mensaje</option>
                            </select>
                          </app-field-shell>
                          <app-field-shell label="Respuesta" [forId]="'command-response-' + commandIndex">
                            <select [id]="'command-response-' + commandIndex" [(ngModel)]="command.responseMode" (ngModelChange)="syncJson()">
                              <option value="show_response">Mostrar respuesta</option>
                              <option value="silent">Silenciosa</option>
                            </select>
                          </app-field-shell>
                        </div>
                        @if (command.type === 'execute_service') {
                          <app-field-shell label="Servicio publicado" [forId]="'command-service-' + commandIndex">
                            <select [id]="'command-service-' + commandIndex" [(ngModel)]="command.serviceKey" (ngModelChange)="syncJson()">
                              <option value="">Selecciona un servicio</option>
                              @for (service of availableServices; track service.id) {
                                <option [value]="service.key">{{ service.name }} · v{{ service.version }}</option>
                              }
                            </select>
                          </app-field-shell>
                        }
                        @if (command.type === 'execute_flow') {
                          <app-field-shell label="Flow publicado" [forId]="'command-flow-' + commandIndex">
                            <select [id]="'command-flow-' + commandIndex" [(ngModel)]="command.flowKey" (ngModelChange)="syncJson()">
                              <option value="">Selecciona un flow</option>
                              @for (flow of availableFlows; track flow.id) {
                                <option [value]="flow.key">{{ flow.name }}</option>
                              }
                            </select>
                          </app-field-shell>
                        }
                        @if (command.type !== 'show_message') {
                          <app-field-shell label="Payload map" [forId]="'command-payload-' + commandIndex">
                            <textarea
                              [id]="'command-payload-' + commandIndex"
                              class="compact-json"
                              [(ngModel)]="command.payloadMapText"
                              (ngModelChange)="syncJson()"
                              spellcheck="false"
                            ></textarea>
                          </app-field-shell>
                        }
                        <div class="grid">
                          <app-field-shell label="Permiso requerido" [forId]="'command-permission-' + commandIndex" help="Opcional. Si el usuario no lo tiene, el botón no aparece.">
                            <input
                              [id]="'command-permission-' + commandIndex"
                              [(ngModel)]="command.requiredPermission"
                              (ngModelChange)="syncJson()"
                              placeholder="forms.submit"
                            />
                          </app-field-shell>
                          <app-field-shell label="Rol requerido" [forId]="'command-role-' + commandIndex">
                            <input
                              [id]="'command-role-' + commandIndex"
                              [(ngModel)]="command.requiredRole"
                              (ngModelChange)="syncJson()"
                              placeholder="operator"
                            />
                          </app-field-shell>
                        </div>
                        <div class="grid">
                          <label class="toggle-card">
                            <input type="checkbox" [(ngModel)]="command.requiresValidForm" (ngModelChange)="syncJson()" />
                            <span class="toggle-mark">✓</span>
                            <span class="toggle-copy">
                              <strong>Requiere formulario válido</strong>
                              <small>Valida obligatorios antes de ejecutar este botón.</small>
                            </span>
                          </label>
                          <app-field-shell label="Confirmación" [forId]="'command-confirm-' + commandIndex" help="Opcional. Pide confirmación antes de ejecutar.">
                            <input
                              [id]="'command-confirm-' + commandIndex"
                              [(ngModel)]="command.confirmMessage"
                              (ngModelChange)="syncJson()"
                              placeholder="¿Ejecutar esta acción?"
                            />
                          </app-field-shell>
                        </div>
                      </section>
                    }
                  </div>
                }
              </section>
            }

            @if (phase === 'fields') {
              <section class="panel">
                <app-section-header
                  stepLabel="Paso 2"
                  title="Organiza pasos y campos"
                  description="En web los pasos pueden verse como secciones; en móvil se comportan como pantallas consecutivas."
                >
                  <button type="button" (click)="addStep()">Agregar paso</button>
                </app-section-header>

                <div class="builder-grid">
                  <div class="step-list">
                    <section class="palette">
                    <app-section-header
                      title="Paleta de campos"
                      description="Agrega controles al paso activo. Luego ajusta sus detalles en el inspector."
                    ></app-section-header>
                      <div class="helper-grid">
                        <button type="button" class="helper-card" (click)="addContactSet(activeStepIndex)">
                          <strong>Agregar datos de contacto</strong>
                          <small>Nombre, email y teléfono en el paso activo.</small>
                        </button>
                        <button type="button" class="helper-card" (click)="addAddressSet(activeStepIndex)">
                          <strong>Agregar dirección</strong>
                          <small>Ciudad, dirección y observaciones.</small>
                        </button>
                        <button type="button" class="helper-card" (click)="addApprovalSet(activeStepIndex)">
                          <strong>Agregar decisión</strong>
                          <small>Estado, comentarios y fecha.</small>
                        </button>
                        <button type="button" class="helper-card" (click)="addEvidenceSet(activeStepIndex)">
                          <strong>Agregar evidencias</strong>
                          <small>Foto, archivo y ubicación GPS.</small>
                        </button>
                      </div>
                      <div class="palette-grid">
                        @for (item of fieldPalette; track item.type) {
                          <button type="button" (click)="addFieldFromPalette(activeStepIndex, item)">
                            <strong>{{ item.label }}</strong>
                            <small>{{ item.description }}</small>
                          </button>
                        }
                      </div>
                    </section>

                    @for (step of draft.steps; track step.key; let stepIndex = $index) {
                      <article class="step-item" [class.active]="activeStepIndex === stepIndex">
                        <div class="toolbar">
                          <button type="button" (click)="selectStep(stepIndex)">Editar {{ step.title || step.key }}</button>
                          <div class="inline-actions">
                            <span class="pill">{{ step.fields.length }} campos</span>
                            <button class="danger" type="button" (click)="removeStep(stepIndex)" [disabled]="draft.steps.length === 1">
                              Quitar paso
                            </button>
                          </div>
                        </div>

                        @if (activeStepIndex === stepIndex) {
                          <div class="grid">
                            <app-field-shell label="Key del paso" [forId]="'step-key-' + stepIndex">
                              <input [id]="'step-key-' + stepIndex" [(ngModel)]="step.key" (ngModelChange)="syncJson()" />
                            </app-field-shell>
                            <app-field-shell label="Título del paso" [forId]="'step-title-' + stepIndex">
                              <input [id]="'step-title-' + stepIndex" [(ngModel)]="step.title" (ngModelChange)="syncJson()" />
                            </app-field-shell>
                          </div>
                          <app-field-shell label="Descripción del paso" [forId]="'step-description-' + stepIndex">
                            <input [id]="'step-description-' + stepIndex" [(ngModel)]="step.description" (ngModelChange)="syncJson()" />
                          </app-field-shell>

                          <div class="field-list">
                            @for (field of step.fields; track field.key; let fieldIndex = $index) {
                              <article
                                class="field-item"
                                [class.selected]="activeStepIndex === stepIndex && activeFieldIndex === fieldIndex"
                              >
                                <div class="toolbar">
                                  <button type="button" (click)="selectField(stepIndex, fieldIndex)">
                                    {{ field.label || field.key }}
                                  </button>
                                  <div class="field-actions">
                                    <span class="pill">{{ field.type }} · {{ field.layout }}</span>
                                    <button type="button" (click)="moveField(stepIndex, fieldIndex, -1)" [disabled]="fieldIndex === 0">Subir</button>
                                    <button
                                      type="button"
                                      (click)="moveField(stepIndex, fieldIndex, 1)"
                                      [disabled]="fieldIndex === step.fields.length - 1"
                                    >
                                      Bajar
                                    </button>
                                    <button type="button" (click)="duplicateField(stepIndex, fieldIndex)">Duplicar</button>
                                    <button class="danger" type="button" (click)="removeField(stepIndex, fieldIndex)">Quitar</button>
                                  </div>
                                </div>
                                <p class="muted">{{ field.key }} · {{ field.required ? 'obligatorio' : 'opcional' }}</p>
                              </article>
                            }
                          </div>
                          <button type="button" (click)="addField(stepIndex)">Agregar campo básico</button>
                        }
                      </article>
                    }
                  </div>

                  <aside class="inspector">
                    <app-section-header
                      title="Inspector"
                      [description]="selectedField ? 'Edita el campo seleccionado sin buscarlo en la lista.' : 'Selecciona un campo para editar propiedades.'"
                    ></app-section-header>

                    @if (selectedField) {
                      <section class="field-preview">
                        <span class="pill">{{ selectedField.type }} · {{ selectedField.layout }}</span>
                        <strong>{{ selectedField.label || selectedField.key }}</strong>
                        <small>{{ selectedField.required ? 'Obligatorio' : 'Opcional' }} · {{ selectedField.key }}</small>
                      </section>
                      <app-field-shell label="Key" forId="selected-field-key">
                        <input id="selected-field-key" [(ngModel)]="selectedField.key" (ngModelChange)="syncJson()" />
                      </app-field-shell>
                      <app-field-shell label="Etiqueta" forId="selected-field-label">
                        <input id="selected-field-label" [(ngModel)]="selectedField.label" (ngModelChange)="syncJson()" />
                      </app-field-shell>
                      <app-field-shell label="Tipo" forId="selected-field-type">
                        <select id="selected-field-type" [(ngModel)]="selectedField.type" (ngModelChange)="syncJson()">
                          <option value="text">Texto</option>
                          <option value="email">Email</option>
                          <option value="number">Número</option>
                          <option value="currency">Moneda</option>
                          <option value="tel">Teléfono</option>
                          <option value="url">URL</option>
                          <option value="password">Password</option>
                          <option value="textarea">Textarea</option>
                          <option value="select">Select</option>
                          <option value="radio">Opciones radio</option>
                          <option value="checkbox">Check</option>
                          <option value="toggle">Switch</option>
                          <option value="date">Fecha</option>
                          <option value="time">Hora</option>
                          <option value="datetime">Fecha y hora</option>
                          <option value="file">Archivo</option>
                          <option value="image">Imagen</option>
                          <option value="gps">GPS</option>
                        </select>
                      </app-field-shell>
                      <app-field-shell label="Layout" forId="selected-field-layout">
                        <select id="selected-field-layout" [(ngModel)]="selectedField.layout" (ngModelChange)="syncJson()">
                          <option value="full">Completo</option>
                          <option value="half">Mitad</option>
                          <option value="third">Tercio</option>
                        </select>
                      </app-field-shell>
                      <label class="toggle-card">
                        <input type="checkbox" [(ngModel)]="selectedField.required" (ngModelChange)="syncJson()" />
                        <span class="toggle-mark">✓</span>
                        <span class="toggle-copy">
                          <strong>Campo obligatorio</strong>
                          <small>El usuario no podrá avanzar si lo deja vacío.</small>
                        </span>
                      </label>
                      <app-field-shell label="Placeholder" forId="selected-field-placeholder">
                        <input id="selected-field-placeholder" [(ngModel)]="selectedField.placeholder" (ngModelChange)="syncJson()" />
                      </app-field-shell>
                      <app-field-shell label="Ayuda" forId="selected-field-help">
                        <input id="selected-field-help" [(ngModel)]="selectedField.help" (ngModelChange)="syncJson()" />
                      </app-field-shell>
                      <app-field-shell label="Valor por defecto" forId="selected-field-default">
                        <input id="selected-field-default" [(ngModel)]="selectedField.defaultValue" (ngModelChange)="syncJson()" />
                      </app-field-shell>

                      @if (
                        selectedField.type === 'text' ||
                        selectedField.type === 'email' ||
                        selectedField.type === 'textarea' ||
                        selectedField.type === 'tel' ||
                        selectedField.type === 'url' ||
                        selectedField.type === 'password'
                      ) {
                        <div class="grid">
                          <app-field-shell label="Mín. caracteres" forId="selected-field-min-length">
                            <input id="selected-field-min-length" type="number" [(ngModel)]="selectedField.minLength" (ngModelChange)="syncJson()" />
                          </app-field-shell>
                          <app-field-shell label="Máx. caracteres" forId="selected-field-max-length">
                            <input id="selected-field-max-length" type="number" [(ngModel)]="selectedField.maxLength" (ngModelChange)="syncJson()" />
                          </app-field-shell>
                        </div>
                      }

                      @if (selectedField.type === 'number' || selectedField.type === 'currency') {
                        <div class="grid">
                          <app-field-shell label="Mínimo" forId="selected-field-min">
                            <input id="selected-field-min" type="number" [(ngModel)]="selectedField.min" (ngModelChange)="syncJson()" />
                          </app-field-shell>
                          <app-field-shell label="Máximo" forId="selected-field-max">
                            <input id="selected-field-max" type="number" [(ngModel)]="selectedField.max" (ngModelChange)="syncJson()" />
                          </app-field-shell>
                        </div>
                      }

                      @if (selectedField.type === 'select' || selectedField.type === 'radio') {
                        <app-section-header
                          title="Opciones"
                          description="Usa opciones fijas o conecta un servicio publicado para cargarlas."
                        >
                          <button type="button" (click)="addOption(selectedField)">Agregar opción</button>
                        </app-section-header>
                        @for (option of selectedField.options; track $index; let optionIndex = $index) {
                          <div class="option-row">
                            <app-field-shell label="Texto" [forId]="'option-label-' + optionIndex">
                              <input [id]="'option-label-' + optionIndex" [(ngModel)]="option.label" (ngModelChange)="syncJson()" />
                            </app-field-shell>
                            <app-field-shell label="Valor" [forId]="'option-value-' + optionIndex">
                              <input [id]="'option-value-' + optionIndex" [(ngModel)]="option.value" (ngModelChange)="syncJson()" />
                            </app-field-shell>
                            <button class="danger" type="button" (click)="removeOption(selectedField, optionIndex)">Quitar</button>
                          </div>
                        }
                        <app-field-shell label="Servicio para opciones" forId="selected-field-data-source">
                          <select id="selected-field-data-source" [(ngModel)]="selectedField.dataSourceServiceKey" (ngModelChange)="syncJson()">
                            <option value="">Sin servicio</option>
                            @for (service of availableServices; track service.id) {
                              <option [value]="service.key">{{ service.name }} · v{{ service.version }}</option>
                            }
                          </select>
                        </app-field-shell>
                      }

                      <app-field-shell label="Servicio para validar" forId="selected-field-validation-service">
                        <select id="selected-field-validation-service" [(ngModel)]="selectedField.validationServiceKey" (ngModelChange)="syncJson()">
                          <option value="">Sin validación remota</option>
                          @for (service of availableServices; track service.id) {
                            <option [value]="service.key">{{ service.name }} · v{{ service.version }}</option>
                          }
                        </select>
                      </app-field-shell>

                      <app-section-header
                        title="Condición visual"
                        description="Muestra este campo solo cuando otro campo cumpla una condición."
                      ></app-section-header>
                      <app-field-shell label="Depende de" forId="selected-field-visible-field">
                        <select id="selected-field-visible-field" [(ngModel)]="selectedField.visibleWhenField" (ngModelChange)="syncJson()">
                          <option value="">Siempre visible</option>
                          @for (key of conditionFieldKeys; track key) {
                            <option [value]="key">{{ key }}</option>
                          }
                        </select>
                      </app-field-shell>
                      @if (selectedField.visibleWhenField) {
                        <div class="grid">
                          <app-field-shell label="Operador" forId="selected-field-visible-operator">
                            <select id="selected-field-visible-operator" [(ngModel)]="selectedField.visibleWhenOperator" (ngModelChange)="syncJson()">
                              <option value="equals">Igual a</option>
                              <option value="not_equals">Distinto de</option>
                              <option value="truthy">Tiene valor / verdadero</option>
                              <option value="falsy">Vacío / falso</option>
                              <option value="contains">Contiene</option>
                            </select>
                          </app-field-shell>
                          <app-field-shell label="Valor" forId="selected-field-visible-value">
                            <input id="selected-field-visible-value" [(ngModel)]="selectedField.visibleWhenValue" (ngModelChange)="syncJson()" />
                          </app-field-shell>
                        </div>
                      }
                      <app-section-header
                        title="Acceso del campo"
                        description="Permite ocultar o dejar en solo lectura un campo según rol o permiso."
                      ></app-section-header>
                      <div class="grid">
                        <app-field-shell label="Permiso para ver" forId="selected-field-permission">
                          <input
                            id="selected-field-permission"
                            [(ngModel)]="selectedField.requiredPermission"
                            (ngModelChange)="syncJson()"
                            placeholder="forms.read_sensitive"
                          />
                        </app-field-shell>
                        <app-field-shell label="Rol para ver" forId="selected-field-role">
                          <input
                            id="selected-field-role"
                            [(ngModel)]="selectedField.requiredRole"
                            (ngModelChange)="syncJson()"
                            placeholder="admin"
                          />
                        </app-field-shell>
                        <app-field-shell label="Permiso para editar" forId="selected-field-readonly-permission">
                          <input
                            id="selected-field-readonly-permission"
                            [(ngModel)]="selectedField.readonlyPermission"
                            (ngModelChange)="syncJson()"
                            placeholder="forms.edit_sensitive"
                          />
                        </app-field-shell>
                      </div>
                    } @else {
                      <app-status-notice tone="info">
                        Agrega un campo desde la paleta o selecciona uno existente para editarlo aquí.
                      </app-status-notice>
                    }
                  </aside>
                </div>
              </section>
            }

            @if (phase === 'publish') {
              <section class="panel">
                <app-section-header
                  stepLabel="Paso 4"
                  title="Guardar, versionar y publicar"
                  description="Guardar mantiene el borrador editable. Crear versión congela una receta. Publicar la deja disponible para el runtime y el front."
                ></app-section-header>

                <div class="checklist-grid">
                  @for (item of publishChecklist; track item.label) {
                    <section class="checklist-card" [class.ready]="item.ready">
                      <span class="status-chip" [class.ready]="item.ready">
                        <span class="status-dot"></span>
                        {{ item.ready ? 'Listo' : 'Pendiente' }}
                      </span>
                      <strong>{{ item.label }}</strong>
                      <small>{{ item.description }}</small>
                    </section>
                  }
                </div>

                <div class="inline-actions">
                  <button class="primary" type="button" (click)="save()" [disabled]="saving || !canSave">Guardar borrador</button>
                  <button type="button" (click)="createVersion()" [disabled]="!selected || saving || !canCreateVersion">Crear versión</button>
                  <button type="button" (click)="publishLatest()" [disabled]="!latestVersion || saving || !canPublish">Publicar última versión</button>
                </div>
                <app-status-notice tone="info">
                  Orden recomendado: guardar borrador, revisar preview, crear versión y publicar. Si editas después, vuelve a crear otra versión.
                </app-status-notice>
              </section>
            }

            @if (phase === 'preview') {
              <section class="preview-panel">
                <app-section-header
                  stepLabel="Paso 5"
                  title="Preview responsive"
                  description="Valida cómo se verá la misma definición en escritorio, tablet y móvil antes de publicarla."
                ></app-section-header>
                <div class="preview-workbench">
                  <div class="preview-contract" aria-label="Contrato de integración del preview">
                    <section class="preview-contract-card">
                      <strong>Entrada</strong>
                      <small>{{ previewSubmitEndpoint }}</small>
                    </section>
                    <section class="preview-contract-card">
                      <strong>Layout activo</strong>
                      <small>{{ previewLayoutLabel }}</small>
                    </section>
                    <section class="preview-contract-card">
                      <strong>Salida</strong>
                      <small>{{ previewPersistenceDetail }}</small>
                    </section>
                  </div>

                  <app-preview-viewport [(mode)]="previewMode">
                    @if (previewForm) {
                      <section class="preview-form-shell">
                        <header class="preview-form-header">
                          <div class="preview-form-title">
                            <span class="pill">{{ previewDeviceLabel }}</span>
                            <h2>{{ previewForm.title }}</h2>
                            <p>{{ draft.description || 'Formulario sin descripción todavía.' }}</p>
                          </div>
                          <div class="preview-form-meta" aria-label="Metadatos visuales">
                            <span class="pill">{{ draft.kit }}</span>
                            <span class="pill">{{ draft.theme }}</span>
                            <span class="pill">{{ draft.density }}</span>
                          </div>
                        </header>
                        <app-formly-runtime
                          [definition]="previewForm"
                          [model]="previewModel"
                          [presentation]="previewPresentation"
                          [viewportWidth]="previewWidth"
                          submitLabel="Validar preview"
                          (modelChange)="previewModel = $event"
                        ></app-formly-runtime>
                      </section>
                    } @else {
                      <app-status-notice tone="warning">
                        Agrega campos para construir una vista previa real.
                      </app-status-notice>
                    }
                  </app-preview-viewport>
                </div>

                <section class="test-panel">
                  <app-section-header
                    stepLabel="Prueba real"
                    title="Ejecuta el submit contra backend"
                    description="Guarda el borrador, prepara datos de ejemplo y ejecuta el runtime seguro del formulario."
                  >
                    <button type="button" (click)="usePreviewAsFixture()">Usar datos del preview</button>
                    <button type="button" (click)="generateExampleFixture()">Generar ejemplo</button>
                    <button class="primary" type="button" (click)="runSubmitTest()" [disabled]="testing || !selected">
                      Probar submit
                    </button>
                  </app-section-header>

                  @if (!selected) {
                    <app-status-notice tone="warning">
                      Primero guarda el formulario para obtener una key real y poder ejecutar el endpoint.
                    </app-status-notice>
                  }

                  <div class="test-grid">
                    <app-field-shell label="Input de prueba" forId="submit-test-input" help="Este JSON se envía como input al runtime.">
                      <textarea id="submit-test-input" [(ngModel)]="submitTestInputText" spellcheck="false"></textarea>
                    </app-field-shell>
                    <div>
                      <app-field-shell label="Última respuesta" forId="submit-test-output">
                        <pre id="submit-test-output" class="test-output">{{ submitTestOutputText || 'Sin ejecución todavía.' }}</pre>
                      </app-field-shell>
                      @if (submitTestError) {
                        <app-status-notice tone="error">{{ submitTestError }}</app-status-notice>
                      }
                      @if (submitTestMessage) {
                        <app-status-notice tone="success">{{ submitTestMessage }}</app-status-notice>
                      }
                    </div>
                  </div>
                </section>
              </section>
            }

            <app-json-authoring-panel
              artifactLabel="Formulario"
              title="Contrato JSON editable"
              description="Puedes trabajar solo desde este JSON y guardar/publicar sin usar la guía visual. El asistente de IA usará este mismo contrato."
              stepLabel="Authoring JSON"
              endpoint="/api/forms/authoring/json"
              [value]="jsonText"
              [error]="jsonAuthoringError"
              [ready]="jsonAuthoringReady"
              [isBusy]="saving"
              [draftDisabled]="saving"
              [publishDisabled]="saving"
              (valueChange)="jsonText = $event; onJsonEdited()"
              (resetJson)="syncJson()"
              (applyJson)="applyJson()"
              (saveDraft)="saveJsonOnly(false)"
              (saveAndPublish)="saveJsonOnly(true)"
            ></app-json-authoring-panel>
          </div>
        </app-designer-workspace>
      </div>
    </app-page-shell>
  `
})
export class FormsPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly runtime = inject(FormRuntimeService);
  private readonly serviceClient = inject(DynamicServiceClientService);
  private readonly flowClient = inject(DynamicFlowClientService);

  forms: DynamicFormItem[] = [];
  availableServices: AvailableDynamicService[] = [];
  availableFlows: AvailableDynamicFlow[] = [];
  selected?: DynamicFormItem;
  latestVersion?: DynamicFormVersion;
  loading = true;
  saving = false;
  message = '';
  error = '';
  jsonError = '';
  phase: DesignerPhase = 'define';
  activeStepIndex = 0;
  activeFieldIndex = 0;
  previewMode: PreviewViewportMode = 'desktop';
  previewForm?: RuntimeForm;
  previewModel: Record<string, unknown> = {};
  submitTestInputText = '{}';
  submitTestOutputText = '';
  submitTestMessage = '';
  submitTestError = '';
  testing = false;
  submitTestPassed = false;
  jsonText = '';
  draft: FormDraft = this.blankDraft();
  previewPresentation: UiPresentationConfig = this.buildPreviewPresentation();
  readonly fieldPalette = FIELD_PALETTE;
  readonly formTemplates = FORM_TEMPLATES;

  readonly processItems: ProcessStepItem[] = [
    { key: 'define', label: 'Definir', summary: 'Identidad y salida' },
    { key: 'fields', label: 'Campos', summary: 'Pasos y controles' },
    { key: 'publish', label: 'Publicar', summary: 'Versión estable' },
    { key: 'preview', label: 'Preview', summary: 'Web y móvil' }
  ];

  get guide() {
    const states: Record<DesignerPhase, { stepLabel: string; title: string; description: string; tone: 'info' | 'success' | 'warning' }> = {
      define: {
        stepLabel: 'Inicio',
        title: 'Describe qué necesita capturar este formulario',
        description: 'Primero define propósito, persistencia y botón final. Después agregas pasos y campos.',
        tone: 'info'
      },
      fields: {
        stepLabel: 'Construcción',
        title: 'Agrupa los campos en pasos claros',
        description: 'Cada paso será una sección cómoda en web y una pantalla guiada en móvil.',
        tone: 'info'
      },
      publish: {
        stepLabel: 'Ciclo de vida',
        title: 'No publiques sin congelar una versión',
        description: 'Puedes guardar desde la guía visual o solo desde el JSON. Publicar expone una versión estable para el runtime.',
        tone: 'warning'
      },
      preview: {
        stepLabel: 'Validación visual',
        title: 'Prueba antes de entregar',
        description: 'El preview usa el mismo renderer de producción, así evitamos sorpresas al publicar.',
        tone: 'success'
      }
    };
    return states[this.phase];
  }

  get totalFields() {
    return this.draft.steps.reduce((count, step) => count + step.fields.length, 0);
  }

  get persistenceLabel() {
    const labels: Record<PersistenceMode, string> = {
      record: 'guarda record',
      service: 'usa servicio',
      flow: 'usa flow',
      hybrid: 'record + orquestación',
      none: 'sin persistencia'
    };
    return labels[this.draft.persistenceMode];
  }

  get nextAction() {
    if (!this.draft.key || !this.draft.title) {
      return {
        title: 'Completa la identidad del formulario',
        description: 'Define una key estable y un título claro antes de agregar campos o publicar.'
      };
    }

    if (!this.totalFields) {
      return {
        title: 'Agrega al menos un campo',
        description: 'Ve a Campos, selecciona un control de la paleta y ajústalo desde el inspector.'
      };
    }

    if (!this.selected) {
      return {
        title: 'Guarda el borrador para poder probar',
        description: 'El diseñador ya generó el contrato; guarda para crear la key real en backend.'
      };
    }

    if (!this.latestVersion) {
      return {
        title: 'Crea una versión estable',
        description: 'Cuando el preview se vea bien, congela una versión antes de publicarla.'
      };
    }

    if (!this.selected.published) {
      return {
        title: 'Publica la versión cuando esté validada',
        description: 'Publicar habilita el formulario para runtime, pantallas dinámicas, servicios y móvil.'
      };
    }

    return {
      title: 'Formulario publicado y listo para consumir',
      description: 'Puedes probar el submit real, usarlo desde pantallas dinámicas o crear una nueva versión si cambias algo.'
    };
  }

  get nextPhase(): DesignerPhase | null {
    const order: DesignerPhase[] = ['define', 'fields', 'preview', 'publish'];
    const index = order.indexOf(this.phase);
    return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
  }

  get validationIssues() {
    const issues: string[] = [];
    const jsonIssues = this.jsonContractIssues();
    if (jsonIssues.length) {
      return jsonIssues;
    }
    if (!this.normalizeKey(this.draft.key)) {
      issues.push('Define una key técnica válida para el formulario.');
    }
    if (!this.draft.title.trim()) {
      issues.push('Define un título claro para que usuarios y menús lo puedan reconocer.');
    }
    if (!this.draft.steps.length) {
      issues.push('Agrega al menos un paso.');
    }
    if (!this.totalFields) {
      issues.push('Agrega al menos un campo.');
    }

    const stepKeys = new Set<string>();
    const fieldKeys = new Set<string>();
    for (const step of this.draft.steps) {
      const stepKey = this.normalizeKey(step.key);
      if (!stepKey || stepKeys.has(stepKey)) {
        issues.push(`El paso "${step.title || step.key}" necesita una key única.`);
      }
      stepKeys.add(stepKey);
      for (const field of step.fields) {
        const fieldKey = this.normalizeKey(field.key);
        if (!fieldKey || fieldKeys.has(fieldKey)) {
          issues.push(`El campo "${field.label || field.key}" necesita una key única en el formulario.`);
        }
        fieldKeys.add(fieldKey);
        if (!field.label.trim()) {
          issues.push(`El campo "${field.key}" necesita una etiqueta visible.`);
        }
        if (field.type === 'select' && !field.options.length && !field.dataSourceServiceKey) {
          issues.push(`La lista "${field.label || field.key}" necesita opciones fijas o un servicio de opciones.`);
        }
      }
    }

    if (this.draft.persistenceMode === 'service' && !this.draft.serviceKey) {
      issues.push('Selecciona el servicio publicado que se ejecutará al enviar.');
    }
    if (this.draft.persistenceMode === 'flow' && !this.draft.flowKey) {
      issues.push('Selecciona el flow publicado que se ejecutará al enviar.');
    }
    if ((this.draft.persistenceMode === 'record' || this.draft.persistenceMode === 'hybrid') && !this.draft.recordType.trim()) {
      issues.push('Define el tipo de record donde se guardarán los datos.');
    }
    if (this.draft.persistenceMode === 'hybrid' && this.draft.hybridActionType === 'execute_service' && !this.draft.hybridServiceKey) {
      issues.push('Selecciona el servicio posterior del modo híbrido o cambia a solo guardar record.');
    }
    if (this.draft.persistenceMode === 'hybrid' && this.draft.hybridActionType === 'execute_flow' && !this.draft.hybridFlowKey) {
      issues.push('Selecciona el flow posterior del modo híbrido o cambia a solo guardar record.');
    }
    if (!this.isJsonObject(this.draft.payloadMapText)) {
      issues.push('Payload map debe ser un JSON objeto válido.');
    }
    if (!this.isJsonObject(this.draft.responseMapText)) {
      issues.push('Response map debe ser un JSON objeto válido.');
    }
    if (this.jsonError) {
      issues.push('Corrige el contrato JSON antes de guardar o publicar.');
    }
    return [...new Set(issues)].slice(0, 8);
  }

  get publishChecklist() {
    return [
      {
        label: 'Identidad',
        ready: Boolean(this.normalizeKey(this.draft.key) && this.draft.title.trim()),
        description: 'Key y título están listos.'
      },
      {
        label: 'Campos',
        ready: this.totalFields > 0 && !this.validationIssues.some((issue) => issue.includes('campo') || issue.includes('lista')),
        description: `${this.totalFields} campos configurados.`
      },
      {
        label: 'Destino',
        ready: !this.validationIssues.some((issue) => issue.includes('servicio') || issue.includes('flow') || issue.includes('record')),
        description: this.persistenceLabel
      },
      {
        label: 'Borrador',
        ready: Boolean(this.selected),
        description: this.selected ? 'Existe en backend.' : 'Guarda para crear la key real.'
      },
      {
        label: 'Versión',
        ready: Boolean(this.latestVersion),
        description: this.latestVersion ? `v${this.latestVersion.version} creada.` : 'Crea una versión antes de publicar.'
      },
      {
        label: 'Prueba',
        ready: this.submitTestPassed,
        description: this.submitTestPassed ? 'Submit validado contra backend.' : 'Ejecuta una prueba exitosa antes de publicar.'
      }
    ];
  }

  get canSave() {
    return this.jsonContractIssues().length === 0;
  }

  get canCreateVersion() {
    return this.canSave && Boolean(this.selected) && !this.validationIssues.length;
  }

  get canPublish() {
    return this.canCreateVersion && Boolean(this.latestVersion) && this.submitTestPassed;
  }

  get previewWidth() {
    return {
      desktop: 1280,
      tablet: 760,
      mobile: 390
    }[this.previewMode];
  }

  get previewDeviceLabel() {
    return {
      desktop: 'Web escritorio',
      tablet: 'Tablet',
      mobile: 'Móvil'
    }[this.previewMode];
  }

  get previewSubmitEndpoint() {
    const key = this.selected?.key || this.normalizeKey(this.draft.key) || 'form_key';
    return `POST /api/forms/by-key/${key}/submit`;
  }

  get previewLayoutLabel() {
    const desktopLabels: Record<DesktopLayoutMode, string> = {
      step_cards: 'Web: pasos como cards',
      single_form: 'Web: formulario continuo',
      wizard: 'Web: wizard por pasos',
      auto: 'Web: automático'
    };
    const mobileLabels: Record<MobileLayoutMode, string> = {
      step_screens: 'Móvil: pantallas por paso',
      single_scroll: 'Móvil: scroll continuo',
      auto: 'Móvil: automático'
    };
    if (this.previewMode === 'mobile') {
      return mobileLabels[this.draft.mobileMode];
    }
    if (this.previewMode === 'tablet') {
      return `${desktopLabels[this.draft.desktopMode]} adaptado a tablet`;
    }
    return desktopLabels[this.draft.desktopMode];
  }

  get previewPersistenceDetail() {
    const details: Record<PersistenceMode, string> = {
      record: `Crea record tipo ${this.draft.recordType || 'dynamic_form'}.`,
      service: `Ejecuta servicio ${this.draft.serviceKey || 'pendiente de seleccionar'}.`,
      flow: `Dispara flow ${this.draft.flowKey || 'pendiente de seleccionar'}.`,
      hybrid: 'Guarda record y luego ejecuta orquestación.',
      none: 'Solo devuelve payload validado al componente.'
    };
    return details[this.draft.persistenceMode];
  }

  ngOnInit() {
    this.syncJson();
    this.loadDynamicTargets();
    this.refresh();
  }

  get selectedField() {
    return this.draft.steps[this.activeStepIndex]?.fields[this.activeFieldIndex];
  }

  get conditionFieldKeys() {
    const currentKey = this.selectedField?.key;
    return this.draft.steps
      .flatMap((step) => step.fields)
      .map((field) => this.normalizeKey(field.key))
      .filter((key) => key && key !== this.normalizeKey(currentKey ?? ''));
  }

  refresh() {
    this.loading = true;
    this.api.get<DynamicFormItem[]>('forms').subscribe({
      next: (forms) => {
        this.forms = forms;
        this.loading = false;
        if (this.selected) {
          const fresh = forms.find((form) => form.id === this.selected?.id);
          if (fresh) {
            this.select(fresh);
          }
        } else if (forms.length) {
          this.select(forms[0]);
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar los formularios.';
      }
    });
  }

  setPhase(phase: string) {
    this.phase = phase as DesignerPhase;
    if (this.phase === 'preview') {
      this.rebuildPreview();
    }
  }

  goNext() {
    if (this.nextPhase) {
      this.setPhase(this.nextPhase);
    }
  }

  newForm() {
    this.selected = undefined;
    this.latestVersion = undefined;
    this.draft = this.blankDraft();
    this.activeStepIndex = 0;
    this.activeFieldIndex = 0;
    this.message = '';
    this.error = '';
    this.submitTestOutputText = '';
    this.submitTestMessage = '';
    this.submitTestError = '';
    this.submitTestPassed = false;
    this.phase = 'define';
    this.syncJson();
  }

  applyTemplate(templateKey: FormTemplate['key']) {
    const currentKey = this.draft.key;
    const currentTitle = this.draft.title;
    const keepIdentity = Boolean(currentKey && currentTitle && this.totalFields > 0);
    const base = this.templateDraft(templateKey);
    this.draft = {
      ...base,
      key: keepIdentity ? currentKey : base.key,
      title: keepIdentity ? currentTitle : base.title
    };
    this.activeStepIndex = 0;
    this.activeFieldIndex = 0;
    this.syncJson();
  }

  select(form: DynamicFormItem) {
    this.selected = form;
    this.latestVersion = undefined;
    this.draft = this.draftFromSchema(form);
    this.activeStepIndex = 0;
    this.activeFieldIndex = 0;
    this.message = '';
    this.error = '';
    this.submitTestOutputText = '';
    this.submitTestMessage = '';
    this.submitTestError = '';
    this.submitTestPassed = false;
    this.syncJson();
  }

  addStep() {
    this.draft.steps.push({
      key: `paso_${this.draft.steps.length + 1}`,
      title: `Paso ${this.draft.steps.length + 1}`,
      description: '',
      fields: []
    });
    this.activeStepIndex = this.draft.steps.length - 1;
    this.activeFieldIndex = 0;
    this.syncJson();
  }

  removeStep(index: number) {
    if (this.draft.steps.length === 1) {
      return;
    }
    this.draft.steps.splice(index, 1);
    this.activeStepIndex = Math.max(0, Math.min(this.activeStepIndex, this.draft.steps.length - 1));
    this.activeFieldIndex = 0;
    this.syncJson();
  }

  addField(stepIndex: number) {
    const count = this.draft.steps[stepIndex].fields.length + 1;
    this.draft.steps[stepIndex].fields.push({
      ...this.cloneField(DEFAULT_FIELD),
      key: `campo_${count}`,
      label: `Campo ${count}`,
      placeholder: ''
    });
    this.selectField(stepIndex, this.draft.steps[stepIndex].fields.length - 1);
    this.syncJson();
  }

  addFieldFromPalette(
    stepIndex: number,
    item: { type: FieldType; label: string; defaults?: Partial<FieldDraft> }
  ) {
    const count = this.draft.steps[stepIndex].fields.length + 1;
    const key = this.normalizeKey(`${item.type}_${count}`);
    this.draft.steps[stepIndex].fields.push({
      ...this.cloneField(DEFAULT_FIELD),
      ...(item.defaults ?? {}),
      options: (item.defaults?.options ?? []).map((option) => ({ ...option })),
      key,
      label: item.label,
      type: item.type,
      placeholder: item.type === 'select' || item.type === 'checkbox' ? '' : item.label
    });
    this.selectField(stepIndex, this.draft.steps[stepIndex].fields.length - 1);
    this.syncJson();
  }

  addContactSet(stepIndex: number) {
    this.addFields(stepIndex, [
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre completo', layout: 'half' },
      { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'persona@empresa.com', layout: 'half' },
      { key: 'telefono', label: 'Teléfono', type: 'tel', required: false, placeholder: '+57 300 000 0000', layout: 'half' }
    ]);
  }

  addAddressSet(stepIndex: number) {
    this.addFields(stepIndex, [
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true, placeholder: 'Ciudad', layout: 'half' },
      { key: 'direccion', label: 'Dirección', type: 'text', required: true, placeholder: 'Dirección completa', layout: 'half' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', required: false, placeholder: 'Notas adicionales', layout: 'full' }
    ]);
  }

  addApprovalSet(stepIndex: number) {
    this.addFields(stepIndex, [
      {
        key: 'decision',
        label: 'Decisión',
        type: 'select',
        required: true,
        layout: 'half',
        options: [
          { label: 'Aprobar', value: 'approved' },
          { label: 'Rechazar', value: 'rejected' },
          { label: 'Solicitar ajuste', value: 'needs_changes' }
        ]
      },
      { key: 'comentarios', label: 'Comentarios', type: 'textarea', required: false, placeholder: 'Explica la decisión', layout: 'full' },
      { key: 'fecha_decision', label: 'Fecha de decisión', type: 'date', required: true, layout: 'half' }
    ]);
  }

  addEvidenceSet(stepIndex: number) {
    this.addFields(stepIndex, [
      { key: 'foto', label: 'Foto', type: 'image', required: false, layout: 'full', help: 'Captura o adjunta una imagen como evidencia.' },
      { key: 'archivo', label: 'Archivo adjunto', type: 'file', required: false, layout: 'full', help: 'Adjunta un documento o soporte.' },
      { key: 'ubicacion', label: 'Ubicación GPS', type: 'gps', required: false, layout: 'full', help: 'Captura coordenadas cuando el dispositivo lo permita.' }
    ]);
  }

  duplicateField(stepIndex: number, fieldIndex: number) {
    const fields = this.draft.steps[stepIndex].fields;
    const source = fields[fieldIndex];
    const copy = this.cloneField(source);
    copy.key = this.nextFieldKey(source.key || source.type, fields);
    copy.label = `${source.label || source.key} copia`;
    fields.splice(fieldIndex + 1, 0, copy);
    this.selectField(stepIndex, fieldIndex + 1);
    this.syncJson();
  }

  removeField(stepIndex: number, fieldIndex: number) {
    this.draft.steps[stepIndex].fields.splice(fieldIndex, 1);
    this.activeFieldIndex = Math.max(0, Math.min(this.activeFieldIndex, this.draft.steps[stepIndex].fields.length - 1));
    this.syncJson();
  }

  selectStep(stepIndex: number) {
    this.activeStepIndex = stepIndex;
    this.activeFieldIndex = 0;
  }

  selectField(stepIndex: number, fieldIndex: number) {
    this.activeStepIndex = stepIndex;
    this.activeFieldIndex = fieldIndex;
  }

  moveField(stepIndex: number, fieldIndex: number, direction: -1 | 1) {
    const fields = this.draft.steps[stepIndex].fields;
    const nextIndex = fieldIndex + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) {
      return;
    }
    const [field] = fields.splice(fieldIndex, 1);
    fields.splice(nextIndex, 0, field);
    this.selectField(stepIndex, nextIndex);
    this.syncJson();
  }

  addOption(field: FieldDraft) {
    const count = field.options.length + 1;
    field.options.push({ label: `Opción ${count}`, value: `opcion_${count}` });
    this.syncJson();
  }

  removeOption(field: FieldDraft, optionIndex: number) {
    field.options.splice(optionIndex, 1);
    this.syncJson();
  }

  addCommand() {
    const count = this.draft.commands.length + 1;
    this.draft.commands.push({
      key: this.nextCommandKey(`accion_${count}`),
      label: `Acción ${count}`,
      type: 'execute_service',
      serviceKey: '',
      flowKey: '',
      payloadMapText: JSON.stringify({ input: '{{input}}' }, null, 2),
      responseMode: 'show_response',
      requiredPermission: '',
      requiredRole: '',
      requiresValidForm: true,
      confirmMessage: ''
    });
    this.syncJson();
  }

  removeCommand(commandIndex: number) {
    this.draft.commands.splice(commandIndex, 1);
    this.syncJson();
  }

  usePreviewAsFixture() {
    this.submitTestInputText = JSON.stringify(this.previewModel, null, 2);
    this.submitTestError = '';
    this.submitTestMessage = 'Datos del preview copiados al input de prueba.';
    this.submitTestPassed = false;
  }

  generateExampleFixture() {
    const fixture = Object.fromEntries(
      this.draft.steps
        .flatMap((step) => step.fields)
        .map((field) => [this.normalizeKey(field.key), this.exampleValueForField(field)])
    );
    this.previewModel = fixture;
    this.submitTestInputText = JSON.stringify(fixture, null, 2);
    this.submitTestError = '';
    this.submitTestMessage = 'Ejemplo generado desde los campos actuales.';
    this.submitTestPassed = false;
  }

  runSubmitTest() {
    this.submitTestError = '';
    this.submitTestMessage = '';
    this.submitTestOutputText = '';
    if (!this.selected) {
      this.submitTestError = 'Guarda el formulario antes de probar el submit.';
      return;
    }

    let input: Record<string, unknown>;
    try {
      const parsed = JSON.parse(this.submitTestInputText || '{}');
      input = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      this.submitTestError = 'El input de prueba no es un JSON válido.';
      return;
    }

    const startedAt = performance.now();
    this.testing = true;
    this.api
      .post<Record<string, unknown>>(`forms/by-key/${encodeURIComponent(this.selected.key)}/submit`, {
        input,
        idempotencyKey: `designer:${this.selected.key}:${Date.now()}`
      })
      .subscribe({
        next: (output) => {
          const durationMs = Math.round(performance.now() - startedAt);
          this.submitTestOutputText = JSON.stringify({ ok: true, durationMs, output }, null, 2);
          this.submitTestMessage = `Submit ejecutado correctamente en ${durationMs} ms.`;
          this.submitTestPassed = true;
          this.testing = false;
        },
        error: (response) => {
          const durationMs = Math.round(performance.now() - startedAt);
          this.submitTestOutputText = JSON.stringify(
            {
              ok: false,
              durationMs,
              error: response?.error ?? response?.message ?? 'Error desconocido'
            },
            null,
            2
          );
          this.submitTestError = 'El backend rechazó la prueba. Revisa permisos, schema, servicio, flow o persistencia.';
          this.submitTestPassed = false;
          this.testing = false;
        }
      });
  }

  syncJson() {
    const schema = this.schemaFromDraft();
    this.jsonText = JSON.stringify(schema, null, 2);
    this.jsonError = '';
    this.submitTestPassed = false;
    this.previewPresentation = this.buildPreviewPresentation();
    this.rebuildPreview();
  }

  applyJson() {
    try {
      const schema = JSON.parse(this.jsonText) as Record<string, unknown>;
      this.draft = this.draftFromSchema({
        id: this.selected?.id ?? '',
        key: String(schema['key'] ?? this.draft.key),
        title: String(schema['title'] ?? this.draft.title),
        description: String(schema['description'] ?? this.draft.description),
        category: String(schema['category'] ?? this.draft.category),
        version: this.selected?.version ?? 1,
        schema,
        published: this.selected?.published ?? false,
        status: this.selected?.status
      });
      this.jsonError = '';
      this.submitTestPassed = false;
      this.rebuildPreview();
    } catch {
      this.jsonError = 'El JSON no es válido. Corrígelo antes de aplicarlo o guardar.';
    }
  }

  onJsonEdited() {
    this.jsonError = '';
    this.submitTestPassed = false;
    this.rebuildPreview();
  }

  get jsonAuthoringReady() {
    return !this.liveJsonParseError();
  }

  get jsonAuthoringError() {
    return this.jsonError || this.liveJsonParseError();
  }

  saveJsonOnly(publish: boolean) {
    this.message = '';
    this.error = '';
    this.jsonError = '';
    let document: Record<string, unknown>;
    try {
      document = JSON.parse(this.jsonText) as Record<string, unknown>;
    } catch {
      this.jsonError = 'El JSON no es válido. No se puede guardar.';
      return;
    }

    this.saving = true;
    this.api
      .post<DynamicFormAuthoringResponse>('forms/authoring/json', {
        document,
        publish
      })
      .subscribe({
        next: (response) => {
          this.selected = response.form;
          this.latestVersion = response.version ?? undefined;
          this.forms = this.upsertForm(this.forms, response.form);
          this.draft = this.draftFromSchema(response.form);
          this.jsonText = JSON.stringify(response.form.schema, null, 2);
          this.message = publish
            ? `Formulario ${response.key} guardado y publicado.`
            : `Formulario ${response.key} guardado como draft.`;
          this.saving = false;
          this.rebuildPreview();
        },
        error: () => {
          this.error = publish
            ? 'No se pudo guardar y publicar desde JSON. Revisa el contrato.'
            : 'No se pudo guardar el draft desde JSON. Revisa el contrato.';
          this.saving = false;
        }
      });
  }

  save() {
    this.message = '';
    this.error = '';
    this.jsonError = '';
    const jsonIssues = this.jsonContractIssues();
    if (jsonIssues.length) {
      this.error = 'Corrige los pendientes antes de guardar el borrador.';
      return;
    }
    let schema: Record<string, unknown>;
    try {
      schema = JSON.parse(this.jsonText) as Record<string, unknown>;
    } catch {
      this.jsonError = 'El JSON no es válido. No se puede guardar.';
      return;
    }

    this.saving = true;
    const body = {
      key: this.normalizeKey(String(schema['key'] ?? this.draft.key)),
      title: String(schema['title'] ?? this.draft.title).trim(),
      description: String(schema['description'] ?? this.draft.description).trim() || null,
      category: String(schema['category'] ?? this.draft.category).trim() || null,
      schema
    };
    const request = this.selected
      ? this.api.patch<DynamicFormItem>(`forms/${this.selected.id}`, body)
      : this.api.post<DynamicFormItem>('forms', body);

    request.subscribe({
      next: (form) => {
        this.selected = form;
        this.forms = this.upsertForm(this.forms, form);
        this.message = 'Borrador guardado.';
        this.saving = false;
      },
      error: () => {
        this.error = 'No se pudo guardar. Revisa key, título, pasos y campos obligatorios.';
        this.saving = false;
      }
    });
  }

  createVersion() {
    if (!this.selected || !this.canCreateVersion) {
      this.error = 'Antes de versionar guarda el borrador y corrige todos los pendientes.';
      return;
    }
    this.saving = true;
    this.message = '';
    this.error = '';
    this.api.post<DynamicFormVersion>(`forms/${this.selected.id}/versions`, {}).subscribe({
      next: (version) => {
        this.latestVersion = version;
        this.message = `Versión v${version.version} creada.`;
        this.saving = false;
      },
      error: () => {
        this.error = 'No se pudo crear la versión. Guarda y valida el JSON primero.';
        this.saving = false;
      }
    });
  }

  publishLatest() {
    if (!this.selected || !this.latestVersion || !this.canPublish) {
      this.error = 'Antes de publicar necesitas un borrador guardado, sin pendientes, con versión creada y con prueba exitosa.';
      return;
    }
    this.saving = true;
    this.message = '';
    this.error = '';
    this.api
      .post<DynamicFormVersion>(`forms/${this.selected.id}/versions/${this.latestVersion.id}/publish`, {})
      .subscribe({
        next: (version) => {
          this.latestVersion = version;
          this.message = `Versión v${version.version} publicada.`;
          this.saving = false;
          this.refresh();
        },
        error: () => {
          this.error = 'No se pudo publicar la versión.';
          this.saving = false;
        }
      });
  }

  statusLabel(form: DynamicFormItem) {
    if (form.published || form.status === 'published') {
      return 'publicado';
    }
    return form.status ?? 'borrador';
  }

  rebuildPreview() {
    const schema = this.safeJson();
    if (!schema) {
      this.previewForm = undefined;
      return;
    }
    this.previewForm = this.runtime.fromStored({
      key: String(schema['key'] ?? this.draft.key),
      title: String(schema['title'] ?? this.draft.title),
      version: this.selected?.version ?? 1,
      schema,
      published: this.selected?.published ?? false
    });
    this.previewModel = this.runtime.initialValues(this.previewForm);
    if (!this.submitTestInputText || this.submitTestInputText === '{}') {
      this.submitTestInputText = JSON.stringify(this.previewModel, null, 2);
    }
  }

  private buildPreviewPresentation(): UiPresentationConfig {
    return {
      profileKey: 'adaptive',
      kit: this.draft.kit === 'auto' ? 'primeng' : this.draft.kit,
      theme: this.draft.theme || 'chicle',
      rules: [
        { kit: 'ionic', platforms: ['ios', 'android'] },
        { kit: 'primeng', platforms: ['web'] }
      ]
    };
  }

  private loadDynamicTargets() {
    this.serviceClient.available().subscribe({
      next: (services) => {
        this.availableServices = services;
      },
      error: () => {
        this.availableServices = [];
      }
    });
    this.flowClient.available().subscribe({
      next: (flows) => {
        this.availableFlows = flows;
      },
      error: () => {
        this.availableFlows = [];
      }
    });
  }

  private safeJson() {
    try {
      return JSON.parse(this.jsonText || '{}') as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private liveJsonParseError() {
    try {
      JSON.parse(this.jsonText || '{}');
      return '';
    } catch {
      return 'El JSON no es válido. Corrige llaves, comas o valores antes de guardar.';
    }
  }

  private jsonContractIssues() {
    const issues: string[] = [];
    let schema: Record<string, unknown>;
    try {
      const parsed = JSON.parse(this.jsonText || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return ['El contrato JSON debe ser un objeto.'];
      }
      schema = parsed as Record<string, unknown>;
    } catch {
      this.jsonError = 'El JSON no es válido. Corrige llaves, comas o valores antes de guardar.';
      return [this.jsonError];
    }

    if (schema['kind'] !== 'dynamic_form') {
      issues.push('schema.kind debe ser dynamic_form.');
    }
    if (!this.normalizeKey(String(schema['key'] ?? ''))) {
      issues.push('El JSON necesita una key técnica válida.');
    }
    if (!String(schema['title'] ?? '').trim()) {
      issues.push('El JSON necesita un title visible.');
    }
    const steps = Array.isArray(schema['steps']) ? (schema['steps'] as Array<Record<string, unknown>>) : [];
    if (!steps.length) {
      issues.push('El JSON necesita al menos un step.');
    }
    const stepKeys = new Set<string>();
    let fieldCount = 0;
    for (const step of steps) {
      const stepKey = this.normalizeKey(String(step['key'] ?? ''));
      if (!stepKey || stepKeys.has(stepKey)) {
        issues.push(`El step "${String(step['title'] ?? step['key'] ?? '')}" necesita una key única.`);
      }
      stepKeys.add(stepKey);
      const fields = Array.isArray(step['fields']) ? (step['fields'] as Array<Record<string, unknown>>) : [];
      const fieldKeys = new Set<string>();
      for (const field of fields) {
        fieldCount += 1;
        const fieldKey = this.normalizeKey(String(field['key'] ?? field['name'] ?? ''));
        if (!fieldKey || fieldKeys.has(fieldKey)) {
          issues.push(`Hay un campo sin key única en el step ${stepKey || 'sin_key'}.`);
        }
        fieldKeys.add(fieldKey);
        if (!String(field['type'] ?? '').trim() || !String(field['label'] ?? '').trim()) {
          issues.push(`El campo ${fieldKey || 'sin_key'} necesita type y label.`);
        }
      }
    }
    if (!fieldCount) {
      issues.push('El JSON necesita al menos un campo.');
    }
    this.jsonError = issues.length ? issues[0] : '';
    return [...new Set(issues)].slice(0, 8);
  }

  private schemaFromDraft(): Record<string, unknown> {
    const normalizedKey = this.normalizeKey(this.draft.key);
    return {
      schemaVersion: 1,
      kind: 'dynamic_form',
      key: normalizedKey,
      title: this.draft.title || 'Formulario sin título',
      description: this.draft.description || '',
      category: this.draft.category || 'general',
      runtime: {
        mode: 'guided',
        submitLabel: this.draft.submitLabel || 'Enviar',
        autosave: this.draft.autosave,
        offline: {
          enabled: this.draft.offlineEnabled,
          queueKey: normalizedKey || 'formulario',
          idempotencyKey: this.draft.idempotencyKey || '{{input.email}}'
        },
        limits: {
          timeoutMs: Number(this.draft.timeoutMs) || 10000,
          maxPayloadKb: Number(this.draft.maxPayloadKb) || 512
        }
      },
      presentation: {
        profileKey: 'adaptive',
        kit: this.draft.kit,
        theme: this.draft.theme || 'chicle',
        themeMode: this.draft.themeMode,
        density: this.draft.density,
        radius: 'md',
        rules: [
          { kit: 'ionic', platforms: ['ios', 'android'] },
          { kit: 'primeng', platforms: ['web'] }
        ],
        tokens: {}
      },
      layout: {
        strategy: 'adaptive_steps',
        desktop: {
          mode: this.draft.desktopMode,
          cardColumns: Number(this.draft.desktopColumns) || 2,
          allowSingleLongForm: true,
          maxFieldsPerSection: 8
        },
        tablet: {
          mode: this.draft.desktopMode === 'single_form' ? 'single_form' : 'step_cards',
          cardColumns: 1,
          maxFieldsPerSection: 6
        },
        mobile: {
          mode: this.draft.mobileMode,
          progress: 'compact',
          navigation: 'bottom_actions',
          maxFieldsPerScreen: 6
        },
        autoSplit: {
          enabled: true,
          suggestAfterFields: 8,
          forceReviewAfterFields: 14
        }
      },
      persistence: this.persistenceFromDraft(),
      steps: this.draft.steps.map((step) => ({
        key: this.normalizeKey(step.key) || 'paso',
        title: step.title || step.key,
        description: step.description || '',
        fields: step.fields.map((field) => ({
          key: this.normalizeKey(field.key) || 'campo',
          name: this.normalizeKey(field.key) || 'campo',
          type: field.type,
          label: field.label || field.key,
          required: field.required,
          placeholder: field.placeholder || '',
          help: field.help || '',
          options: field.type === 'select' || field.type === 'radio' ? field.options : undefined,
          layout: field.layout,
          visibleWhen: field.visibleWhenField
            ? {
                field: this.normalizeKey(field.visibleWhenField),
                operator: field.visibleWhenOperator,
                value:
                  field.visibleWhenOperator === 'truthy' || field.visibleWhenOperator === 'falsy'
                    ? undefined
                    : field.visibleWhenValue
              }
            : undefined,
          length:
            field.minLength || field.maxLength
              ? {
                  min: field.minLength || undefined,
                  max: field.maxLength || undefined
                }
              : undefined,
          validation:
            (field.min !== null && field.min !== undefined) ||
            (field.max !== null && field.max !== undefined) ||
            Boolean(field.validationServiceKey)
              ? {
                  min: field.min ?? undefined,
                  max: field.max ?? undefined,
                  serviceKey: field.validationServiceKey || undefined
                }
              : undefined,
          dataSource: field.dataSourceServiceKey
            ? {
                type: 'dynamic_service',
                bindingType: 'options',
                event: 'onOpen',
                serviceKey: field.dataSourceServiceKey,
                payloadMap: {
                  input: '{{input}}'
                }
              }
            : undefined,
          access:
            field.requiredPermission || field.requiredRole || field.readonlyPermission
              ? {
                  permissions: field.requiredPermission ? [field.requiredPermission.trim()] : [],
                  roles: field.requiredRole ? [field.requiredRole.trim()] : [],
                  readonlyUnlessPermission: field.readonlyPermission || undefined,
                  deniedMode: 'hidden'
                }
              : undefined,
          config: {
            help: field.help || undefined,
            defaultValue: field.defaultValue || undefined,
            accept: field.type === 'image' ? 'image/*' : field.type === 'file' ? '*/*' : undefined,
            capture: field.type === 'image' ? 'environment' : undefined,
            currency: field.type === 'currency' ? 'COP' : undefined
          }
        }))
      })),
      commands: this.commandsFromDraft(),
      actions: this.actionsFromDraft(),
      dataSources: [],
      tests: []
    };
  }

  private persistenceFromDraft() {
    if (this.draft.persistenceMode === 'service') {
      return {
        mode: 'service',
        defaultTarget: {
          type: 'dynamic_service',
          serviceKey: this.draft.serviceKey
        }
      };
    }
    if (this.draft.persistenceMode === 'flow') {
      return {
        mode: 'flow',
        defaultTarget: {
          type: 'flow',
          flowKey: this.draft.flowKey
        }
      };
    }
    if (this.draft.persistenceMode === 'record' || this.draft.persistenceMode === 'hybrid') {
      return {
        mode: this.draft.persistenceMode,
        defaultTarget: {
          type: 'record',
          recordType: this.draft.recordType || this.normalizeKey(this.draft.key)
        }
      };
    }
    return { mode: 'none' };
  }

  private actionsFromDraft() {
    if (this.draft.persistenceMode === 'service' && this.draft.serviceKey) {
      return [
        {
          event: 'onSubmit',
          type: 'execute_service',
          serviceKey: this.draft.serviceKey,
          payloadMap: this.safeMapFromText(this.draft.payloadMapText, { input: '{{input}}' }),
          responseMap: this.safeMapFromText(this.draft.responseMapText, {})
        }
      ];
    }
    if (this.draft.persistenceMode === 'flow' && this.draft.flowKey) {
      return [
        {
          event: 'onSubmit',
          type: 'execute_flow',
          flowKey: this.draft.flowKey,
          payloadMap: this.safeMapFromText(this.draft.payloadMapText, { input: '{{input}}' }),
          responseMap: this.safeMapFromText(this.draft.responseMapText, {})
        }
      ];
    }
    if (this.draft.persistenceMode === 'hybrid') {
      const actions: Array<Record<string, unknown>> = [
        {
          event: 'onSubmit',
          type: 'create_record',
          recordType: this.draft.recordType || this.normalizeKey(this.draft.key),
          resultKey: 'record',
          payloadMap: { input: '{{input}}' }
        }
      ];
      if (this.draft.hybridActionType === 'execute_service' && this.draft.hybridServiceKey) {
        actions.push({
          event: 'onSubmit',
          type: 'execute_service',
          serviceKey: this.draft.hybridServiceKey,
          resultKey: 'service',
          payloadMap: this.safeMapFromText(this.draft.payloadMapText, { input: '{{input}}' }),
          responseMap: this.safeMapFromText(this.draft.responseMapText, {})
        });
      }
      if (this.draft.hybridActionType === 'execute_flow' && this.draft.hybridFlowKey) {
        actions.push({
          event: 'onSubmit',
          type: 'execute_flow',
          flowKey: this.draft.hybridFlowKey,
          resultKey: 'flow',
          payloadMap: this.safeMapFromText(this.draft.payloadMapText, { input: '{{input}}' }),
          responseMap: this.safeMapFromText(this.draft.responseMapText, {})
        });
      }
      return actions;
    }
    return [
      {
        event: 'onSubmit',
        type: this.draft.persistenceMode === 'none' ? 'show_message' : 'create_record',
        recordType: this.draft.recordType || this.normalizeKey(this.draft.key),
        payloadMap: { input: '{{input}}' }
      }
    ];
  }

  private commandsFromDraft() {
    return this.draft.commands.map((command) => {
      const key = this.normalizeKey(command.key) || 'accion';
      const payloadMap =
        command.type === 'show_message'
          ? undefined
          : this.safeMapFromText(command.payloadMapText, { input: '{{input}}' });
      return {
        key,
        label: command.label || command.key || 'Acción',
        placement: 'form_toolbar',
        style: 'secondary',
        event: 'onClick',
        type: command.type,
        serviceKey: command.type === 'execute_service' ? command.serviceKey || undefined : undefined,
        flowKey: command.type === 'execute_flow' ? command.flowKey || undefined : undefined,
        payloadMap,
        action: {
          type: command.type,
          serviceKey: command.type === 'execute_service' ? command.serviceKey || undefined : undefined,
          flowKey: command.type === 'execute_flow' ? command.flowKey || undefined : undefined,
          payloadMap,
          resultKey: key
        },
        responseMode: command.responseMode,
        requiresValidForm: command.requiresValidForm,
        confirm: command.confirmMessage ? { message: command.confirmMessage } : undefined,
        access:
          command.requiredPermission || command.requiredRole
            ? {
                permissions: command.requiredPermission ? [command.requiredPermission.trim()] : [],
                roles: command.requiredRole ? [command.requiredRole.trim()] : [],
                deniedMode: 'hidden'
              }
            : undefined
      };
    });
  }

  private draftFromSchema(form: DynamicFormItem): FormDraft {
    const schema = form.schema ?? {};
    const runtime = this.asObject(schema['runtime']);
    const offline = this.asObject(runtime?.['offline']);
    const limits = this.asObject(runtime?.['limits']);
    const presentation = this.asObject(schema['presentation']);
    const layout = this.asObject(schema['layout']);
    const desktopLayout = this.asObject(layout?.['desktop']);
    const mobileLayout = this.asObject(layout?.['mobile']);
    const persistence = this.asObject(schema['persistence']);
    const target = this.asObject(persistence?.['defaultTarget']);
    const submitAction = this.submitActionFromSchema(schema);
    const hybridAction = this.hybridActionFromSchema(schema);
    const steps = Array.isArray(schema['steps']) ? (schema['steps'] as Array<Record<string, unknown>>) : [];
    return {
      templateKey: 'blank',
      key: String(schema['key'] ?? form.key ?? ''),
      title: String(schema['title'] ?? form.title ?? ''),
      description: String(schema['description'] ?? form.description ?? ''),
      category: String(schema['category'] ?? form.category ?? 'general'),
      submitLabel: String(runtime?.['submitLabel'] ?? 'Enviar'),
      kit: this.asPresentationKit(presentation?.['kit']),
      theme: String(presentation?.['theme'] ?? 'chicle'),
      themeMode: this.asThemeMode(presentation?.['themeMode']),
      density: this.asDensityMode(presentation?.['density']),
      desktopMode: this.asDesktopLayoutMode(desktopLayout?.['mode']),
      desktopColumns: this.asNumber(desktopLayout?.['cardColumns']) ?? 2,
      mobileMode: this.asMobileLayoutMode(mobileLayout?.['mode']),
      autosave: runtime?.['autosave'] === true,
      offlineEnabled: offline?.['enabled'] !== false,
      timeoutMs: this.asNumber(limits?.['timeoutMs']) ?? 10000,
      maxPayloadKb: this.asNumber(limits?.['maxPayloadKb']) ?? 512,
      persistenceMode: this.asPersistenceMode(persistence?.['mode']),
      recordType: String(target?.['recordType'] ?? form.key ?? ''),
      serviceKey: String(target?.['serviceKey'] ?? ''),
      flowKey: String(target?.['flowKey'] ?? ''),
      hybridActionType: this.asHybridActionType(hybridAction?.['type']),
      hybridServiceKey: String(hybridAction?.['serviceKey'] ?? ''),
      hybridFlowKey: String(hybridAction?.['flowKey'] ?? ''),
      payloadMapText: JSON.stringify(this.asObject(submitAction?.['payloadMap']) ?? { input: '{{input}}' }, null, 2),
      responseMapText: JSON.stringify(this.asObject(submitAction?.['responseMap']) ?? {}, null, 2),
      idempotencyKey: String(offline?.['idempotencyKey'] ?? '{{input.email}}'),
      commands: this.commandsFromSchema(schema),
      steps: steps.length
        ? steps.map((step) => this.stepDraftFromSchema(step))
        : this.blankDraft().steps
    };
  }

  private stepDraftFromSchema(step: Record<string, unknown>): StepDraft {
    const fields = Array.isArray(step['fields']) ? (step['fields'] as Array<Record<string, unknown>>) : [];
    return {
      key: String(step['key'] ?? 'paso'),
      title: String(step['title'] ?? step['key'] ?? 'Paso'),
      description: String(step['description'] ?? ''),
      fields: fields.map((field) => {
        const visibleWhen = this.asObject(field['visibleWhen']);
        const access = this.asObject(field['access']);
        const permissions = Array.isArray(access?.['permissions']) ? access['permissions'] : [];
        const roles = Array.isArray(access?.['roles']) ? access['roles'] : [];
        return {
          key: String(field['key'] ?? field['name'] ?? ''),
          label: String(field['label'] ?? field['key'] ?? ''),
          type: this.asFieldType(field['type']),
          required: field['required'] === true,
          placeholder: String(field['placeholder'] ?? ''),
          help: String(field['help'] ?? this.asObject(field['config'])?.['help'] ?? ''),
          defaultValue: String(this.asObject(field['config'])?.['defaultValue'] ?? ''),
          layout: this.asFieldLayout(field['layout']),
          minLength: this.asNumber(this.asObject(field['length'])?.['min']),
          maxLength: this.asNumber(this.asObject(field['length'])?.['max']),
          min: this.asNumber(this.asObject(field['validation'])?.['min']),
          max: this.asNumber(this.asObject(field['validation'])?.['max']),
          options: this.optionsFromField(field),
          dataSourceServiceKey: String(this.asObject(field['dataSource'])?.['serviceKey'] ?? ''),
          validationServiceKey: String(this.asObject(field['validation'])?.['serviceKey'] ?? ''),
          visibleWhenField: String(visibleWhen?.['field'] ?? ''),
          visibleWhenOperator: this.asConditionOperator(visibleWhen?.['operator']),
          visibleWhenValue: String(visibleWhen?.['value'] ?? ''),
          requiredPermission: String(permissions[0] ?? ''),
          requiredRole: String(roles[0] ?? ''),
          readonlyPermission: String(access?.['readonlyUnlessPermission'] ?? '')
        };
      })
    };
  }

  private blankDraft(): FormDraft {
    return {
      templateKey: 'capture',
      key: 'cliente_onboarding',
      title: 'Onboarding de cliente',
      description: 'Captura y valida la información inicial del cliente.',
      category: 'clientes',
      submitLabel: 'Crear cliente',
      kit: 'auto',
      theme: 'chicle',
      themeMode: 'system',
      density: 'comfortable',
      desktopMode: 'step_cards',
      desktopColumns: 2,
      mobileMode: 'step_screens',
      autosave: false,
      offlineEnabled: true,
      timeoutMs: 10000,
      maxPayloadKb: 512,
      persistenceMode: 'record',
      recordType: 'cliente_onboarding',
      serviceKey: '',
      flowKey: '',
      hybridActionType: 'none',
      hybridServiceKey: '',
      hybridFlowKey: '',
      payloadMapText: JSON.stringify({ input: '{{input}}' }, null, 2),
      responseMapText: JSON.stringify({}, null, 2),
      idempotencyKey: '{{input.email}}',
      commands: [],
      steps: [
        {
          key: 'datos_basicos',
          title: 'Datos básicos',
          description: 'Información mínima para identificar al cliente.',
          fields: [
            this.cloneField(DEFAULT_FIELD),
            this.fieldDraft({
              key: 'email',
              label: 'Email',
              type: 'email',
              required: true,
              placeholder: 'cliente@empresa.com',
              help: 'Usaremos este correo para evitar duplicados.',
              layout: 'half'
            })
          ]
        }
      ]
    };
  }

  private templateDraft(templateKey: FormTemplate['key']): FormDraft {
    const base = this.blankDraft();
    if (templateKey === 'blank') {
      return {
        ...base,
        templateKey,
        key: 'formulario_personalizado',
        title: 'Formulario personalizado',
        description: 'Construye el formulario desde cero.',
        category: 'general',
        submitLabel: 'Enviar',
        persistenceMode: 'record',
        recordType: 'formulario_personalizado',
        steps: [
          {
            key: 'principal',
            title: 'Principal',
            description: 'Agrega los campos que necesitas.',
            fields: []
          }
        ]
      };
    }
    if (templateKey === 'lookup') {
      return {
        ...base,
        templateKey,
        key: 'consulta_dinamica',
        title: 'Consulta dinámica',
        description: 'Consulta o valida datos sin guardar información por defecto.',
        category: 'consultas',
        submitLabel: 'Consultar',
        persistenceMode: 'none',
        recordType: '',
        idempotencyKey: '{{input.serial}}',
        steps: [
          {
            key: 'criterios',
            title: 'Criterios de búsqueda',
            description: 'Datos usados para consultar un servicio o flow.',
            fields: [
              this.fieldDraft({ key: 'serial', label: 'Serial', type: 'text', required: true, placeholder: 'ABC-123', layout: 'half' }),
              this.fieldDraft({ key: 'email', label: 'Email', type: 'email', required: false, placeholder: 'persona@empresa.com', layout: 'half' })
            ]
          }
        ]
      };
    }
    if (templateKey === 'approval') {
      return {
        ...base,
        templateKey,
        key: 'solicitud_aprobacion',
        title: 'Solicitud con aprobación',
        description: 'Captura una solicitud y prepara el envío a un flow de aprobación.',
        category: 'procesos',
        submitLabel: 'Enviar solicitud',
        persistenceMode: 'flow',
        recordType: 'solicitud_aprobacion',
        steps: [
          {
            key: 'solicitud',
            title: 'Solicitud',
            description: 'Describe lo que se necesita aprobar.',
            fields: [
              this.fieldDraft({ key: 'solicitante', label: 'Solicitante', type: 'text', required: true, layout: 'half' }),
              this.fieldDraft({ key: 'monto', label: 'Monto', type: 'number', required: true, layout: 'half', min: 0 }),
              this.fieldDraft({ key: 'justificacion', label: 'Justificación', type: 'textarea', required: true, layout: 'full' })
            ]
          }
        ]
      };
    }
    if (templateKey === 'inspection') {
      return {
        ...base,
        templateKey,
        key: 'inspeccion_movil',
        title: 'Inspección móvil',
        description: 'Checklist corto para capturar datos desde móvil y preparar evidencias.',
        category: 'operaciones',
        submitLabel: 'Guardar inspección',
        density: 'comfortable',
        mobileMode: 'step_screens',
        steps: [
          {
            key: 'ubicacion',
            title: 'Ubicación',
            description: 'Identifica el punto de inspección.',
            fields: [
              this.fieldDraft({ key: 'sitio', label: 'Sitio', type: 'text', required: true, layout: 'half' }),
              this.fieldDraft({ key: 'fecha', label: 'Fecha', type: 'date', required: true, layout: 'half' })
            ]
          },
          {
            key: 'resultado',
            title: 'Resultado',
            description: 'Registra hallazgos y estado.',
            fields: [
              this.fieldDraft({
                key: 'estado',
                label: 'Estado',
                type: 'select',
                required: true,
                layout: 'half',
                options: [
                  { label: 'Correcto', value: 'ok' },
                  { label: 'Con novedad', value: 'warning' },
                  { label: 'Crítico', value: 'critical' }
                ]
              }),
              this.fieldDraft({ key: 'observaciones', label: 'Observaciones', type: 'textarea', required: false, layout: 'full' })
            ]
          }
        ]
      };
    }
    return { ...base, templateKey: 'capture' };
  }

  private upsertForm(forms: DynamicFormItem[], form: DynamicFormItem) {
    const exists = forms.some((item) => item.id === form.id);
    return exists ? forms.map((item) => (item.id === form.id ? form : item)) : [form, ...forms];
  }

  private normalizeKey(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_.-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/^[^a-z]+/, 'f_')
      .slice(0, 120);
  }

  private addFields(stepIndex: number, fields: Array<Partial<FieldDraft> & Pick<FieldDraft, 'key' | 'label' | 'type'>>) {
    const step = this.draft.steps[stepIndex];
    const existing = step.fields;
    for (const field of fields) {
      const draft = this.fieldDraft(field);
      draft.key = this.nextFieldKey(draft.key, existing);
      existing.push(draft);
    }
    this.activeStepIndex = stepIndex;
    this.activeFieldIndex = Math.max(0, existing.length - 1);
    this.syncJson();
  }

  private fieldDraft(field: Partial<FieldDraft> & Pick<FieldDraft, 'key' | 'label' | 'type'>): FieldDraft {
    return {
      ...this.cloneField(DEFAULT_FIELD),
      ...field,
      key: this.normalizeKey(field.key),
      options: (field.options ?? []).map((option) => ({ ...option })),
      placeholder: field.placeholder ?? '',
      help: field.help ?? '',
      defaultValue: field.defaultValue ?? '',
      layout: field.layout ?? 'half',
      required: field.required ?? false,
      minLength: field.minLength ?? null,
      maxLength: field.maxLength ?? null,
      min: field.min ?? null,
      max: field.max ?? null,
      dataSourceServiceKey: field.dataSourceServiceKey ?? '',
      validationServiceKey: field.validationServiceKey ?? '',
      visibleWhenField: field.visibleWhenField ?? '',
      visibleWhenOperator: field.visibleWhenOperator ?? 'equals',
      visibleWhenValue: field.visibleWhenValue ?? '',
      requiredPermission: field.requiredPermission ?? '',
      requiredRole: field.requiredRole ?? '',
      readonlyPermission: field.readonlyPermission ?? ''
    };
  }

  private nextFieldKey(baseKey: string, fields: FieldDraft[]) {
    const normalized = this.normalizeKey(baseKey) || 'campo';
    const keys = new Set(fields.map((field) => this.normalizeKey(field.key)));
    if (!keys.has(normalized)) {
      return normalized;
    }
    let index = 2;
    while (keys.has(`${normalized}_${index}`)) {
      index += 1;
    }
    return `${normalized}_${index}`;
  }

  private nextCommandKey(baseKey: string) {
    const normalized = this.normalizeKey(baseKey) || 'accion';
    const keys = new Set(this.draft.commands.map((command) => this.normalizeKey(command.key)));
    if (!keys.has(normalized)) {
      return normalized;
    }
    let index = 2;
    while (keys.has(`${normalized}_${index}`)) {
      index += 1;
    }
    return `${normalized}_${index}`;
  }

  private commandsFromSchema(schema: Record<string, unknown>): FormCommandDraft[] {
    const commands = Array.isArray(schema['commands'])
      ? (schema['commands'] as Array<Record<string, unknown>>)
      : [];
    return commands
      .filter((command) => String(command['event'] ?? 'onClick') === 'onClick')
      .map((command, index) => ({
        key: this.normalizeKey(String(command['key'] ?? `accion_${index + 1}`)),
        label: String(command['label'] ?? command['key'] ?? `Acción ${index + 1}`),
        type: this.asCommandType(command['type']),
      serviceKey: String(command['serviceKey'] ?? ''),
      flowKey: String(command['flowKey'] ?? ''),
      payloadMapText: JSON.stringify(this.asObject(command['payloadMap']) ?? { input: '{{input}}' }, null, 2),
        responseMode: command['responseMode'] === 'silent' ? 'silent' : 'show_response',
        requiredPermission: this.firstAccessValue(command, 'permissions'),
        requiredRole: this.firstAccessValue(command, 'roles'),
        requiresValidForm: command['requiresValidForm'] !== false,
        confirmMessage: String(this.asObject(command['confirm'])?.['message'] ?? '')
      }));
  }

  private exampleValueForField(field: FieldDraft): unknown {
    if (field.defaultValue) {
      return field.defaultValue;
    }
    if (field.type === 'checkbox') {
      return true;
    }
    if (field.type === 'toggle') {
      return true;
    }
    if (field.type === 'number' || field.type === 'currency') {
      return field.min ?? 1;
    }
    if (field.type === 'date') {
      return new Date().toISOString().slice(0, 10);
    }
    if (field.type === 'time') {
      return '09:00';
    }
    if (field.type === 'datetime') {
      return new Date().toISOString().slice(0, 16);
    }
    if (field.type === 'select' || field.type === 'radio') {
      return field.options[0]?.value ?? '';
    }
    if (field.type === 'email') {
      return 'persona@empresa.com';
    }
    if (field.type === 'tel') {
      return '+57 300 000 0000';
    }
    if (field.type === 'url') {
      return 'https://empresa.com';
    }
    if (field.type === 'password') {
      return 'valor-seguro';
    }
    if (field.type === 'file') {
      return { name: 'documento.pdf', size: 128000, type: 'application/pdf' };
    }
    if (field.type === 'image') {
      return { name: 'evidencia.jpg', size: 256000, type: 'image/jpeg' };
    }
    if (field.type === 'gps') {
      return { lat: 4.711, lng: -74.0721, accuracy: 25 };
    }
    if (field.key.includes('telefono')) {
      return '+57 300 000 0000';
    }
    if (field.key.includes('serial')) {
      return 'ABC-123';
    }
    return field.placeholder || field.label || field.key;
  }

  private isJsonObject(text: string) {
    try {
      const parsed = JSON.parse(text || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private asPersistenceMode(value: unknown): PersistenceMode {
    return ['record', 'service', 'flow', 'hybrid', 'none'].includes(String(value))
      ? (value as PersistenceMode)
      : 'record';
  }

  private asFieldType(value: unknown): FieldType {
    return [
      'text',
      'email',
      'number',
      'currency',
      'tel',
      'url',
      'password',
      'textarea',
      'select',
      'radio',
      'checkbox',
      'toggle',
      'date',
      'time',
      'datetime',
      'file',
      'image',
      'gps'
    ].includes(String(value))
      ? (value as FieldType)
      : 'text';
  }

  private asCommandType(value: unknown): FormCommandType {
    return value === 'execute_flow' || value === 'show_message' ? value : 'execute_service';
  }

  private asHybridActionType(value: unknown): HybridActionType {
    return value === 'execute_service' || value === 'execute_flow' ? value : 'none';
  }

  private asFieldLayout(value: unknown): FieldLayout {
    return value === 'full' || value === 'third' ? value : 'half';
  }

  private asConditionOperator(value: unknown): ConditionOperator {
    return ['equals', 'not_equals', 'truthy', 'falsy', 'contains'].includes(String(value))
      ? (value as ConditionOperator)
      : 'equals';
  }

  private asPresentationKit(value: unknown): PresentationKit {
    return ['auto', 'primeng', 'ionic', 'native'].includes(String(value))
      ? (value as PresentationKit)
      : 'auto';
  }

  private asThemeMode(value: unknown): ThemeMode {
    return ['system', 'light', 'dark'].includes(String(value)) ? (value as ThemeMode) : 'system';
  }

  private asDensityMode(value: unknown): DensityMode {
    return ['comfortable', 'compact', 'spacious'].includes(String(value))
      ? (value as DensityMode)
      : 'comfortable';
  }

  private asDesktopLayoutMode(value: unknown): DesktopLayoutMode {
    return ['step_cards', 'single_form', 'wizard', 'auto'].includes(String(value))
      ? (value as DesktopLayoutMode)
      : 'step_cards';
  }

  private asMobileLayoutMode(value: unknown): MobileLayoutMode {
    return ['step_screens', 'single_scroll', 'auto'].includes(String(value))
      ? (value as MobileLayoutMode)
      : 'step_screens';
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return null;
  }

  private optionsFromField(field: Record<string, unknown>): FieldOptionDraft[] {
    const options = Array.isArray(field['options'])
      ? field['options']
      : Array.isArray(this.asObject(field['config'])?.['options'])
        ? (this.asObject(field['config'])?.['options'] as unknown[])
        : [];
    return options
      .filter((option): option is Record<string, unknown> => Boolean(this.asObject(option)))
      .map((option) => ({
        label: String(option['label'] ?? option['value'] ?? ''),
        value: String(option['value'] ?? option['label'] ?? '')
      }));
  }

  private submitActionFromSchema(schema: Record<string, unknown>): Record<string, unknown> | null {
    const actions = Array.isArray(schema['actions']) ? (schema['actions'] as unknown[]) : [];
    const action = actions.find(
      (item): item is Record<string, unknown> => Boolean(this.asObject(item)) && this.asObject(item)?.['event'] === 'onSubmit'
    );
    return action ?? null;
  }

  private hybridActionFromSchema(schema: Record<string, unknown>): Record<string, unknown> | null {
    const actions = Array.isArray(schema['actions']) ? (schema['actions'] as unknown[]) : [];
    const action = actions.find((item): item is Record<string, unknown> => {
      const object = this.asObject(item);
      return Boolean(
        object &&
          object['event'] === 'onSubmit' &&
          (object['type'] === 'execute_service' || object['type'] === 'execute_flow')
      );
    });
    return action ?? null;
  }

  private firstAccessValue(source: Record<string, unknown>, key: 'permissions' | 'roles') {
    const access = this.asObject(source['access']);
    const values = Array.isArray(access?.[key]) ? access?.[key] : [];
    return String(values[0] ?? '');
  }

  private safeMapFromText(text: string, fallback: Record<string, unknown>) {
    try {
      const parsed = JSON.parse(text || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : fallback;
    } catch {
      return fallback;
    }
  }

  private cloneField(field: FieldDraft): FieldDraft {
    return {
      ...field,
      options: field.options.map((option) => ({ ...option }))
    };
  }
}

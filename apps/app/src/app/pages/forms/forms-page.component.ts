import { Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../core/api/api-client.service';
import { UiPresentationConfig } from '../../core/ui/ui-presentation.types';
import { INSTALLED_UI_THEMES } from '../../core/ui/ui-theme.service';
import {
  AvailableDynamicService,
  DynamicServiceClientService
} from '../../core/services/dynamic-service-client.service';
import {
  AvailableDynamicFlow,
  DynamicFlowClientService
} from '../../core/services/dynamic-flow-client.service';
import { FormRuntimeService, RuntimeField, RuntimeForm } from '../../engine/forms/form-runtime.service';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { CodeTextareaComponent } from '../../shared/code-textarea/code-textarea.component';
import { DesignerCatalogPanelComponent } from '../../shared/designer-catalog-panel/designer-catalog-panel.component';
import { DesignerWorkspaceComponent } from '../../shared/designer-workspace/designer-workspace.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { FieldShellComponent } from '../../shared/field-shell/field-shell.component';
import { FormlyRuntimeComponent } from '../../shared/formly-runtime/formly-runtime.component';
import {
  AiAssistantService,
  AiAssistantUiAction,
  ApplyDynamicFormJsonAction,
  ApplyDynamicServiceJsonAction,
  ApplySchemaChangeAction
} from '../../shared/ai-assistant-launcher/ai-assistant.service';
import { JsonAuthoringPanelComponent } from '../../shared/json-authoring-panel/json-authoring-panel.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { PreviewViewportComponent, PreviewViewportMode } from '../../shared/preview-viewport/preview-viewport.component';
import { MobileFormShellComponent } from '../../shared/mobile-form/mobile-form-shell.component';
import { ProcessStepItem, ProcessStepsComponent } from '../../shared/process-steps/process-steps.component';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { WorkflowGuideComponent } from '../../shared/workflow-guide/workflow-guide.component';

type FormLifecycleStatus = 'draft' | 'published' | 'archived';
type DesignerPhase = 'define' | 'fields' | 'publish' | 'preview';
type PersistenceMode = 'record' | 'service' | 'flow' | 'hybrid' | 'auth' | 'none' | 'submit_action';
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
type PresentationKit = 'auto' | 'primeng' | 'ionic' | 'material' | 'bootstrap' | 'native';
type ThemeMode = 'system' | 'light' | 'dark';
type DensityMode = 'comfortable' | 'compact' | 'spacious';
type DesktopLayoutMode = 'step_cards' | 'single_form' | 'wizard' | 'auto';
type MobileLayoutMode = 'step_screens' | 'single_scroll' | 'auto';
type FormWidth = 'compact' | 'standard' | 'wide' | 'full';
type FormAlign = 'left' | 'center' | 'right' | 'stretch';
type ActionPosition = 'inline' | 'footer' | 'bottom_sticky';
type ActionAlign = 'left' | 'center' | 'right' | 'stretch';
type ActionSize = 'sm' | 'md' | 'lg' | 'full' | 'field';
type ButtonTone = 'primary' | 'secondary' | 'success' | 'danger' | 'neutral';
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
  trashedAt?: string | null;
  trashedByUserId?: string | null;
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

interface DynamicServiceAuthoringResponse {
  artifactType: 'dynamic_service';
  id: string;
  key: string;
  published: boolean;
}

interface ServiceCatalogColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
}

interface ServiceCatalogTable {
  name: string;
  scope: 'tenant' | 'current_tenant' | 'global';
  source: 'entity' | 'schema';
  columns: ServiceCatalogColumn[];
}

interface ServiceCatalogResponse {
  tables: ServiceCatalogTable[];
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
  formWidth: FormWidth;
  formAlign: FormAlign;
  desktopMode: DesktopLayoutMode;
  desktopColumns: number;
  desktopFieldColumns: number;
  desktopActionPosition: ActionPosition;
  desktopActionAlign: ActionAlign;
  desktopActionSize: ActionSize;
  tabletFieldColumns: number;
  tabletActionPosition: ActionPosition;
  tabletActionAlign: ActionAlign;
  tabletActionSize: ActionSize;
  mobileMode: MobileLayoutMode;
  mobileActionPosition: ActionPosition;
  mobileActionAlign: ActionAlign;
  mobileActionSize: ActionSize;
  buttonTone: ButtonTone;
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
  authUserField: string;
  authPasswordField: string;
  authSuccessRoute: string;
  authErrorMessage: string;
  showSubmitFeedback: boolean;
  submitSuccessMessage: string;
  submitErrorMessage: string;
  customSubmitActionText: string;
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
    CatalogItemComponent,
    CodeTextareaComponent,
    DesignerCatalogPanelComponent,
    DesignerWorkspaceComponent,
    DynamicFieldControlComponent,
    FieldShellComponent,
    FormlyRuntimeComponent,
    JsonAuthoringPanelComponent,
    MobileFormShellComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    PreviewViewportComponent,
    ProcessStepsComponent,
    SectionHeaderComponent,
    StatusNoticeComponent,
    UiKitButtonComponent,
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
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
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
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 12px;
        text-align: left;
      }

      .template-card.active,
      .checklist-card.ready {
        border-color: var(--ch-color-success-border);
        background: var(--ch-color-success-soft);
      }

      .template-card strong,
      .helper-card strong,
      .checklist-card strong {
        color: var(--ch-color-text);
      }

      .template-card small,
      .helper-card small,
      .checklist-card small {
        color: var(--ch-color-muted);
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
        color: var(--ch-color-warning);
        line-height: 1.35;
      }

      .field-preview {
        display: grid;
        gap: 6px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .toggle-card {
        position: relative;
        display: flex;
        gap: 10px;
        align-items: center;
        min-height: 50px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
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
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 7px;
        background: var(--ch-color-surface);
        color: transparent;
        font-size: 0.82rem;
        line-height: 1;
      }

      .toggle-card input:checked + .toggle-mark {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      .toggle-card input:focus-visible + .toggle-mark {
        outline: 3px solid color-mix(in srgb, var(--ch-color-primary) 18%, transparent);
        outline-offset: 2px;
      }

      .toggle-copy {
        display: grid;
        gap: 2px;
      }

      .toggle-copy small {
        color: var(--ch-color-muted);
        font-weight: 500;
        line-height: 1.3;
      }

      .status-chip {
        display: inline-flex;
        gap: 6px;
        align-items: center;
        width: fit-content;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 4px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .status-chip.ready {
        border-color: var(--ch-color-success-border);
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
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
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .palette-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .palette-grid article {
        display: grid;
        gap: 4px;
        min-height: 66px;
        text-align: left;
        cursor: pointer;
      }

      .palette-grid article:focus-visible,
      .helper-card:focus-visible,
      .template-card:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--ch-color-primary) 22%, transparent);
        outline-offset: 2px;
      }

      .palette small,
      .inspector small {
        color: var(--ch-color-muted);
        line-height: 1.35;
      }

      .step-item,
      .field-item {
        display: grid;
        gap: 12px;
        border: 1px solid var(--ch-color-surface-muted);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .step-item.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      .field-item {
        background: var(--ch-color-surface);
      }

      .field-item.selected {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
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
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .preview-contract-card strong {
        color: var(--ch-color-text);
      }

      .preview-contract-card small {
        overflow-wrap: anywhere;
        color: var(--ch-color-muted);
        line-height: 1.35;
      }

      .preview-form-shell {
        display: grid;
        gap: 16px;
        min-height: 340px;
        align-content: start;
        padding: clamp(16px, 2vw, 24px);
      }

      .preview-form-header {
        display: grid;
        gap: 10px;
        border-bottom: 1px solid var(--ch-color-border);
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
        color: var(--ch-color-text);
        font-size: clamp(1.15rem, 1.45vw, 1.45rem);
        line-height: 1.15;
      }

      .preview-form-title p {
        max-width: 680px;
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .preview-form-shell.tablet-preview {
        padding: 16px;
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
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
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
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 8px 12px;
        font: inherit;
        font-weight: 850;
        cursor: pointer;
      }

      button.primary {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      button.danger {
        border-color: var(--ch-color-danger-border);
        color: var(--ch-color-danger);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .muted {
        margin: 0;
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .readiness-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: start;
        border: 1px solid var(--ch-color-border);
        border-left: 4px solid var(--ch-color-primary);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
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
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 4px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .json-panel.invalid,
      .live-json-card.invalid {
        border-color: var(--ch-color-danger-border);
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
        .field-row {
          grid-template-columns: 1fr;
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
          <app-ui-kit-button label="Refrescar" variant="outline" tone="neutral" (pressed)="refresh()"></app-ui-kit-button>
          <app-ui-kit-button label="Continuar" variant="outline" [disabled]="!nextPhase" (pressed)="goNext()"></app-ui-kit-button>
        </app-workflow-guide>

        <app-designer-workspace>
          <div designer-navigation>
            <app-designer-catalog-panel
              [title]="viewingTrash ? 'Papelera' : 'Formularios'"
              [summary]="forms.length + (forms.length === 1 ? ' formulario' : ' formularios')"
              [loading]="loading"
              loadingLabel="Cargando formularios"
              [loadingRows]="5"
              [empty]="!forms.length"
              [emptyTitle]="viewingTrash ? 'Papelera vacía' : 'Sin formularios todavía'"
              [emptyMessage]="
                viewingTrash
                  ? 'Los formularios enviados a papelera aparecerán aquí.'
                  : 'Crea el primero y publícalo para usarlo desde pantallas, flows o apps móviles.'
              "
              emptyTone="info"
              [showRetry]="false"
            >
              <app-ui-kit-button
                catalog-actions
                [label]="viewingTrash ? 'Activos' : 'Papelera'"
                variant="outline"
                tone="neutral"
                (pressed)="toggleTrash()"
              ></app-ui-kit-button>
              @if (!viewingTrash) {
                <app-ui-kit-button catalog-actions label="Nuevo" (pressed)="newForm()"></app-ui-kit-button>
              }
              @for (form of forms; track form.id) {
                <app-catalog-item
                  [title]="form.title"
                  [meta]="form.key + ' · ' + (form.trashedAt ? 'en papelera' : 'v' + form.version)"
                  [detail]="statusLabel(form)"
                  [active]="selected?.id === form.id"
                  (selected)="select(form)"
                ></app-catalog-item>
              }
            </app-designer-catalog-panel>
          </div>

          <div designer-workspace>
            @if (message) {
              <app-status-notice tone="success">{{ message }}</app-status-notice>
            }
            @if (error) {
              <app-status-notice tone="error">{{ error }}</app-status-notice>
            }
            @if (selected?.trashedAt) {
              <app-status-notice tone="warning" title="Formulario en papelera">
                Restaura este formulario para editar, versionar, publicar o probarlo.
                <app-ui-kit-button
                  notice-action
                  label="Restaurar formulario"
                  [disabled]="saving"
                  (pressed)="restoreForm()"
                ></app-ui-kit-button>
              </app-status-notice>
            } @else if (selected) {
              <app-status-notice tone="neutral" title="Administración del formulario">
                Puedes enviarlo a papelera sin perder su schema, versiones ni historial.
                <app-ui-kit-button
                  notice-action
                  label="Enviar a papelera"
                  variant="outline"
                  tone="danger"
                  [disabled]="saving"
                  (pressed)="trashForm()"
                ></app-ui-kit-button>
              </app-status-notice>
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
                    <article
                      role="button"
                      tabindex="0"
                      class="template-card"
                      [class.active]="draft.templateKey === template.key"
                      (click)="applyTemplate(template.key)"
                      (keydown.enter)="applyTemplate(template.key)"
                      (keydown.space)="applyTemplate(template.key)"
                    >
                      <span class="pill">{{ template.badge }}</span>
                      <strong>{{ template.title }}</strong>
                      <small>{{ template.description }}</small>
                    </article>
                  }
                </section>

                <div class="grid">
                  <app-dynamic-field-control
                    [field]="runtimeField('formKey', 'text', 'Key', 'cliente_onboarding')"
                    [value]="draft.key"
                    help="Identificador técnico estable. Ejemplo: cliente_onboarding."
                    [disabled]="!!selected"
                    (valueChange)="setDraftString('key', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formTitle', 'text', 'Título', 'Onboarding cliente')"
                    [value]="draft.title"
                    (valueChange)="setDraftString('title', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formCategory', 'text', 'Categoría', 'clientes')"
                    [value]="draft.category"
                    (valueChange)="setDraftString('category', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formSubmitLabel', 'text', 'Texto del botón', 'Guardar')"
                    [value]="draft.submitLabel"
                    (valueChange)="setDraftString('submitLabel', $event)"
                  ></app-dynamic-field-control>
                </div>

                <app-dynamic-field-control
                  [field]="runtimeField('formDescription', 'text', 'Descripción', 'Qué captura o resuelve este formulario')"
                  [value]="draft.description"
                  (valueChange)="setDraftString('description', $event)"
                ></app-dynamic-field-control>

                <app-section-header
                  title="Comportamiento visual"
                  description="Define cómo se adapta el mismo formulario en web y móvil. Puedes cambiarlo sin tocar código."
                ></app-section-header>

                <div class="grid three">
                  <app-dynamic-field-control
                    [field]="runtimeField('formKit', 'select', 'Kit visual', '', presentationKitOptions)"
                    [value]="draft.kit"
                    (valueChange)="setDraftValue('kit', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formTheme', 'select', 'Tema', '', themeOptions)"
                    [value]="draft.theme"
                    (valueChange)="setDraftString('theme', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formThemeMode', 'select', 'Modo', '', themeModeOptions)"
                    [value]="draft.themeMode"
                    (valueChange)="setDraftValue('themeMode', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formDensity', 'select', 'Densidad', '', densityOptions)"
                    [value]="draft.density"
                    (valueChange)="setDraftValue('density', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formDesktopMode', 'select', 'Web', '', desktopModeOptions)"
                    [value]="draft.desktopMode"
                    (valueChange)="setDraftValue('desktopMode', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formMobileMode', 'select', 'Móvil', '', mobileModeOptions)"
                    [value]="draft.mobileMode"
                    (valueChange)="setDraftValue('mobileMode', $event)"
                  ></app-dynamic-field-control>
                </div>

                <div class="grid three">
                  <app-dynamic-field-control
                    [field]="runtimeField('formWidth', 'select', 'Ancho formulario', '', formWidthOptions)"
                    [value]="draft.formWidth"
                    (valueChange)="setDraftValue('formWidth', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formAlign', 'select', 'Alineación', '', formAlignOptions)"
                    [value]="draft.formAlign"
                    (valueChange)="setDraftValue('formAlign', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formButtonTone', 'select', 'Color botón', '', buttonToneOptions)"
                    [value]="draft.buttonTone"
                    (valueChange)="setDraftValue('buttonTone', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formDesktopFieldColumns', 'select', 'Columnas web', '', columnOptions)"
                    [value]="draft.desktopFieldColumns"
                    (valueChange)="setDraftNumber('desktopFieldColumns', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formDesktopActionAlign', 'select', 'Botón web', '', actionAlignOptions)"
                    [value]="draft.desktopActionAlign"
                    (valueChange)="setDraftValue('desktopActionAlign', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formDesktopActionSize', 'select', 'Tamaño botón web', '', actionSizeOptions)"
                    [value]="draft.desktopActionSize"
                    (valueChange)="setDraftValue('desktopActionSize', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formTabletActionAlign', 'select', 'Botón tablet', '', actionAlignOptions)"
                    [value]="draft.tabletActionAlign"
                    (valueChange)="setDraftValue('tabletActionAlign', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formMobileActionAlign', 'select', 'Botón móvil', '', actionAlignOptions)"
                    [value]="draft.mobileActionAlign"
                    (valueChange)="setDraftValue('mobileActionAlign', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formMobileActionPosition', 'select', 'Posición móvil', '', mobileActionPositionOptions)"
                    [value]="draft.mobileActionPosition"
                    (valueChange)="setDraftValue('mobileActionPosition', $event)"
                  ></app-dynamic-field-control>
                </div>

                <div class="grid">
                  <app-dynamic-field-control
                    [field]="runtimeField('formPersistence', 'select', 'Qué hace al enviar', '', persistenceModeOptions)"
                    [value]="draft.persistenceMode"
                    help="Record es el default seguro para capturar datos. Service o Flow conectan lógica de negocio."
                    (valueChange)="setDraftValue('persistenceMode', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formIdempotency', 'text', 'Idempotencia', '{{input.email}}')"
                    [value]="draft.idempotencyKey"
                    help="Evita duplicados en reintentos u offline."
                    (valueChange)="setDraftString('idempotencyKey', $event)"
                  ></app-dynamic-field-control>
                </div>

                <div class="grid three">
                  <app-dynamic-field-control
                    [field]="runtimeField('formOffline', 'checkbox', 'Cola offline', 'Permite reintentar envíos desde móvil cuando no hay red.')"
                    [value]="draft.offlineEnabled"
                    (valueChange)="setDraftBoolean('offlineEnabled', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formAutosave', 'checkbox', 'Autosave', 'Reserva guardado parcial para formularios largos.')"
                    [value]="draft.autosave"
                    (valueChange)="setDraftBoolean('autosave', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formTimeout', 'number', 'Timeout ms', '10000')"
                    [value]="draft.timeoutMs"
                    (valueChange)="setDraftNumber('timeoutMs', $event)"
                  ></app-dynamic-field-control>
                </div>

                <div class="grid three">
                  <app-dynamic-field-control
                    [field]="runtimeField('formSubmitFeedback', 'checkbox', 'Mostrar respuesta', 'Presenta una alerta genérica después del submit.')"
                    [value]="draft.showSubmitFeedback"
                    (valueChange)="setDraftBoolean('showSubmitFeedback', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formSuccessMessage', 'text', 'Mensaje si guarda', 'Registro guardado correctamente.')"
                    [value]="draft.submitSuccessMessage"
                    [disabled]="!draft.showSubmitFeedback"
                    (valueChange)="setDraftString('submitSuccessMessage', $event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="runtimeField('formErrorMessage', 'text', 'Mensaje si falla', 'No se pudo guardar el registro.')"
                    [value]="draft.submitErrorMessage"
                    [disabled]="!draft.showSubmitFeedback"
                    (valueChange)="setDraftString('submitErrorMessage', $event)"
                  ></app-dynamic-field-control>
                </div>

                @if (draft.persistenceMode === 'record' || draft.persistenceMode === 'hybrid') {
                  <app-dynamic-field-control
                    [field]="runtimeField('formRecordType', 'text', 'Tipo de record', 'cliente_onboarding')"
                    [value]="draft.recordType"
                    (valueChange)="setDraftString('recordType', $event)"
                  ></app-dynamic-field-control>
                }
                @if (draft.persistenceMode === 'service') {
                  <app-dynamic-field-control
                    [field]="runtimeField('formServiceKey', availableServices.length ? 'select' : 'text', 'Servicio publicado', 'crear_cliente', serviceOptions)"
                    [value]="draft.serviceKey"
                    (valueChange)="setDraftString('serviceKey', $event)"
                  ></app-dynamic-field-control>
                }
                @if (draft.persistenceMode === 'flow') {
                  <app-dynamic-field-control
                    [field]="runtimeField('formFlowKey', availableFlows.length ? 'select' : 'text', 'Flow publicado', 'aprobar_solicitud', flowOptions)"
                    [value]="draft.flowKey"
                    (valueChange)="setDraftString('flowKey', $event)"
                  ></app-dynamic-field-control>
                }
                @if (draft.persistenceMode === 'auth') {
                  <div class="grid">
                    <app-dynamic-field-control
                      [field]="runtimeField('formAuthUserField', 'select', 'Campo usuario', '', draftFieldOptions)"
                      [value]="draft.authUserField"
                      help="Selecciona el campo del formulario que se enviará como usuario, correo o username."
                      (valueChange)="setDraftString('authUserField', $event)"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('formAuthPasswordField', 'select', 'Campo contraseña', '', draftFieldOptions)"
                      [value]="draft.authPasswordField"
                      help="Selecciona el campo tipo password o el campo que contiene la contraseña."
                      (valueChange)="setDraftString('authPasswordField', $event)"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('formAuthSuccessRoute', 'text', 'Ir a ruta', '/home')"
                      [value]="draft.authSuccessRoute"
                      help="Destino después de iniciar sesión correctamente."
                      (valueChange)="setDraftString('authSuccessRoute', $event)"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('formAuthErrorMessage', 'text', 'Mensaje si falla', 'No se pudo iniciar sesión.')"
                      [value]="draft.authErrorMessage"
                      (valueChange)="setDraftString('authErrorMessage', $event)"
                    ></app-dynamic-field-control>
                  </div>
                }
                @if (draft.persistenceMode === 'hybrid') {
                  <div class="grid">
                    <app-dynamic-field-control
                      [field]="runtimeField('formHybridAction', 'select', 'Después de guardar', '', hybridActionOptions)"
                      [value]="draft.hybridActionType"
                      help="El formulario crea primero el record y luego puede ejecutar un servicio o flow con el mismo input."
                      (valueChange)="setDraftValue('hybridActionType', $event)"
                    ></app-dynamic-field-control>
                    @if (draft.hybridActionType === 'execute_service') {
                      <app-dynamic-field-control
                        [field]="runtimeField('formHybridServiceKey', 'select', 'Servicio posterior', '', serviceOptions)"
                        [value]="draft.hybridServiceKey"
                        (valueChange)="setDraftString('hybridServiceKey', $event)"
                      ></app-dynamic-field-control>
                    }
                    @if (draft.hybridActionType === 'execute_flow') {
                      <app-dynamic-field-control
                        [field]="runtimeField('formHybridFlowKey', 'select', 'Flow posterior', '', flowOptions)"
                        [value]="draft.hybridFlowKey"
                        (valueChange)="setDraftString('hybridFlowKey', $event)"
                      ></app-dynamic-field-control>
                    }
                  </div>
                }

                @if (draft.persistenceMode === 'service' || draft.persistenceMode === 'flow') {
                  <div class="grid">
                    <app-code-textarea
                      controlId="form-payload-map"
                      label="Payload map"
                      [value]="draft.payloadMapText"
                      minHeight="132px"
                      (valueChange)="setDraftString('payloadMapText', $event)"
                    ></app-code-textarea>
                    <app-code-textarea
                      controlId="form-response-map"
                      label="Response map"
                      [value]="draft.responseMapText"
                      minHeight="132px"
                      (valueChange)="setDraftString('responseMapText', $event)"
                    ></app-code-textarea>
                  </div>
                }

                <app-section-header
                  title="Botones y acciones extra"
                  description="Agrega comandos que el usuario puede ejecutar sin cambiar el botón principal del formulario."
                >
                  <app-ui-kit-button label="Agregar botón" variant="outline" (pressed)="addCommand()"></app-ui-kit-button>
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
                          <app-ui-kit-button
                            label="Quitar"
                            tone="danger"
                            variant="outline"
                            (pressed)="removeCommand(commandIndex)"
                          ></app-ui-kit-button>
                        </div>
                        <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('commandKey' + commandIndex, 'text', 'Key', 'accion_aprobar')"
                            [value]="command.key"
                            (valueChange)="setCommandString(command, 'key', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('commandLabel' + commandIndex, 'text', 'Texto del botón', 'Aprobar')"
                            [value]="command.label"
                            (valueChange)="setCommandString(command, 'label', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('commandType' + commandIndex, 'select', 'Acción', '', commandTypeOptions)"
                            [value]="command.type"
                            (valueChange)="setCommandValue(command, 'type', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('commandResponse' + commandIndex, 'select', 'Respuesta', '', responseModeOptions)"
                            [value]="command.responseMode"
                            (valueChange)="setCommandValue(command, 'responseMode', $event)"
                          ></app-dynamic-field-control>
                        </div>
                        @if (command.type === 'execute_service') {
                          <app-dynamic-field-control
                            [field]="runtimeField('commandService' + commandIndex, 'select', 'Servicio publicado', '', serviceOptions)"
                            [value]="command.serviceKey"
                            (valueChange)="setCommandString(command, 'serviceKey', $event)"
                          ></app-dynamic-field-control>
                        }
                        @if (command.type === 'execute_flow') {
                          <app-dynamic-field-control
                            [field]="runtimeField('commandFlow' + commandIndex, 'select', 'Flow publicado', '', flowOptions)"
                            [value]="command.flowKey"
                            (valueChange)="setCommandString(command, 'flowKey', $event)"
                          ></app-dynamic-field-control>
                        }
                        @if (command.type !== 'show_message') {
                          <app-code-textarea
                            [controlId]="'command-payload-' + commandIndex"
                            label="Payload map"
                            [value]="command.payloadMapText"
                            minHeight="126px"
                            (valueChange)="setCommandString(command, 'payloadMapText', $event)"
                          ></app-code-textarea>
                        }
                        <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('commandPermission' + commandIndex, 'text', 'Permiso requerido', 'forms.submit')"
                            [value]="command.requiredPermission"
                            help="Opcional. Si el usuario no lo tiene, el botón no aparece."
                            (valueChange)="setCommandString(command, 'requiredPermission', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('commandRole' + commandIndex, 'text', 'Rol requerido', 'operator')"
                            [value]="command.requiredRole"
                            (valueChange)="setCommandString(command, 'requiredRole', $event)"
                          ></app-dynamic-field-control>
                        </div>
                        <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('commandRequiresValid' + commandIndex, 'checkbox', 'Requiere formulario válido', 'Valida obligatorios antes de ejecutar este botón.')"
                            [value]="command.requiresValidForm"
                            (valueChange)="setCommandBoolean(command, 'requiresValidForm', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('commandConfirm' + commandIndex, 'text', 'Confirmación', '¿Ejecutar esta acción?')"
                            [value]="command.confirmMessage"
                            help="Opcional. Pide confirmación antes de ejecutar."
                            (valueChange)="setCommandString(command, 'confirmMessage', $event)"
                          ></app-dynamic-field-control>
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
                  <app-ui-kit-button label="Agregar paso" variant="outline" (pressed)="addStep()"></app-ui-kit-button>
                </app-section-header>

                <div class="builder-grid">
                  <div class="step-list">
                    <section class="palette">
                    <app-section-header
                      title="Paleta de campos"
                      description="Agrega controles al paso activo. Luego ajusta sus detalles en el inspector."
                    ></app-section-header>
                      <div class="helper-grid">
                        <article role="button" tabindex="0" class="helper-card" (click)="addContactSet(activeStepIndex)" (keydown.enter)="addContactSet(activeStepIndex)" (keydown.space)="addContactSet(activeStepIndex)">
                          <strong>Agregar datos de contacto</strong>
                          <small>Nombre, email y teléfono en el paso activo.</small>
                        </article>
                        <article role="button" tabindex="0" class="helper-card" (click)="addAddressSet(activeStepIndex)" (keydown.enter)="addAddressSet(activeStepIndex)" (keydown.space)="addAddressSet(activeStepIndex)">
                          <strong>Agregar dirección</strong>
                          <small>Ciudad, dirección y observaciones.</small>
                        </article>
                        <article role="button" tabindex="0" class="helper-card" (click)="addApprovalSet(activeStepIndex)" (keydown.enter)="addApprovalSet(activeStepIndex)" (keydown.space)="addApprovalSet(activeStepIndex)">
                          <strong>Agregar decisión</strong>
                          <small>Estado, comentarios y fecha.</small>
                        </article>
                        <article role="button" tabindex="0" class="helper-card" (click)="addEvidenceSet(activeStepIndex)" (keydown.enter)="addEvidenceSet(activeStepIndex)" (keydown.space)="addEvidenceSet(activeStepIndex)">
                          <strong>Agregar evidencias</strong>
                          <small>Foto, archivo y ubicación GPS.</small>
                        </article>
                      </div>
                      <div class="palette-grid">
                        @for (item of fieldPalette; track item.type) {
                          <article role="button" tabindex="0" (click)="addFieldFromPalette(activeStepIndex, item)" (keydown.enter)="addFieldFromPalette(activeStepIndex, item)" (keydown.space)="addFieldFromPalette(activeStepIndex, item)">
                            <strong>{{ item.label }}</strong>
                            <small>{{ item.description }}</small>
                          </article>
                        }
                      </div>
                    </section>

                    @for (step of draft.steps; track step.key; let stepIndex = $index) {
                      <article class="step-item" [class.active]="activeStepIndex === stepIndex">
                        <div class="toolbar">
                          <app-ui-kit-button
                            [label]="'Editar ' + (step.title || step.key)"
                            variant="outline"
                            tone="neutral"
                            (pressed)="selectStep(stepIndex)"
                          ></app-ui-kit-button>
                          <div class="inline-actions">
                            <span class="pill">{{ step.fields.length }} campos</span>
                            <app-ui-kit-button
                              label="Quitar paso"
                              tone="danger"
                              variant="outline"
                              [disabled]="draft.steps.length === 1"
                              (pressed)="removeStep(stepIndex)"
                            ></app-ui-kit-button>
                          </div>
                        </div>

                        @if (activeStepIndex === stepIndex) {
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('stepKey' + stepIndex, 'text', 'Key del paso', 'datos_basicos')"
                              [value]="step.key"
                              (valueChange)="setStepString(step, 'key', $event)"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('stepTitle' + stepIndex, 'text', 'Título del paso', 'Datos básicos')"
                              [value]="step.title"
                              (valueChange)="setStepString(step, 'title', $event)"
                            ></app-dynamic-field-control>
                          </div>
                          <app-dynamic-field-control
                            [field]="runtimeField('stepDescription' + stepIndex, 'text', 'Descripción del paso', 'Información inicial')"
                            [value]="step.description"
                            (valueChange)="setStepString(step, 'description', $event)"
                          ></app-dynamic-field-control>

                          <div class="field-list">
                            @for (field of step.fields; track field.key; let fieldIndex = $index) {
                              <article
                                class="field-item"
                                [class.selected]="activeStepIndex === stepIndex && activeFieldIndex === fieldIndex"
                              >
                                <div class="toolbar">
                                  <app-ui-kit-button
                                    [label]="field.label || field.key"
                                    variant="ghost"
                                    tone="neutral"
                                    (pressed)="selectField(stepIndex, fieldIndex)"
                                  ></app-ui-kit-button>
                                  <div class="field-actions">
                                    <span class="pill">{{ field.type }} · {{ field.layout }}</span>
                                    <app-ui-kit-button label="Subir" variant="outline" tone="neutral" [disabled]="fieldIndex === 0" (pressed)="moveField(stepIndex, fieldIndex, -1)"></app-ui-kit-button>
                                    <app-ui-kit-button label="Bajar" variant="outline" tone="neutral" [disabled]="fieldIndex === step.fields.length - 1" (pressed)="moveField(stepIndex, fieldIndex, 1)"></app-ui-kit-button>
                                    <app-ui-kit-button label="Duplicar" variant="outline" tone="neutral" (pressed)="duplicateField(stepIndex, fieldIndex)"></app-ui-kit-button>
                                    <app-ui-kit-button label="Quitar" tone="danger" variant="outline" (pressed)="removeField(stepIndex, fieldIndex)"></app-ui-kit-button>
                                  </div>
                                </div>
                                <p class="muted">{{ field.key }} · {{ field.required ? 'obligatorio' : 'opcional' }}</p>
                              </article>
                            }
                          </div>
                          <app-ui-kit-button label="Agregar campo básico" variant="outline" (pressed)="addField(stepIndex)"></app-ui-kit-button>
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
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldKey', 'text', 'Key', 'nombre')"
                        [value]="selectedField.key"
                        (valueChange)="setFieldString(selectedField, 'key', $event)"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldLabel', 'text', 'Etiqueta', 'Nombre')"
                        [value]="selectedField.label"
                        (valueChange)="setFieldString(selectedField, 'label', $event)"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldType', 'select', 'Tipo', '', fieldTypeOptions)"
                        [value]="selectedField.type"
                        (valueChange)="setFieldValue(selectedField, 'type', $event)"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldLayout', 'select', 'Layout', '', fieldLayoutOptions)"
                        [value]="selectedField.layout"
                        (valueChange)="setFieldValue(selectedField, 'layout', $event)"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldRequired', 'checkbox', 'Campo obligatorio', 'El usuario no podrá avanzar si lo deja vacío.')"
                        [value]="selectedField.required"
                        (valueChange)="setFieldBoolean(selectedField, 'required', $event)"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldPlaceholder', 'text', 'Placeholder', 'Escribe un valor')"
                        [value]="selectedField.placeholder"
                        (valueChange)="setFieldString(selectedField, 'placeholder', $event)"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldHelp', 'text', 'Ayuda', 'Texto de ayuda')"
                        [value]="selectedField.help"
                        (valueChange)="setFieldString(selectedField, 'help', $event)"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldDefault', 'text', 'Valor por defecto', 'Ejemplo')"
                        [value]="selectedField.defaultValue"
                        (valueChange)="setFieldString(selectedField, 'defaultValue', $event)"
                      ></app-dynamic-field-control>

                      @if (
                        selectedField.type === 'text' ||
                        selectedField.type === 'email' ||
                        selectedField.type === 'textarea' ||
                        selectedField.type === 'tel' ||
                        selectedField.type === 'url' ||
                        selectedField.type === 'password'
                      ) {
                        <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('selectedFieldMinLength', 'number', 'Mín. caracteres', '0')"
                            [value]="selectedField.minLength"
                            (valueChange)="setFieldNumber(selectedField, 'minLength', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('selectedFieldMaxLength', 'number', 'Máx. caracteres', '180')"
                            [value]="selectedField.maxLength"
                            (valueChange)="setFieldNumber(selectedField, 'maxLength', $event)"
                          ></app-dynamic-field-control>
                        </div>
                      }

                      @if (selectedField.type === 'number' || selectedField.type === 'currency') {
                        <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('selectedFieldMin', 'number', 'Mínimo', '0')"
                            [value]="selectedField.min"
                            (valueChange)="setFieldNumber(selectedField, 'min', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('selectedFieldMax', 'number', 'Máximo', '100')"
                            [value]="selectedField.max"
                            (valueChange)="setFieldNumber(selectedField, 'max', $event)"
                          ></app-dynamic-field-control>
                        </div>
                      }

                      @if (selectedField.type === 'select' || selectedField.type === 'radio') {
                        <app-section-header
                          title="Opciones"
                          description="Usa opciones fijas o conecta un servicio publicado para cargarlas."
                        >
                          <app-ui-kit-button label="Agregar opción" variant="outline" (pressed)="addOption(selectedField)"></app-ui-kit-button>
                        </app-section-header>
                        @for (option of selectedField.options; track $index; let optionIndex = $index) {
                          <div class="option-row">
                            <app-dynamic-field-control
                              [field]="runtimeField('optionLabel' + optionIndex, 'text', 'Texto', 'Cliente')"
                              [value]="option.label"
                              (valueChange)="setOptionString(option, 'label', $event)"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('optionValue' + optionIndex, 'text', 'Valor', 'client')"
                              [value]="option.value"
                              (valueChange)="setOptionString(option, 'value', $event)"
                            ></app-dynamic-field-control>
                            <app-ui-kit-button
                              label="Quitar"
                              tone="danger"
                              variant="outline"
                              (pressed)="removeOption(selectedField, optionIndex)"
                            ></app-ui-kit-button>
                          </div>
                        }
                        <app-dynamic-field-control
                          [field]="runtimeField('selectedFieldDataSource', 'select', 'Servicio para opciones', '', serviceOptions)"
                          [value]="selectedField.dataSourceServiceKey"
                          (valueChange)="setFieldString(selectedField, 'dataSourceServiceKey', $event)"
                        ></app-dynamic-field-control>
                      }

                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldValidationService', 'select', 'Servicio para validar', '', serviceOptions)"
                        [value]="selectedField.validationServiceKey"
                        (valueChange)="setFieldString(selectedField, 'validationServiceKey', $event)"
                      ></app-dynamic-field-control>

                      <app-section-header
                        title="Condición visual"
                        description="Muestra este campo solo cuando otro campo cumpla una condición."
                      ></app-section-header>
                      <app-dynamic-field-control
                        [field]="runtimeField('selectedFieldVisibleField', 'select', 'Depende de', '', visibleFieldOptions)"
                        [value]="selectedField.visibleWhenField"
                        (valueChange)="setFieldString(selectedField, 'visibleWhenField', $event)"
                      ></app-dynamic-field-control>
                      @if (selectedField.visibleWhenField) {
                        <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('selectedFieldVisibleOperator', 'select', 'Operador', '', conditionOperatorOptions)"
                            [value]="selectedField.visibleWhenOperator"
                            (valueChange)="setFieldValue(selectedField, 'visibleWhenOperator', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('selectedFieldVisibleValue', 'text', 'Valor', 'approved')"
                            [value]="selectedField.visibleWhenValue"
                            (valueChange)="setFieldString(selectedField, 'visibleWhenValue', $event)"
                          ></app-dynamic-field-control>
                        </div>
                      }
                      <app-section-header
                        title="Acceso del campo"
                        description="Permite ocultar o dejar en solo lectura un campo según rol o permiso."
                      ></app-section-header>
                      <div class="grid">
                        <app-dynamic-field-control
                          [field]="runtimeField('selectedFieldPermission', 'text', 'Permiso para ver', 'forms.read_sensitive')"
                          [value]="selectedField.requiredPermission"
                          (valueChange)="setFieldString(selectedField, 'requiredPermission', $event)"
                        ></app-dynamic-field-control>
                        <app-dynamic-field-control
                          [field]="runtimeField('selectedFieldRole', 'text', 'Rol para ver', 'admin')"
                          [value]="selectedField.requiredRole"
                          (valueChange)="setFieldString(selectedField, 'requiredRole', $event)"
                        ></app-dynamic-field-control>
                        <app-dynamic-field-control
                          [field]="runtimeField('selectedFieldReadonlyPermission', 'text', 'Permiso para editar', 'forms.edit_sensitive')"
                          [value]="selectedField.readonlyPermission"
                          (valueChange)="setFieldString(selectedField, 'readonlyPermission', $event)"
                        ></app-dynamic-field-control>
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
                  <app-ui-kit-button
                    label="Guardar borrador"
                    [disabled]="saving || !canSave"
                    (pressed)="save()"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Crear versión"
                    variant="outline"
                    [disabled]="!selected || saving || !canCreateVersion"
                    (pressed)="createVersion()"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Publicar última versión"
                    variant="outline"
                    [disabled]="!latestVersion || saving || !canPublish"
                    (pressed)="publishLatest()"
                  ></app-ui-kit-button>
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
                      @if (previewMode === 'mobile') {
                        <app-mobile-form-shell
                          [eyebrow]="previewDeviceLabel"
                          [title]="previewForm.title"
                          [description]="draft.description || 'Formulario sin descripción todavía.'"
                        >
                          <app-formly-runtime
                            [definition]="previewForm"
                            [model]="previewModel"
                            [presentation]="previewPresentation"
                            [viewportWidth]="previewWidth"
                            [submitLabel]="previewSubmitLabel"
                            (modelChange)="previewModel = $event"
                            (submitted)="submitPreview($event)"
                          ></app-formly-runtime>
                        </app-mobile-form-shell>
                      } @else {
                        <section class="preview-form-shell" [class.tablet-preview]="previewMode === 'tablet'">
                          <header class="preview-form-header">
                            <div class="preview-form-title">
                              <span class="pill">{{ previewDeviceLabel }}</span>
                              <h2>{{ previewForm.title }}</h2>
                              <p>{{ draft.description || 'Formulario sin descripción todavía.' }}</p>
                            </div>
                          </header>
                          <app-formly-runtime
                            [definition]="previewForm"
                            [model]="previewModel"
                            [presentation]="previewPresentation"
                            [viewportWidth]="previewWidth"
                            [submitLabel]="previewSubmitLabel"
                            (modelChange)="previewModel = $event"
                            (submitted)="submitPreview($event)"
                          ></app-formly-runtime>
                        </section>
                      }
                    } @else {
                      <app-status-notice tone="warning">
                        Agrega campos para construir una vista previa real.
                      </app-status-notice>
                    }
                  </app-preview-viewport>
                  @if (previewSubmitError) {
                    <app-status-notice tone="error">{{ previewSubmitError }}</app-status-notice>
                  }
                  @if (previewSubmitMessage) {
                    <app-status-notice tone="success">{{ previewSubmitMessage }}</app-status-notice>
                  }
                </div>

                <section class="test-panel">
                  <app-section-header
                    stepLabel="Prueba real"
                    title="Ejecuta el submit contra backend"
                    description="Guarda el borrador, prepara datos de ejemplo y ejecuta el runtime seguro del formulario."
                  >
                    <app-ui-kit-button
                      label="Usar datos del preview"
                      variant="outline"
                      tone="neutral"
                      (pressed)="usePreviewAsFixture()"
                    ></app-ui-kit-button>
                    <app-ui-kit-button
                      label="Generar ejemplo"
                      variant="outline"
                      tone="neutral"
                      (pressed)="generateExampleFixture()"
                    ></app-ui-kit-button>
                    <app-ui-kit-button
                      label="Probar submit"
                      [disabled]="testing || !selected || !!selected.trashedAt"
                      (pressed)="runSubmitTest()"
                    ></app-ui-kit-button>
                  </app-section-header>

                  @if (!selected) {
                    <app-status-notice tone="warning">
                      Primero guarda el formulario para obtener una key real y poder ejecutar el endpoint.
                    </app-status-notice>
                  }

                  <div class="test-grid">
                    <app-code-textarea
                      controlId="submit-test-input"
                      label="Input de prueba"
                      [value]="submitTestInputText"
                      minHeight="180px"
                      (valueChange)="submitTestInputText = $event; submitTestPassed = false"
                    ></app-code-textarea>
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
              [draftDisabled]="saving || !!selected?.trashedAt"
              [publishDisabled]="saving || !!selected?.trashedAt"
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
export class FormsPageComponent implements OnDestroy, OnInit {
  private readonly api = inject(ApiClientService);
  private readonly runtime = inject(FormRuntimeService);
  private readonly serviceClient = inject(DynamicServiceClientService);
  private readonly flowClient = inject(DynamicFlowClientService);
  private readonly assistant = inject(AiAssistantService);

  forms: DynamicFormItem[] = [];
  availableServices: AvailableDynamicService[] = [];
  availableFlows: AvailableDynamicFlow[] = [];
  tableCatalog: ServiceCatalogTable[] = [];
  tableCatalogStatus: 'idle' | 'loaded' | 'error' = 'idle';
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
  previewSubmitMessage = '';
  previewSubmitError = '';
  testing = false;
  submitTestPassed = false;
  viewingTrash = false;
  jsonText = '';
  draft: FormDraft = this.blankDraft();
  previewPresentation: UiPresentationConfig = this.buildPreviewPresentation();
  readonly fieldPalette = FIELD_PALETTE;
  readonly formTemplates = FORM_TEMPLATES;
  readonly installedThemes = INSTALLED_UI_THEMES;
  private appliedAssistantProposalId = 0;
  private readonly unregisterAssistantState = this.assistant.registerScreenStateProvider('forms', () =>
    this.assistantScreenState()
  );
  private readonly assistantProposalEffect = effect(() => {
    const proposal = this.assistant.proposal();
    if (!proposal || proposal.id === this.appliedAssistantProposalId || proposal.scope !== 'forms') {
      return;
    }

    this.appliedAssistantProposalId = proposal.id;
    void this.applyAssistantProposal(proposal.actions);
  });

  readonly processItems: ProcessStepItem[] = [
    { key: 'define', label: 'Definir', summary: 'Identidad y salida' },
    { key: 'fields', label: 'Campos', summary: 'Pasos y controles' },
    { key: 'publish', label: 'Publicar', summary: 'Versión estable' },
    { key: 'preview', label: 'Preview', summary: 'Web y móvil' }
  ];

  readonly presentationKitOptions = [
    { label: 'Automático', value: 'auto' },
    { label: 'PrimeNG web', value: 'primeng' },
    { label: 'Ionic móvil', value: 'ionic' },
    { label: 'Material', value: 'material' },
    { label: 'Bootstrap', value: 'bootstrap' },
    { label: 'Nativo accesible', value: 'native' }
  ];

  readonly themeModeOptions = [
    { label: 'Sistema', value: 'system' },
    { label: 'Claro', value: 'light' },
    { label: 'Oscuro', value: 'dark' }
  ];

  readonly densityOptions = [
    { label: 'Cómoda', value: 'comfortable' },
    { label: 'Compacta', value: 'compact' },
    { label: 'Amplia', value: 'spacious' }
  ];

  readonly desktopModeOptions = [
    { label: 'Pasos como cards', value: 'step_cards' },
    { label: 'Formulario continuo', value: 'single_form' },
    { label: 'Wizard', value: 'wizard' },
    { label: 'Automático', value: 'auto' }
  ];

  readonly mobileModeOptions = [
    { label: 'Un paso por pantalla', value: 'step_screens' },
    { label: 'Scroll continuo', value: 'single_scroll' },
    { label: 'Automático', value: 'auto' }
  ];

  readonly formWidthOptions = [
    { label: 'Compacto', value: 'compact' },
    { label: 'Estándar', value: 'standard' },
    { label: 'Amplio', value: 'wide' },
    { label: 'Todo el ancho', value: 'full' }
  ];

  readonly formAlignOptions = [
    { label: 'Izquierda', value: 'left' },
    { label: 'Centro', value: 'center' },
    { label: 'Derecha', value: 'right' },
    { label: 'Estirar', value: 'stretch' }
  ];

  readonly buttonToneOptions = [
    { label: 'Primario azul', value: 'primary' },
    { label: 'Secundario', value: 'secondary' },
    { label: 'Verde', value: 'success' },
    { label: 'Rojo', value: 'danger' },
    { label: 'Neutral', value: 'neutral' }
  ];

  readonly columnOptions = [
    { label: '1 columna', value: 1 },
    { label: '2 columnas', value: 2 },
    { label: '3 columnas', value: 3 }
  ];

  readonly actionAlignOptions = [
    { label: 'Izquierda', value: 'left' },
    { label: 'Centro', value: 'center' },
    { label: 'Derecha', value: 'right' },
    { label: 'Ancho completo', value: 'stretch' }
  ];

  readonly actionSizeOptions = [
    { label: 'Pequeño', value: 'sm' },
    { label: 'Medio', value: 'md' },
    { label: 'Grande', value: 'lg' },
    { label: 'Igual que inputs', value: 'field' },
    { label: 'Completo', value: 'full' }
  ];

  readonly mobileActionPositionOptions = [
    { label: 'Fijo abajo', value: 'bottom_sticky' },
    { label: 'Al final', value: 'footer' },
    { label: 'En línea', value: 'inline' }
  ];

  readonly persistenceModeOptions = [
    { label: 'Guardar record genérico', value: 'record' },
    { label: 'Ejecutar servicio dinámico', value: 'service' },
    { label: 'Ejecutar flow', value: 'flow' },
    { label: 'Iniciar sesión', value: 'auth' },
    { label: 'Guardar record y orquestar después', value: 'hybrid' },
    { label: 'Acción segura del backend', value: 'submit_action' },
    { label: 'Solo validar / consultar', value: 'none' }
  ];

  readonly hybridActionOptions = [
    { label: 'Solo guardar record', value: 'none' },
    { label: 'Ejecutar servicio', value: 'execute_service' },
    { label: 'Ejecutar flow', value: 'execute_flow' }
  ];

  readonly commandTypeOptions = [
    { label: 'Ejecutar servicio', value: 'execute_service' },
    { label: 'Ejecutar flow', value: 'execute_flow' },
    { label: 'Mostrar mensaje', value: 'show_message' }
  ];

  readonly responseModeOptions = [
    { label: 'Mostrar respuesta', value: 'show_response' },
    { label: 'Silenciosa', value: 'silent' }
  ];

  readonly fieldTypeOptions = [
    { label: 'Texto', value: 'text' },
    { label: 'Email', value: 'email' },
    { label: 'Número', value: 'number' },
    { label: 'Moneda', value: 'currency' },
    { label: 'Teléfono', value: 'tel' },
    { label: 'URL', value: 'url' },
    { label: 'Password', value: 'password' },
    { label: 'Textarea', value: 'textarea' },
    { label: 'Select', value: 'select' },
    { label: 'Opciones radio', value: 'radio' },
    { label: 'Check', value: 'checkbox' },
    { label: 'Switch', value: 'toggle' },
    { label: 'Fecha', value: 'date' },
    { label: 'Hora', value: 'time' },
    { label: 'Fecha y hora', value: 'datetime' },
    { label: 'Archivo', value: 'file' },
    { label: 'Imagen', value: 'image' },
    { label: 'GPS', value: 'gps' }
  ];

  readonly fieldLayoutOptions = [
    { label: 'Completo', value: 'full' },
    { label: 'Mitad', value: 'half' },
    { label: 'Tercio', value: 'third' }
  ];

  readonly conditionOperatorOptions = [
    { label: 'Igual a', value: 'equals' },
    { label: 'Distinto de', value: 'not_equals' },
    { label: 'Tiene valor / verdadero', value: 'truthy' },
    { label: 'Vacío / falso', value: 'falsy' },
    { label: 'Contiene', value: 'contains' }
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

  get allDraftFields() {
    return this.draft.steps.flatMap((step) => step.fields);
  }

  get persistenceLabel() {
    const labels: Record<PersistenceMode, string> = {
      record: 'guarda record',
      service: 'usa servicio',
      flow: 'usa flow',
      auth: 'inicia sesión',
      hybrid: 'record + orquestación',
      submit_action: 'acción segura',
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
    if (this.draft.persistenceMode === 'auth') {
      if (!this.draft.authUserField) {
        issues.push('Selecciona el campo que se enviará como usuario para iniciar sesión.');
      }
      if (!this.draft.authPasswordField) {
        issues.push('Selecciona el campo que se enviará como contraseña.');
      }
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
      auth: `Inicia sesión con ${this.draft.authUserField || 'usuario'} y navega a ${this.draft.authSuccessRoute || '/home'}.`,
      hybrid: 'Guarda record y luego ejecuta orquestación.',
      submit_action: 'Ejecuta una acción segura del backend.',
      none: 'Solo devuelve payload validado al componente.'
    };
    return details[this.draft.persistenceMode];
  }

  get previewSubmitLabel() {
    const runtimeLabel = this.previewForm?.runtime?.['submitLabel'];
    return typeof runtimeLabel === 'string' && runtimeLabel.trim()
      ? runtimeLabel
      : this.draft.submitLabel || 'Enviar';
  }

  ngOnInit() {
    this.syncJson();
    this.loadDynamicTargets();
    this.refresh();
  }

  ngOnDestroy() {
    this.unregisterAssistantState();
    this.assistantProposalEffect.destroy();
  }

  asString(value: unknown) {
    return value === null || value === undefined ? '' : String(value);
  }

  asBoolean(value: unknown) {
    return value === true || value === 'true' || value === '1' || value === 1;
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

  get themeOptions() {
    return this.installedThemes.map((theme) => ({
      label: theme.label,
      value: theme.key
    }));
  }

  get serviceOptions() {
    return [
      { label: 'Selecciona un servicio', value: '' },
      ...this.availableServices.map((service) => ({
        label: `${service.name} · v${service.version}`,
        value: service.key
      }))
    ];
  }

  get flowOptions() {
    return [
      { label: 'Selecciona un flow', value: '' },
      ...this.availableFlows.map((flow) => ({
        label: flow.name,
        value: flow.key
      }))
    ];
  }

  get draftFieldOptions() {
    return [
      { label: 'Selecciona un campo', value: '' },
      ...this.allDraftFields.map((field) => ({
        label: field.label || field.key,
        value: field.key
      }))
    ];
  }

  get visibleFieldOptions() {
    return [
      { label: 'Siempre visible', value: '' },
      ...this.conditionFieldKeys.map((key) => ({
        label: key,
        value: key
      }))
    ];
  }

  setDraftValue(key: keyof FormDraft, value: unknown) {
    (this.draft as unknown as Record<string, unknown>)[key] = value;
    this.syncJson();
  }

  setDraftString(key: keyof FormDraft, value: unknown) {
    this.setDraftValue(key, this.asString(value));
  }

  setDraftBoolean(key: keyof FormDraft, value: unknown) {
    this.setDraftValue(key, this.asBoolean(value));
  }

  setDraftNumber(key: keyof FormDraft, value: unknown) {
    this.setDraftValue(key, this.asNumber(value) ?? 0);
  }

  setCommandValue(command: FormCommandDraft, key: keyof FormCommandDraft, value: unknown) {
    (command as unknown as Record<string, unknown>)[key] = value;
    this.syncJson();
  }

  setCommandString(command: FormCommandDraft, key: keyof FormCommandDraft, value: unknown) {
    this.setCommandValue(command, key, this.asString(value));
  }

  setCommandBoolean(command: FormCommandDraft, key: keyof FormCommandDraft, value: unknown) {
    this.setCommandValue(command, key, this.asBoolean(value));
  }

  setStepString(step: StepDraft, key: keyof StepDraft, value: unknown) {
    (step as unknown as Record<string, unknown>)[key] = this.asString(value);
    this.syncJson();
  }

  setFieldValue(field: FieldDraft, key: keyof FieldDraft, value: unknown) {
    (field as unknown as Record<string, unknown>)[key] = value;
    this.syncJson();
  }

  setFieldString(field: FieldDraft, key: keyof FieldDraft, value: unknown) {
    this.setFieldValue(field, key, this.asString(value));
  }

  setFieldBoolean(field: FieldDraft, key: keyof FieldDraft, value: unknown) {
    this.setFieldValue(field, key, this.asBoolean(value));
  }

  setFieldNumber(field: FieldDraft, key: keyof FieldDraft, value: unknown) {
    this.setFieldValue(field, key, this.asNumber(value) ?? 0);
  }

  setOptionString(option: FieldOptionDraft, key: keyof FieldOptionDraft, value: unknown) {
    option[key] = this.asString(value);
    this.syncJson();
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
    const endpoint = this.viewingTrash ? 'forms/trash' : 'forms';
    this.api.get<DynamicFormItem[]>(endpoint).subscribe({
      next: (forms) => {
        this.forms = forms;
        this.loading = false;
        if (this.selected) {
          const fresh = forms.find((form) => form.id === this.selected?.id);
          if (fresh) {
            this.select(fresh);
          } else if (forms.length) {
            this.select(forms[0]);
          } else if (this.viewingTrash) {
            this.selected = undefined;
            this.latestVersion = undefined;
          } else {
            this.newForm();
          }
        } else if (forms.length) {
          this.select(forms[0]);
        } else if (!this.viewingTrash) {
          this.newForm();
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
    this.viewingTrash = false;
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

  toggleTrash() {
    this.viewingTrash = !this.viewingTrash;
    this.selected = undefined;
    this.latestVersion = undefined;
    this.message = '';
    this.error = '';
    this.refresh();
  }

  trashForm() {
    if (!this.selected) {
      return;
    }
    this.saving = true;
    this.error = '';
    this.api.post<DynamicFormItem>(`forms/${this.selected.id}/trash`, {}).subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Formulario enviado a papelera.';
        this.selected = undefined;
        this.latestVersion = undefined;
        this.refresh();
      },
      error: () => {
        this.saving = false;
        this.error = 'No se pudo enviar el formulario a papelera.';
      }
    });
  }

  restoreForm(overwrite = false) {
    if (!this.selected) {
      return;
    }
    this.saving = true;
    this.error = '';
    this.api.post<DynamicFormItem>(`forms/${this.selected.id}/restore`, { overwrite }).subscribe({
      next: (form) => {
        this.saving = false;
        this.viewingTrash = false;
        this.message = 'Formulario restaurado.';
        this.selected = form;
        this.refresh();
      },
      error: (error) => {
        this.saving = false;
        if (!overwrite && this.isRestoreConflict(error)) {
          const accepted = window.confirm(
            'Ya existe un formulario activo con esa key. ¿Quieres enviar el activo a papelera y restaurar este formulario?'
          );
          if (accepted) {
            this.restoreForm(true);
            return;
          }
        }
        this.error = this.errorMessage(error);
      }
    });
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

  submitPreview(input: Record<string, unknown>) {
    this.previewModel = { ...input };
    this.submitTestInputText = JSON.stringify(this.previewModel, null, 2);
    this.previewSubmitMessage = '';
    this.previewSubmitError = '';
    this.submitTestMessage = '';
    this.submitTestError = '';
    this.submitTestOutputText = '';
    this.submitTestPassed = false;

    let document: Record<string, unknown>;
    try {
      document = JSON.parse(this.jsonText || '{}') as Record<string, unknown>;
    } catch {
      this.previewSubmitError = 'El JSON del formulario no es válido. Corrígelo antes de probar.';
      return;
    }

    this.testing = true;
    this.saving = true;
    this.previewSubmitMessage = 'Guardando draft antes de ejecutar...';
    this.api
      .post<DynamicFormAuthoringResponse>('forms/authoring/json', {
        document,
        publish: false
      })
      .subscribe({
        next: (response) => {
          this.selected = response.form;
          this.latestVersion = response.version ?? undefined;
          this.forms = this.upsertForm(this.forms, response.form);
          this.draft = this.draftFromSchema(response.form);
          this.jsonText = JSON.stringify(response.form.schema, null, 2);
          this.saving = false;
          this.executePreviewSubmit(response.form.key, input);
        },
        error: (error) => {
          this.saving = false;
          this.testing = false;
          this.previewSubmitMessage = '';
          this.previewSubmitError = `No se pudo guardar el draft antes de ejecutar. ${this.errorMessage(error)}`;
        }
      });
  }

  private executePreviewSubmit(formKey: string, input: Record<string, unknown>) {
    const startedAt = performance.now();
    this.api
      .post<Record<string, unknown>>(`forms/by-key/${encodeURIComponent(formKey)}/submit`, {
        input,
        idempotencyKey: `designer:${formKey}:${Date.now()}`
      })
      .subscribe({
        next: (output) => {
          const durationMs = Math.round(performance.now() - startedAt);
          this.submitTestOutputText = JSON.stringify({ ok: true, durationMs, output }, null, 2);
          this.submitTestMessage = this.submitSuccessMessage(durationMs, output);
          this.previewSubmitMessage = this.submitSuccessMessage(durationMs, output, this.submitFeedbackMessage('success'));
          this.previewSubmitError = '';
          this.submitTestPassed = true;
          this.testing = false;
        },
        error: (response) => {
          const durationMs = Math.round(performance.now() - startedAt);
          const detail = this.errorMessage(response);
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
          this.previewSubmitMessage = '';
          this.previewSubmitError = `${this.submitFeedbackMessage('error') || 'No se pudo ejecutar el formulario.'} ${detail}`;
          this.submitTestPassed = false;
          this.testing = false;
        }
      });
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
          this.submitTestMessage = this.submitSuccessMessage(durationMs, output);
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

  private async applyAssistantProposal(actions: AiAssistantUiAction[]) {
    const schemaActions = actions.filter((item): item is ApplySchemaChangeAction => item.type === 'apply_schema_change');
    for (const action of schemaActions) {
      try {
        await firstValueFrom(
          this.api.post('database/schema/apply', action.request)
        );
        this.message = `Chicle AI creó la tabla ${action.tableName}, registró el historial y generó la migración TypeORM.`;
      } catch (error) {
        this.error = `No se pudo crear la tabla ${action.tableName}. ${this.errorMessage(error)}`;
        return;
      }
    }

    if (schemaActions.length) {
      this.loadDynamicTargets();
    }

    const serviceActions = actions.filter(
      (item): item is ApplyDynamicServiceJsonAction => item.type === 'apply_dynamic_service_json'
    );
    if (serviceActions.length) {
      this.applyAssistantCompanionServices(serviceActions);
    }

    const action = actions.find((item): item is ApplyDynamicFormJsonAction => item.type === 'apply_dynamic_form_json');
    if (action) {
      this.applyAssistantFormProposal(action);
    }
  }

  private applyAssistantFormProposal(action: ApplyDynamicFormJsonAction) {
    this.viewingTrash = false;
    this.selected = undefined;
    this.latestVersion = undefined;
    this.jsonText = JSON.stringify(action.document, null, 2);
    this.applyJson();
    this.phase = 'define';
    this.error = '';
    this.jsonError = '';
    this.message =
      'Chicle AI aplicó una propuesta al diseñador. Revisa la guía, el preview y el JSON; luego usa Guardar draft o Guardar y publicar.';
  }

  private applyAssistantCompanionServices(actions: ApplyDynamicServiceJsonAction[]) {
    for (const action of actions) {
      this.api
        .post<DynamicServiceAuthoringResponse>('dynamic-services/authoring/json', {
          key: action.key,
          name: action.name,
          description: action.description ?? null,
          active: true,
          document: action.document,
          publish: action.publish
        })
        .subscribe({
          next: () => {
            this.loadDynamicTargets();
          },
          error: (error) => {
            this.error = `No se pudo preparar el servicio companion ${action.key}. ${this.errorMessage(error)}`;
          }
        });
    }
  }

  private assistantScreenState() {
    return {
      mode: this.selected ? 'editing_existing_form' : 'new_form',
      selected: this.selected
        ? {
            key: this.selected.key,
            title: this.selected.title,
            published: this.selected.published
          }
        : null,
      draft: {
        key: this.draft.key,
        title: this.draft.title,
        description: this.draft.description,
        category: this.draft.category
      },
      schema: this.safeJson(),
      availableServices: this.availableServices.map((service) => ({
        key: service.key,
        name: service.name,
        hasPublishedVersion: service.version > 0
      })),
      availableFlows: this.availableFlows.map((flow) => ({
        key: flow.key,
        name: flow.name,
        hasPublishedVersion: Boolean(flow.publishedVersionId)
      })),
      tables: this.tableCatalog.map((table) => ({
        name: table.name,
        scope: table.scope,
        columns: table.columns.map((column) => ({
          name: column.name,
          type: column.type,
          nullable: column.nullable,
          primary: column.primary
        }))
      })),
      tableCatalogStatus: this.tableCatalogStatus
    };
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
    if (this.selected?.trashedAt) {
      this.error = 'Restaura el formulario antes de guardar o publicar.';
      return;
    }
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
        error: (error) => {
          const detail = this.errorMessage(error);
          this.error = publish
            ? `No se pudo guardar y publicar desde JSON. ${detail}`
            : `No se pudo guardar el draft desde JSON. ${detail}`;
          this.saving = false;
        }
      });
  }

  save() {
    if (this.selected?.trashedAt) {
      this.error = 'Restaura el formulario antes de guardar cambios.';
      return;
    }
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
    if (this.selected?.trashedAt) {
      this.error = 'Restaura el formulario antes de crear una versión.';
      return;
    }
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
    if (this.selected?.trashedAt) {
      this.error = 'Restaura el formulario antes de publicar.';
      return;
    }
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
    if (form.trashedAt) {
      return 'en papelera';
    }
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
    this.api.get<ServiceCatalogResponse>('forms/catalog/tables').subscribe({
      next: (response) => {
        this.tableCatalog = response.tables ?? [];
        this.tableCatalogStatus = 'loaded';
      },
      error: () => {
        this.tableCatalog = [];
        this.tableCatalogStatus = 'error';
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

  private errorMessage(error: unknown) {
    const response = error as { error?: { message?: string | string[] }; message?: string };
    const message = response.error?.message ?? response.message;
    const text = Array.isArray(message) ? message.join(', ') : message || 'Error inesperado.';
    const translations: Record<string, string> = {
      'Restore the form before updating it from JSON':
        'Ese key ya existe en papelera. Restaura el formulario antes de actualizarlo desde JSON, o usa una key nueva.',
      'document is required': 'El cuerpo debe incluir document con el JSON del formulario.',
      'document.key and document.title are required': 'El JSON necesita key y title.',
      'schema.kind must be dynamic_form': 'schema.kind debe ser dynamic_form.',
      'schema key, title and steps are required': 'El JSON necesita key, title y al menos un step.'
    };
    return translations[text] ?? text;
  }

  private isRestoreConflict(error: unknown) {
    const response = error as { status?: number; error?: { message?: string | string[] }; message?: string };
    const message = response.error?.message ?? response.message ?? '';
    const text = Array.isArray(message) ? message.join(', ') : message;
    return response.status === 409 || text.includes('Confirm overwrite');
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
        tokens: {
          buttonPrimary: {
            background: this.draft.buttonTone,
            text: 'primaryContrast',
            radius: 'md'
          }
        }
      },
      layout: {
        strategy: 'adaptive_steps',
        form: {
          width: this.draft.formWidth,
          align: this.draft.formAlign
        },
        desktop: {
          mode: this.draft.desktopMode,
          fieldColumns: Number(this.draft.desktopFieldColumns) || 2,
          cardColumns: Number(this.draft.desktopColumns) || 2,
          allowSingleLongForm: true,
          maxFieldsPerSection: 8,
          actions: {
            position: this.draft.desktopActionPosition,
            align: this.draft.desktopActionAlign,
            size: this.draft.desktopActionSize
          }
        },
        tablet: {
          mode: this.draft.desktopMode === 'single_form' ? 'single_form' : 'step_cards',
          fieldColumns: Number(this.draft.tabletFieldColumns) || 1,
          cardColumns: 1,
          maxFieldsPerSection: 6,
          actions: {
            position: this.draft.tabletActionPosition,
            align: this.draft.tabletActionAlign,
            size: this.draft.tabletActionSize
          }
        },
        mobile: {
          mode: this.draft.mobileMode,
          progress: 'compact',
          navigation: 'bottom_actions',
          fieldColumns: 1,
          maxFieldsPerScreen: 6,
          actions: {
            position: this.draft.mobileActionPosition,
            align: this.draft.mobileActionAlign,
            size: this.draft.mobileActionSize
          }
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
    if (this.draft.persistenceMode === 'auth') {
      return {
        mode: 'auth',
        defaultTarget: {
          type: 'dynamic_service',
          serviceKey: 'auth.login'
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
    if (this.draft.persistenceMode === 'submit_action') {
      return { mode: 'submit_action' };
    }
    return { mode: 'none' };
  }

  private actionsFromDraft() {
    if (this.draft.persistenceMode === 'auth') {
      const userField = this.draft.authUserField || this.firstFieldKey(['usuario', 'email', 'correo', 'username']) || 'usuario';
      const passwordField = this.draft.authPasswordField || this.firstPasswordFieldKey() || 'password';
      return [
        {
          event: 'onSubmit',
          type: 'execute_service',
          serviceKey: 'auth.login',
          resultKey: 'session',
          payloadMap: {
            username: `{{input.${userField}}}`,
            password: `{{input.${passwordField}}}`
          },
          onSuccess: [
            { type: 'set_session', from: '{{result}}' },
            { type: 'navigate', to: this.draft.authSuccessRoute || '/home' }
          ],
          onError: [
            {
              type: 'show_message',
              tone: 'danger',
              message: this.draft.authErrorMessage || 'Credenciales incorrectas'
            }
          ]
        }
      ];
    }
    if (this.draft.persistenceMode === 'service' && this.draft.serviceKey) {
      return [
        this.withSubmitFeedback({
          event: 'onSubmit',
          type: 'execute_service',
          serviceKey: this.draft.serviceKey,
          payloadMap: this.safeMapFromText(this.draft.payloadMapText, { input: '{{input}}' }),
          responseMap: this.safeMapFromText(this.draft.responseMapText, {})
        })
      ];
    }
    if (this.draft.persistenceMode === 'flow' && this.draft.flowKey) {
      return [
        this.withSubmitFeedback({
          event: 'onSubmit',
          type: 'execute_flow',
          flowKey: this.draft.flowKey,
          payloadMap: this.safeMapFromText(this.draft.payloadMapText, { input: '{{input}}' }),
          responseMap: this.safeMapFromText(this.draft.responseMapText, {})
        })
      ];
    }
    if (this.draft.persistenceMode === 'hybrid') {
      const actions: Array<Record<string, unknown>> = [
        this.withSubmitFeedback({
          event: 'onSubmit',
          type: 'create_record',
          recordType: this.draft.recordType || this.normalizeKey(this.draft.key),
          resultKey: 'record',
          payloadMap: { input: '{{input}}' }
        })
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
    if (this.draft.persistenceMode === 'submit_action') {
      const action = this.safeMapFromText(this.draft.customSubmitActionText, {});
      return [
        this.withSubmitFeedback({
          ...action,
          event: action['event'] || 'onSubmit'
        })
      ];
    }
    return [
      this.withSubmitFeedback({
        event: 'onSubmit',
        type: this.draft.persistenceMode === 'none' ? 'show_message' : 'create_record',
        recordType: this.draft.recordType || this.normalizeKey(this.draft.key),
        payloadMap: { input: '{{input}}' }
      })
    ];
  }

  private withSubmitFeedback<T extends Record<string, unknown>>(action: T): T {
    if (!this.draft.showSubmitFeedback) {
      return this.withoutSubmitFeedback(action);
    }
    return {
      ...action,
      onSuccess: [
        {
          type: 'show_message',
          tone: 'success',
          message: this.draft.submitSuccessMessage || 'Formulario ejecutado correctamente.'
        }
      ],
      onError: [
        {
          type: 'show_message',
          tone: 'danger',
          message: this.draft.submitErrorMessage || 'No se pudo ejecutar el formulario.'
        }
      ]
    };
  }

  private withoutSubmitFeedback<T extends Record<string, unknown>>(action: T): T {
    const next: Record<string, unknown> = { ...action };
    for (const key of ['onSuccess', 'onError']) {
      const effects = Array.isArray(next[key]) ? (next[key] as unknown[]) : null;
      if (!effects) {
        continue;
      }
      const filtered = effects.filter((item) => this.asObject(item)?.['type'] !== 'show_message');
      if (filtered.length) {
        next[key] = filtered;
      } else {
        delete next[key];
      }
    }
    return next as T;
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

  private firstFieldKey(candidates: string[]) {
    const normalizedCandidates = candidates.map((candidate) => this.normalizeKey(candidate));
    const field = this.allDraftFields.find((item) => normalizedCandidates.includes(this.normalizeKey(item.key)));
    return field?.key ?? '';
  }

  private firstPasswordFieldKey() {
    const field = this.allDraftFields.find((item) => item.type === 'password' || /pass|clave|contrase/.test(this.normalizeKey(item.key)));
    return field?.key ?? '';
  }

  private draftFromSchema(form: DynamicFormItem): FormDraft {
    const schema = form.schema ?? {};
    const runtime = this.asObject(schema['runtime']);
    const offline = this.asObject(runtime?.['offline']);
    const limits = this.asObject(runtime?.['limits']);
    const presentation = this.asObject(schema['presentation']);
    const tokens = this.asObject(presentation?.['tokens']);
    const buttonPrimary = this.asObject(tokens?.['buttonPrimary']);
    const layout = this.asObject(schema['layout']);
    const formLayout = this.asObject(layout?.['form']);
    const desktopLayout = this.asObject(layout?.['desktop']);
    const desktopActions = this.asObject(desktopLayout?.['actions']);
    const tabletLayout = this.asObject(layout?.['tablet']);
    const tabletActions = this.asObject(tabletLayout?.['actions']);
    const mobileLayout = this.asObject(layout?.['mobile']);
    const mobileActions = this.asObject(mobileLayout?.['actions']);
    const persistence = this.asObject(schema['persistence']);
    const target = this.asObject(persistence?.['defaultTarget']);
    const submitAction = this.submitActionFromSchema(schema);
    const submitPayloadMap = this.asObject(submitAction?.['payloadMap']) ?? {};
    const hybridAction = this.hybridActionFromSchema(schema);
    const steps = Array.isArray(schema['steps']) ? (schema['steps'] as Array<Record<string, unknown>>) : [];
    const persistenceMode = this.asPersistenceMode(persistence?.['mode'], submitAction);
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
      formWidth: this.asFormWidth(formLayout?.['width']),
      formAlign: this.asFormAlign(formLayout?.['align']),
      desktopMode: this.asDesktopLayoutMode(desktopLayout?.['mode']),
      desktopColumns: this.asNumber(desktopLayout?.['cardColumns']) ?? 2,
      desktopFieldColumns: this.asColumnCount(desktopLayout?.['fieldColumns'], 2),
      desktopActionPosition: this.asActionPosition(desktopActions?.['position'], 'inline'),
      desktopActionAlign: this.asActionAlign(desktopActions?.['align'], 'right'),
      desktopActionSize: this.asActionSize(desktopActions?.['size'], 'md'),
      tabletFieldColumns: this.asColumnCount(tabletLayout?.['fieldColumns'], 1),
      tabletActionPosition: this.asActionPosition(tabletActions?.['position'], 'footer'),
      tabletActionAlign: this.asActionAlign(tabletActions?.['align'], 'stretch'),
      tabletActionSize: this.asActionSize(tabletActions?.['size'], 'full'),
      mobileMode: this.asMobileLayoutMode(mobileLayout?.['mode']),
      mobileActionPosition: this.asActionPosition(mobileActions?.['position'], 'bottom_sticky'),
      mobileActionAlign: this.asActionAlign(mobileActions?.['align'], 'stretch'),
      mobileActionSize: this.asActionSize(mobileActions?.['size'], 'full'),
      buttonTone: this.asButtonTone(buttonPrimary?.['background']),
      autosave: runtime?.['autosave'] === true,
      offlineEnabled: offline?.['enabled'] !== false,
      timeoutMs: this.asNumber(limits?.['timeoutMs']) ?? 10000,
      maxPayloadKb: this.asNumber(limits?.['maxPayloadKb']) ?? 512,
      persistenceMode,
      recordType: String(target?.['recordType'] ?? form.key ?? ''),
      serviceKey: String(target?.['serviceKey'] ?? ''),
      flowKey: String(target?.['flowKey'] ?? ''),
      hybridActionType: this.asHybridActionType(hybridAction?.['type']),
      hybridServiceKey: String(hybridAction?.['serviceKey'] ?? ''),
      hybridFlowKey: String(hybridAction?.['flowKey'] ?? ''),
      authUserField: this.fieldKeyFromTemplate(submitPayloadMap['username']) || this.fieldKeyFromTemplate(submitPayloadMap['email']),
      authPasswordField: this.fieldKeyFromTemplate(submitPayloadMap['password']),
      authSuccessRoute: this.authSuccessRouteFromAction(submitAction),
      authErrorMessage: this.authErrorMessageFromAction(submitAction),
      showSubmitFeedback: this.submitFeedbackEnabled(submitAction),
      submitSuccessMessage: this.submitFeedbackText(submitAction, 'success') || 'Formulario ejecutado correctamente.',
      submitErrorMessage: this.submitFeedbackText(submitAction, 'error') || 'No se pudo ejecutar el formulario.',
      customSubmitActionText: JSON.stringify(submitAction ?? {}, null, 2),
      payloadMapText: JSON.stringify(submitPayloadMap ?? { input: '{{input}}' }, null, 2),
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
      formWidth: 'standard',
      formAlign: 'stretch',
      desktopMode: 'step_cards',
      desktopColumns: 2,
      desktopFieldColumns: 2,
      desktopActionPosition: 'inline',
      desktopActionAlign: 'right',
      desktopActionSize: 'md',
      tabletFieldColumns: 1,
      tabletActionPosition: 'footer',
      tabletActionAlign: 'stretch',
      tabletActionSize: 'full',
      mobileMode: 'step_screens',
      mobileActionPosition: 'bottom_sticky',
      mobileActionAlign: 'stretch',
      mobileActionSize: 'full',
      buttonTone: 'primary',
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
      authUserField: 'usuario',
      authPasswordField: 'password',
      authSuccessRoute: '/home',
      authErrorMessage: 'Credenciales incorrectas',
      showSubmitFeedback: true,
      submitSuccessMessage: 'Formulario ejecutado correctamente.',
      submitErrorMessage: 'No se pudo ejecutar el formulario.',
      customSubmitActionText: JSON.stringify({}, null, 2),
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

  private fieldKeyFromTemplate(value: unknown) {
    const match = String(value ?? '').match(/\{\{\s*input\.([a-zA-Z0-9_]+)\s*\}\}/);
    return match?.[1] ?? '';
  }

  private authSuccessRouteFromAction(action?: Record<string, unknown> | null) {
    const onSuccess = Array.isArray(action?.['onSuccess']) ? (action?.['onSuccess'] as unknown[]) : [];
    const navigate = onSuccess.find((item): item is Record<string, unknown> => {
      const object = this.asObject(item);
      return object?.['type'] === 'navigate';
    });
    return String(navigate?.['to'] ?? '/home');
  }

  private authErrorMessageFromAction(action?: Record<string, unknown> | null) {
    const onError = Array.isArray(action?.['onError']) ? (action?.['onError'] as unknown[]) : [];
    const message = onError.find((item): item is Record<string, unknown> => {
      const object = this.asObject(item);
      return object?.['type'] === 'show_message';
    });
    return String(message?.['message'] ?? 'Credenciales incorrectas');
  }

  private submitFeedbackMessage(kind: 'success' | 'error') {
    const schema = this.safeJson();
    const action = schema ? this.submitActionFromSchema(schema) : null;
    const key = kind === 'success' ? 'onSuccess' : 'onError';
    const effects = Array.isArray(action?.[key]) ? (action?.[key] as unknown[]) : [];
    const message = effects.find((item): item is Record<string, unknown> => {
      const object = this.asObject(item);
      return object?.['type'] === 'show_message';
    });
    if (message?.['show'] === false || message?.['visible'] === false) {
      return '';
    }
    return typeof message?.['message'] === 'string' ? message['message'] : '';
  }

  private submitSuccessMessage(durationMs: number, output: unknown, customMessage = '') {
    const target = this.submitOutputTarget(output);
    if (customMessage) {
      return target ? `${customMessage} ${target}.` : customMessage;
    }
    return target
      ? `Submit ejecutado correctamente en ${durationMs} ms. ${target}.`
      : `Submit ejecutado correctamente en ${durationMs} ms.`;
  }

  private submitOutputTarget(output: unknown, depth = 0): string {
    if (depth > 2) {
      return '';
    }
    const object = this.asObject(output);
    if (!object) {
      return '';
    }

    const responseSnapshot = this.asObject(object['responseSnapshot']);
    const table = responseSnapshot?.['table'];
    if (typeof table === 'string' && table.trim()) {
      const operation = typeof responseSnapshot?.['operation'] === 'string' ? responseSnapshot['operation'] : 'write';
      return `${this.submitOperationLabel(operation)} en tabla ${table}`;
    }

    const recordType = object['recordType'];
    if (typeof recordType === 'string' && recordType.trim()) {
      return `Guardado en records (${recordType})`;
    }

    const last = this.asObject(object['last']);
    if (last) {
      return this.submitOutputTarget(last, depth + 1);
    }
    const result = this.asObject(object['result']);
    if (result) {
      return this.submitOutputTarget(result, depth + 1);
    }
    return '';
  }

  private submitOperationLabel(operation: string) {
    switch (operation) {
      case 'create':
        return 'Guardado';
      case 'update':
        return 'Actualizado';
      case 'delete':
        return 'Eliminado';
      default:
        return 'Ejecutado';
    }
  }

  private submitFeedbackEnabled(action?: Record<string, unknown> | null) {
    return Boolean(this.submitFeedbackText(action, 'success') || this.submitFeedbackText(action, 'error'));
  }

  private submitFeedbackText(action: Record<string, unknown> | null | undefined, kind: 'success' | 'error') {
    const key = kind === 'success' ? 'onSuccess' : 'onError';
    const effects = Array.isArray(action?.[key]) ? (action?.[key] as unknown[]) : [];
    const message = effects.find((item): item is Record<string, unknown> => {
      const object = this.asObject(item);
      return object?.['type'] === 'show_message';
    });
    if (message?.['show'] === false || message?.['visible'] === false) {
      return '';
    }
    return typeof message?.['message'] === 'string' ? message['message'] : '';
  }

  private asPersistenceMode(value: unknown, submitAction?: Record<string, unknown> | null): PersistenceMode {
    if (String(value) === 'none' && submitAction?.['type'] === 'execute_service' && submitAction?.['serviceKey'] === 'auth.login') {
      return 'auth';
    }
    return ['record', 'service', 'flow', 'hybrid', 'auth', 'none', 'submit_action'].includes(String(value))
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
    const object = this.asObject(value);
    if (object) {
      return this.asFieldLayout(object['desktop']);
    }
    return value === 'full' || value === 'third' ? value : 'half';
  }

  private asConditionOperator(value: unknown): ConditionOperator {
    return ['equals', 'not_equals', 'truthy', 'falsy', 'contains'].includes(String(value))
      ? (value as ConditionOperator)
      : 'equals';
  }

  private asPresentationKit(value: unknown): PresentationKit {
    return ['auto', 'primeng', 'ionic', 'material', 'bootstrap', 'native'].includes(String(value))
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

  private asFormWidth(value: unknown): FormWidth {
    return ['compact', 'standard', 'wide', 'full'].includes(String(value)) ? (value as FormWidth) : 'standard';
  }

  private asFormAlign(value: unknown): FormAlign {
    return ['left', 'center', 'right', 'stretch'].includes(String(value)) ? (value as FormAlign) : 'stretch';
  }

  private asActionPosition(value: unknown, fallback: ActionPosition): ActionPosition {
    return ['inline', 'footer', 'bottom_sticky'].includes(String(value)) ? (value as ActionPosition) : fallback;
  }

  private asActionAlign(value: unknown, fallback: ActionAlign): ActionAlign {
    return ['left', 'center', 'right', 'stretch'].includes(String(value)) ? (value as ActionAlign) : fallback;
  }

  private asActionSize(value: unknown, fallback: ActionSize): ActionSize {
    return ['sm', 'md', 'lg', 'full', 'field'].includes(String(value)) ? (value as ActionSize) : fallback;
  }

  private asButtonTone(value: unknown): ButtonTone {
    return ['primary', 'secondary', 'success', 'danger', 'neutral'].includes(String(value))
      ? (value as ButtonTone)
      : 'primary';
  }

  private asColumnCount(value: unknown, fallback: number) {
    const number = this.asNumber(value) ?? fallback;
    return Math.max(1, Math.min(3, Math.trunc(number)));
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

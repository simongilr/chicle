import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';
import {
  FlowDataMapperComponent,
  FlowDataOption,
  FlowMapRow
} from './flow-data-mapper.component';
import {
  FlowTimelineComponent,
  FlowTimelineStatus,
  FlowTimelineStep
} from './flow-timeline.component';

type FlowStepType = 'start' | 'dynamic_service' | 'formula' | 'validation' | 'decision' | 'action' | 'response' | 'end';
type FlowStage = 'describe' | 'build' | 'test' | 'publish';
type FlowStarter = 'validate' | 'service' | 'multi_service' | 'calculate' | 'blank';

interface FlowStep {
  id: string;
  key: string;
  name: string;
  type: FlowStepType;
  position: number;
  config?: Record<string, unknown> | null;
  inputMap?: Record<string, unknown> | null;
  outputKey?: string | null;
  nextStepKey?: string | null;
  onTrueStepKey?: string | null;
  onFalseStepKey?: string | null;
  onErrorStepKey?: string | null;
}

interface FlowVersion {
  id: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  definition: Record<string, unknown>;
  publishedAt?: string | null;
  createdAt: string;
}

interface FlowItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  metadata?: Record<string, unknown> | null;
  status: 'draft' | 'active' | 'paused' | 'trashed';
  steps: FlowStep[];
  latestVersion?: FlowVersion | null;
  publishedVersion?: FlowVersion | null;
  definitionPreview: Record<string, unknown>;
}

interface FlowRunItem {
  id: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'timeout' | 'cancelled';
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
  durationMs?: number | null;
  createdAt: string;
  steps?: FlowStepRunItem[];
}

interface FlowStepRunItem {
  id?: string;
  stepKey: string;
  stepName: string;
  stepType: FlowStepType;
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'skipped';
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
  durationMs?: number | null;
}

interface FlowDraft {
  key: string;
  name: string;
  description: string;
  category: string;
}

type FlowInputType = 'text' | 'number' | 'boolean' | 'email' | 'date';

interface FlowInputField {
  key: string;
  label: string;
  type: FlowInputType;
  required: boolean;
  example: string;
}

interface StepDraft {
  id: string;
  key: string;
  name: string;
  type: FlowStepType;
  position: number;
  outputKey: string;
  nextStepKey: string;
  onTrueStepKey: string;
  onFalseStepKey: string;
  onErrorStepKey: string;
  configText: string;
  inputMapText: string;
  serviceKey: string;
  timeoutMs: number;
  retryAttempts: number;
  retryBackoffMs: number;
  conditionExpression: string;
  formulaExpression: string;
  decisionLeft: string;
  decisionOperator: string;
  decisionRight: string;
  decisionRightType: 'text' | 'number' | 'boolean' | 'path';
  formulaLeft: string;
  formulaOperator: string;
  formulaRight: string;
  formulaPrecision: number;
  validationField: string;
  validationOperator: string;
  validationValue: string;
  validationMessage: string;
  actionName: string;
  responseStatus: string;
  responseBodyText: string;
  inputRows: StepInputRow[];
  advancedMode: boolean;
}

type StepInputRow = FlowMapRow;

interface DynamicServiceDefinition {
  intent?: string;
  source?: 'external_api' | 'internal_table' | 'dynamic_record' | 'future_connector';
  resultKind?: 'none' | 'single' | 'list' | 'paginated_list' | 'boolean' | 'file';
  dataTarget?: {
    primaryTable?: string;
    filters?: Array<{
      valueSource?: string;
      inputKey?: string;
      required?: boolean;
    }>;
  };
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  responseMap?: Record<string, string>;
}

interface DynamicServiceItem {
  id: string;
  key: string;
  name: string;
  active: boolean;
  description?: string | null;
  latestVersion?: { version: number; status: string; definition: DynamicServiceDefinition } | null;
  publishedVersion?: { version: number; status: string; definition: DynamicServiceDefinition } | null;
}

interface FlowPreviewItem {
  status: 'success' | 'failed';
  throughStepKey?: string | null;
  output?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
  context: Record<string, unknown>;
  steps: FlowStepRunItem[];
}

@Component({
  selector: 'app-flows-page',
  standalone: true,
  imports: [FormsModule, JsonPipe, MainNavComponent, FlowTimelineComponent, FlowDataMapperComponent],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: #12365a;
        background: #f4f8fc;
      }

      .page {
        max-width: 1280px;
        margin: 0 auto;
        padding: 24px 20px 48px;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .eyebrow,
      .meta {
        color: #526a82;
        font-size: 0.86rem;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        font-size: 2.2rem;
        line-height: 1.05;
        margin: 6px 0 10px;
      }

      .layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }

      .panel {
        background: #fff;
        border: 1px solid #cbdcee;
        border-radius: 8px;
        padding: 14px;
        box-shadow: 0 16px 36px rgba(30, 80, 130, 0.08);
      }

      .stage-nav {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin: 4px 0 18px;
      }

      .stage-button {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr);
        gap: 9px;
        align-items: center;
        text-align: left;
        min-height: 54px;
      }

      .stage-button.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .stage-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #e6edf5;
        color: #12365a;
      }

      .stage-button.active .stage-number,
      .stage-button.done .stage-number {
        background: #1f5ca8;
        color: #fff;
      }

      .starter-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 9px;
        margin: 14px 0 18px;
      }

      .starter {
        min-height: 104px;
        text-align: left;
        display: grid;
        align-content: start;
        gap: 6px;
      }

      .starter.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .section-heading {
        display: grid;
        gap: 5px;
        margin-bottom: 14px;
      }

      .callout {
        border-left: 4px solid #1f5ca8;
        background: #eef6ff;
        padding: 12px 14px;
        margin-bottom: 14px;
        line-height: 1.45;
      }

      .checklist {
        display: grid;
        gap: 8px;
        margin: 12px 0;
      }

      .check-item {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        gap: 9px;
        align-items: start;
        padding: 10px;
        border: 1px solid #d7e5f2;
        border-radius: 7px;
      }

      .check-item strong {
        display: block;
      }

      .check-mark {
        color: #167044;
        font-weight: 900;
      }

      .list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .item {
        border: 1px solid #c8d9eb;
        background: #fff;
        color: #12365a;
        text-align: left;
        border-radius: 8px;
        padding: 11px;
        cursor: pointer;
      }

      .item.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .toolbar,
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .toolbar {
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .builder {
        display: grid;
        grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
        gap: 14px;
        margin-top: 14px;
      }

      label {
        display: grid;
        gap: 5px;
        font-weight: 700;
        font-size: 0.9rem;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid #b9cfe6;
        border-radius: 7px;
        min-height: 38px;
        padding: 8px 10px;
        color: #12365a;
        background: #fff;
        font: inherit;
      }

      textarea {
        min-height: 132px;
        resize: vertical;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.86rem;
      }

      button {
        border: 1px solid #b9cfe6;
        background: #fff;
        color: #12365a;
        border-radius: 7px;
        min-height: 36px;
        padding: 8px 12px;
        font-weight: 800;
        cursor: pointer;
      }

      button.primary {
        background: #1f5ca8;
        border-color: #1f5ca8;
        color: #fff;
      }

      button.danger {
        color: #a51d24;
        border-color: #efb4b8;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .steps {
        display: grid;
        gap: 8px;
        margin-top: 10px;
      }

      .step-card {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        border: 1px solid #c8d9eb;
        background: #f8fbff;
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
        text-align: left;
      }

      .step-card.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 42px;
        height: 28px;
        border-radius: 999px;
        background: #e9eef5;
        color: #12365a;
        font-size: 0.78rem;
        font-weight: 900;
      }

      .type-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin: 10px 0;
      }

      .type-button {
        justify-content: flex-start;
        min-height: 58px;
        text-align: left;
      }

      .type-button.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .guided-panel {
        display: grid;
        gap: 10px;
        border: 1px solid #d6e4f2;
        border-radius: 8px;
        background: #f8fbff;
        margin-top: 10px;
        padding: 12px;
      }

      .step-editor {
        display: grid;
        gap: 12px;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #d6e4f2;
      }

      .map-row {
        display: grid;
        grid-template-columns: minmax(120px, 0.7fr) minmax(160px, 1fr) auto;
        gap: 8px;
        align-items: end;
      }

      .input-field-row {
        display: grid;
        grid-template-columns: minmax(120px, 0.8fr) minmax(150px, 1.1fr) 120px minmax(130px, 0.9fr) auto auto;
        gap: 8px;
        align-items: end;
      }

      .inline-check {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 38px;
      }

      .inline-check input {
        width: auto;
        min-height: auto;
      }

      .issue-list {
        display: grid;
        gap: 7px;
        margin: 10px 0;
      }

      .issue {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr);
        gap: 8px;
        padding: 9px 10px;
        border: 1px solid #efc5a5;
        border-radius: 7px;
        background: #fff8ef;
        color: #71400f;
      }

      .hint {
        border: 1px solid #d7e5f2;
        border-radius: 8px;
        background: #ffffff;
        color: #526a82;
        padding: 9px 10px;
        line-height: 1.45;
      }

      .mini-title {
        color: #12365a;
        font-size: 0.9rem;
        font-weight: 900;
      }

      .run-card {
        display: grid;
        gap: 8px;
        border: 1px solid #d7e5f2;
        border-radius: 8px;
        background: #ffffff;
        padding: 10px;
      }

      .status-success {
        background: #e8f8ef;
        color: #116b3b;
      }

      .status-failed,
      .status-timeout {
        background: #fff0f0;
        color: #9b1c24;
      }

      .step-run {
        display: grid;
        gap: 4px;
        border-left: 3px solid #b9cfe6;
        padding-left: 9px;
      }

      pre {
        max-height: 440px;
        overflow: auto;
        margin: 0;
        border-radius: 8px;
        background: #10233a;
        color: #d9ecff;
        padding: 12px;
        font-size: 0.82rem;
      }

      .message {
        margin: 10px 0;
        border: 1px solid #b9d5f0;
        background: #eef7ff;
        border-radius: 8px;
        padding: 10px 12px;
      }

      @media (max-width: 900px) {
        .layout,
        .builder,
        .grid,
        .type-grid,
        .map-row,
        .input-field-row,
        .starter-grid {
          grid-template-columns: 1fr;
        }

        .stage-nav {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .hero {
          display: grid;
        }

        h1 {
          font-size: 1.8rem;
        }
      }
    `
  ],
  template: `
    <app-main-nav contextLabel="Flow Designer"></app-main-nav>
    <main class="page">
        <section class="hero">
          <div>
            <span class="eyebrow">Chicle Flow Engine</span>
            <h1>Automatizaciones</h1>
            <p class="meta">
              Crea un proceso paso a paso, pruébalo con datos de ejemplo y publícalo cuando el resultado sea correcto.
            </p>
          </div>
          <button class="primary" type="button" (click)="startNewFlow()" [disabled]="!canCreate">
            Nuevo flow
          </button>
        </section>

        @if (message) {
          <div class="message">{{ message }}</div>
        }

        <section class="layout">
          <aside class="panel">
            <div class="toolbar">
              <h2>Mis procesos</h2>
              <span class="meta">{{ flows.length }}</span>
            </div>
            <div class="list">
              @for (flow of flows; track flow.id) {
                <button class="item" type="button" [class.active]="flow.id === selectedFlowId" (click)="selectFlow(flow)">
                  <strong>{{ flow.name }}</strong>
                  <div class="meta">{{ flow.key }} · {{ flow.status }}</div>
                  <div class="meta">
                    {{ flow.steps.length }} pasos · publicada:
                    {{ flow.publishedVersion ? 'v' + flow.publishedVersion.version : 'sin publicar' }}
                  </div>
                </button>
              } @empty {
                <div class="hint">Todavía no hay procesos. El asistente de la derecha te ayudará a crear el primero.</div>
              }
            </div>
          </aside>

          <section class="panel">
            <div class="toolbar">
              <div>
                <h2>{{ selectedFlow ? selectedFlow.name : 'Crea tu primer proceso' }}</h2>
                <p class="meta">
                  {{ selectedFlow ? 'Avanza por las cuatro etapas sin perder el contexto.' : 'Primero dinos qué quieres lograr. Los datos técnicos se generan solos.' }}
                </p>
              </div>
              @if (selectedFlow) {
                <div class="row">
                  <button class="danger" type="button" (click)="trashFlow()" [disabled]="!canUpdate">
                    Papelera
                  </button>
                </div>
              }
            </div>

            @if (selectedFlow) {
              <nav class="stage-nav" aria-label="Etapas del proceso">
                @for (stage of stages; track stage.key; let index = $index) {
                  <button
                    class="stage-button"
                    type="button"
                    [class.active]="activeStage === stage.key"
                    [class.done]="isStageDone(stage.key)"
                    (click)="goToStage(stage.key)"
                  >
                    <span class="stage-number">{{ index + 1 }}</span>
                    <span>
                      <strong>{{ stage.label }}</strong>
                      <span class="meta">{{ stage.summary }}</span>
                    </span>
                  </button>
                }
              </nav>
            }

            @if (!selectedFlow || activeStage === 'describe') {
              <div class="section-heading">
                <h3>{{ selectedFlow ? 'Propósito del proceso' : '¿Qué quieres automatizar?' }}</h3>
                <p class="meta">
                  {{ selectedFlow ? 'Estos datos ayudan a encontrar y entender el proceso.' : 'Elige el punto de partida más parecido. Después podrás cambiar cada paso.' }}
                </p>
              </div>

              @if (!selectedFlow) {
                <div class="starter-grid">
                  @for (starter of starters; track starter.key) {
                    <button
                      class="starter"
                      type="button"
                      [class.active]="selectedStarter === starter.key"
                      (click)="chooseStarter(starter.key)"
                    >
                      <strong>{{ starter.label }}</strong>
                      <span class="meta">{{ starter.summary }}</span>
                    </button>
                  }
                </div>
              }

              <div class="grid">
                <label>
                  Nombre del proceso
                  <input
                    [(ngModel)]="flowDraft.name"
                    (ngModelChange)="syncFlowKey(true)"
                    placeholder="Validar una solicitud"
                  />
                </label>
                <label>
                  ¿Qué resultado esperas?
                  <input [(ngModel)]="flowDraft.description" placeholder="Aceptar solicitudes con datos completos" />
                </label>
                <label>
                  Categoría
                  <select [(ngModel)]="flowDraft.category">
                    <option value="operaciones">Operaciones</option>
                    <option value="ventas">Ventas</option>
                    <option value="seguridad">Seguridad</option>
                    <option value="integraciones">Integraciones</option>
                    <option value="experiencia">Experiencia de usuario</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
                <label>
                  Identificador técnico
                  <input [(ngModel)]="flowDraft.key" placeholder="validar_solicitud" [disabled]="!!selectedFlow" />
                </label>
              </div>

              <div class="guided-panel">
                <div class="toolbar">
                  <div>
                    <div class="mini-title">Datos que recibe el proceso</div>
                    <p class="meta">Defínelos una vez. Después aparecerán como opciones al conectar servicios y reglas.</p>
                  </div>
                  <button type="button" (click)="addFlowInput()"><i class="pi pi-plus" aria-hidden="true"></i> Agregar dato</button>
                </div>
                @for (field of flowInputs; track $index) {
                  <div class="input-field-row">
                    <label>
                      Identificador
                      <input [(ngModel)]="field.key" (ngModelChange)="onFlowInputsChanged()" placeholder="email" />
                    </label>
                    <label>
                      Nombre visible
                      <input [(ngModel)]="field.label" (ngModelChange)="onFlowInputsChanged()" placeholder="Correo" />
                    </label>
                    <label>
                      Tipo
                      <select [(ngModel)]="field.type" (ngModelChange)="onFlowInputsChanged()">
                        <option value="text">Texto</option>
                        <option value="email">Correo</option>
                        <option value="number">Número</option>
                        <option value="boolean">Sí / no</option>
                        <option value="date">Fecha</option>
                      </select>
                    </label>
                    <label>
                      Ejemplo
                      <input [(ngModel)]="field.example" (ngModelChange)="onFlowInputsChanged()" placeholder="persona@example.com" />
                    </label>
                    <label class="inline-check">
                      <input type="checkbox" [(ngModel)]="field.required" (ngModelChange)="onFlowInputsChanged()" />
                      Obligatorio
                    </label>
                    <button type="button" title="Quitar dato" (click)="removeFlowInput($index)">
                      <i class="pi pi-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                } @empty {
                  <div class="hint">Sin datos definidos. Puedes agregarlos ahora o escribirlos manualmente durante las pruebas.</div>
                }
              </div>

              <div class="row" style="margin-top: 14px;">
                @if (selectedFlow) {
                  <button class="primary" type="button" (click)="saveFlow()" [disabled]="!canUpdate">Guardar cambios</button>
                  <button type="button" (click)="saveFlow('build')">Guardar y continuar</button>
                } @else {
                  <button class="primary" type="button" (click)="createFlow()" [disabled]="!canCreate || !canCreateDraft">
                    Crear y comenzar
                  </button>
                }
              </div>
            }

            @if (selectedFlow && activeStage === 'build') {
              @if (designerIssues.length) {
                <div class="issue-list">
                  @for (issue of designerIssues; track issue) {
                    <div class="issue">
                      <i class="pi pi-info-circle" aria-hidden="true"></i>
                      <span>{{ issue }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="callout">
                  El borrador está completo para probar. Usa “Probar hasta aquí” en cualquier paso o continúa a Pruebas.
                </div>
              }
              <div class="builder">
                <section>
                  <div class="toolbar">
                    <div>
                      <h3>Recorrido</h3>
                      <p class="meta">Usa los botones + para insertar pasos. Pulsa un bloque para editarlo.</p>
                    </div>
                    <button type="button" (click)="startNewStep()">Agregar paso</button>
                  </div>

                  <app-flow-timeline
                    [steps]="selectedFlow.steps"
                    [selectedStepId]="stepDraft.id"
                    [statuses]="timelineStatuses"
                    (selected)="selectTimelineStep($event)"
                    (addAfter)="startNewStepAfter($event)"
                    (testStep)="testTimelineStep($event)"
                  ></app-flow-timeline>

                  <div class="step-editor">
                    <div class="guided-panel">
                      <div>
                        <div class="mini-title">{{ stepDraft.id ? 'Edita este paso' : '¿Qué debe ocurrir ahora?' }}</div>
                        <p class="meta">Elige una acción. Solo aparecerán los datos necesarios para configurarla.</p>
                      </div>
                      <div class="type-grid">
                        @for (type of stepTypes; track type) {
                          <button
                            class="type-button"
                            type="button"
                            [class.active]="stepDraft.type === type"
                            (click)="setStepType(type)"
                          >
                            <span>
                              <strong>{{ stepTypeLabel(type) }}</strong>
                              <span class="meta">{{ stepTypeSummary(type) }}</span>
                            </span>
                          </button>
                        }
                      </div>
                    </div>

                    <div class="grid">
                      <label>
                        Nombre visible
                        <input
                          [(ngModel)]="stepDraft.name"
                          (ngModelChange)="syncStepKey()"
                          placeholder="Validar correo"
                        />
                      </label>
                      <label>
                        Guardar resultado como
                        <input [(ngModel)]="stepDraft.outputKey" placeholder="validacion_correo" />
                      </label>
                    </div>

                    <div class="guided-panel">
                      @if (stepDraft.type === 'dynamic_service') {
                        <div class="grid">
                          <label>
                            Servicio publicado
                            <select [(ngModel)]="stepDraft.serviceKey" (ngModelChange)="onServiceSelected()">
                              <option value="">Selecciona un servicio</option>
                              @for (service of publishedServices; track service.id) {
                                <option [value]="service.key">{{ service.name }} · {{ service.key }}</option>
                              }
                            </select>
                          </label>
                          <label>
                            Timeout ms
                            <input type="number" [(ngModel)]="stepDraft.timeoutMs" (ngModelChange)="syncGuidedStepJson()" />
                          </label>
                          <label>
                            Reintentos
                            <input type="number" [(ngModel)]="stepDraft.retryAttempts" (ngModelChange)="syncGuidedStepJson()" />
                          </label>
                          <label>
                            Backoff ms
                            <input type="number" [(ngModel)]="stepDraft.retryBackoffMs" (ngModelChange)="syncGuidedStepJson()" />
                          </label>
                        </div>
                        @if (selectedService; as service) {
                          <div class="hint">
                            <strong>{{ service.name }}</strong><br />
                            Necesita: {{ selectedServiceInputKeys.length ? selectedServiceInputKeys.join(', ') : 'ningún dato obligatorio detectado' }}.<br />
                            Devuelve: {{ serviceResultLabel(service) }}.
                          </div>
                        } @else {
                          <div class="hint">Selecciona un servicio para ver qué datos necesita y qué resultado entrega.</div>
                        }
                      } @else if (stepDraft.type === 'decision') {
                        <div class="section-heading">
                          <div class="mini-title">Compara un dato</div>
                          <p class="meta">Ejemplo: si <code>input.edad</code> es mayor o igual a <code>18</code>.</p>
                        </div>
                        <div class="grid">
                          <label>
                            Dato a revisar
                            <input [(ngModel)]="stepDraft.decisionLeft" (ngModelChange)="syncGuidedStepJson()" placeholder="input.edad" />
                          </label>
                          <label>
                            Comparación
                            <select [(ngModel)]="stepDraft.decisionOperator" (ngModelChange)="syncGuidedStepJson()">
                              <option value="===">Es igual a</option>
                              <option value="!==">Es diferente de</option>
                              <option value=">">Es mayor que</option>
                              <option value=">=">Es mayor o igual que</option>
                              <option value="<">Es menor que</option>
                              <option value="<=">Es menor o igual que</option>
                              <option value="in">Contiene</option>
                            </select>
                          </label>
                          <label>
                            Tipo del valor
                            <select [(ngModel)]="stepDraft.decisionRightType" (ngModelChange)="syncGuidedStepJson()">
                              <option value="text">Texto</option>
                              <option value="number">Número</option>
                              <option value="boolean">Sí / no</option>
                              <option value="path">Otro dato del proceso</option>
                            </select>
                          </label>
                          <label>
                            Valor para comparar
                            <input [(ngModel)]="stepDraft.decisionRight" (ngModelChange)="syncGuidedStepJson()" placeholder="18" />
                          </label>
                        </div>
                      } @else if (stepDraft.type === 'formula') {
                        <div class="section-heading">
                          <div class="mini-title">Calcula un valor</div>
                          <p class="meta">Usa rutas como <code>input.total</code> o números directos.</p>
                        </div>
                        <div class="grid">
                          <label>
                            Primer valor
                            <input [(ngModel)]="stepDraft.formulaLeft" (ngModelChange)="syncGuidedStepJson()" placeholder="input.total" />
                          </label>
                          <label>
                            Operación
                            <select [(ngModel)]="stepDraft.formulaOperator" (ngModelChange)="syncGuidedStepJson()">
                              <option value="+">Sumar</option>
                              <option value="-">Restar</option>
                              <option value="*">Multiplicar</option>
                              <option value="/">Dividir</option>
                              <option value="%">Residuo</option>
                            </select>
                          </label>
                          <label>
                            Segundo valor
                            <input [(ngModel)]="stepDraft.formulaRight" (ngModelChange)="syncGuidedStepJson()" placeholder="0.19" />
                          </label>
                          <label>
                            Decimales
                            <input type="number" min="0" max="10" [(ngModel)]="stepDraft.formulaPrecision" (ngModelChange)="syncGuidedStepJson()" />
                          </label>
                        </div>
                      } @else if (stepDraft.type === 'validation') {
                        <div class="grid">
                          <label>
                            Campo
                            <input [(ngModel)]="stepDraft.validationField" (ngModelChange)="syncGuidedStepJson()" placeholder="input.email" />
                          </label>
                          <label>
                            Operador
                            <select [(ngModel)]="stepDraft.validationOperator" (ngModelChange)="syncGuidedStepJson()">
                              <option value="required">Requerido</option>
                              <option value="equals">Igual a</option>
                              <option value="not_equals">Diferente de</option>
                              <option value="not_empty">No vacío</option>
                              <option value="greater_than">Mínimo</option>
                              <option value="less_than">Máximo</option>
                              <option value="contains">Contiene</option>
                              <option value="email">Correo válido</option>
                            </select>
                          </label>
                          @if (validationNeedsValue) {
                            <label>
                              Valor esperado
                              <input [(ngModel)]="stepDraft.validationValue" (ngModelChange)="syncGuidedStepJson()" placeholder="Valor de comparación" />
                            </label>
                          }
                          <label>
                            Mensaje si no cumple
                            <input [(ngModel)]="stepDraft.validationMessage" (ngModelChange)="syncGuidedStepJson()" placeholder="El correo es obligatorio" />
                          </label>
                        </div>
                      } @else if (stepDraft.type === 'response') {
                        <div class="grid">
                          <label>
                            Estado
                            <select [(ngModel)]="stepDraft.responseStatus" (ngModelChange)="syncGuidedStepJson()">
                              <option value="success">success</option>
                              <option value="failed">failed</option>
                              <option value="partial">partial</option>
                            </select>
                          </label>
                          <label>
                            Cuerpo de respuesta JSON
                            <textarea [(ngModel)]="stepDraft.responseBodyText" (ngModelChange)="syncGuidedStepJson()"></textarea>
                          </label>
                        </div>
                      } @else if (stepDraft.type === 'action') {
                        <label>
                          Acción declarativa
                          <select [(ngModel)]="stepDraft.actionName" (ngModelChange)="syncGuidedStepJson()">
                            <option value="create_record">create_record</option>
                            <option value="show_modal">show_modal</option>
                            <option value="navigate">navigate</option>
                            <option value="queue_offline">queue_offline</option>
                            <option value="upload_files">upload_files</option>
                          </select>
                        </label>
                      } @else {
                        <div class="hint">{{ stepTypeSummary(stepDraft.type) }}</div>
                      }
                    </div>

                    <div class="guided-panel">
                      <div>
                        <div class="mini-title">¿Qué ocurre después?</div>
                        <p class="meta">Puedes seguir el orden de la lista o enviar el proceso a un paso específico.</p>
                      </div>
                      @if (stepDraft.type === 'decision') {
                        <div class="grid">
                          <label>
                            Si se cumple
                            <select [(ngModel)]="stepDraft.onTrueStepKey">
                              <option value="">Siguiente paso de la lista</option>
                              @for (step of availableTargetSteps; track step.id) {
                                <option [value]="step.key">{{ step.name }}</option>
                              }
                            </select>
                          </label>
                          <label>
                            Si no se cumple
                            <select [(ngModel)]="stepDraft.onFalseStepKey">
                              <option value="">Siguiente paso de la lista</option>
                              @for (step of availableTargetSteps; track step.id) {
                                <option [value]="step.key">{{ step.name }}</option>
                              }
                            </select>
                          </label>
                        </div>
                      } @else {
                        <div class="grid">
                          <label>
                            Al completar
                            <select [(ngModel)]="stepDraft.nextStepKey">
                              <option value="">Siguiente paso de la lista</option>
                              @for (step of availableTargetSteps; track step.id) {
                                <option [value]="step.key">{{ step.name }}</option>
                              }
                            </select>
                          </label>
                          @if (stepDraft.type === 'validation' || stepDraft.type === 'dynamic_service') {
                            <label>
                              Si falla
                              <select [(ngModel)]="stepDraft.onErrorStepKey">
                                <option value="">Detener y mostrar el error</option>
                                @for (step of availableTargetSteps; track step.id) {
                                  <option [value]="step.key">{{ step.name }}</option>
                                }
                              </select>
                            </label>
                          }
                        </div>
                      }
                    </div>

                    @if (stepDraft.type === 'dynamic_service' || stepDraft.type === 'action') {
                      <div class="guided-panel">
                        <div class="toolbar">
                          <div>
                            <div class="mini-title">Datos que recibe</div>
                            <p class="meta">
                              Elige el origen de cada dato. Los resultados de servicios anteriores aparecen automáticamente.
                            </p>
                          </div>
                        </div>
                        <app-flow-data-mapper
                          [rows]="stepDraft.inputRows"
                          [options]="dataSourceOptions"
                          (rowsChange)="updateInputRows($event)"
                        ></app-flow-data-mapper>
                      </div>
                    }

                    <div class="guided-panel">
                      <div class="toolbar">
                        <div>
                          <div class="mini-title">Opciones avanzadas</div>
                          <p class="meta">Identificador, orden y JSON generado. Normalmente no necesitas cambiarlos.</p>
                        </div>
                        <label style="display: inline-flex; align-items: center; gap: 6px;">
                          <input type="checkbox" [(ngModel)]="stepDraft.advancedMode" />
                          Editar JSON
                        </label>
                      </div>
                      <div class="grid">
                        <label>
                          Identificador del paso
                          <input [(ngModel)]="stepDraft.key" placeholder="validar_correo" />
                        </label>
                        <label>
                          Orden
                          <input type="number" [(ngModel)]="stepDraft.position" />
                        </label>
                      </div>
                      <div class="grid">
                        <label>
                          Config JSON
                          <textarea [(ngModel)]="stepDraft.configText" [disabled]="!stepDraft.advancedMode"></textarea>
                        </label>
                        <label>
                          Input map JSON
                          <textarea [(ngModel)]="stepDraft.inputMapText" [disabled]="!stepDraft.advancedMode"></textarea>
                        </label>
                      </div>
                    </div>

                    <div class="row" style="margin-top: 10px;">
                      <button class="primary" type="button" (click)="saveStep()" [disabled]="!canUpdate">
                        {{ stepDraft.id ? 'Guardar paso' : 'Agregar paso' }}
                      </button>
                      @if (stepDraft.id) {
                        <button class="danger" type="button" (click)="deleteStep()" [disabled]="!canUpdate">
                          Eliminar paso
                        </button>
                      }
                    </div>
                  </div>
                </section>

                <section>
                  <div class="section-heading">
                    <h3>Cómo leer el recorrido</h3>
                    <p class="meta">La lista de la izquierda se ejecuta de arriba hacia abajo, salvo que una decisión cambie el camino.</p>
                  </div>
                  <div class="checklist">
                    <div class="check-item">
                      <span class="check-mark">1</span>
                      <div><strong>Entrada</strong><span class="meta">El proceso recibe los datos de prueba o de la pantalla que lo invoque.</span></div>
                    </div>
                    <div class="check-item">
                      <span class="check-mark">2</span>
                      <div><strong>Pasos</strong><span class="meta">Cada resultado queda disponible como <code>steps.nombre_del_resultado</code>.</span></div>
                    </div>
                    <div class="check-item">
                      <span class="check-mark">3</span>
                      <div><strong>Respuesta</strong><span class="meta">El último bloque construye lo que recibirá la pantalla o integración.</span></div>
                    </div>
                  </div>

                  <details class="guided-panel">
                    <summary><strong>Ver definición técnica</strong></summary>
                    <pre>{{ selectedFlow.definitionPreview | json }}</pre>
                  </details>

                  <button type="button" style="margin-top: 12px;" (click)="activeStage = 'test'" [disabled]="selectedFlow.steps.length === 0">
                    Continuar a pruebas
                  </button>
                </section>
              </div>
            }

            @if (selectedFlow && activeStage === 'test') {
              <section>
                <div class="section-heading">
                  <h3>Prueba antes de publicar</h3>
                  <p class="meta">Ejecuta el borrador completo o detente después de un paso para revisar qué recibió y qué produjo.</p>
                </div>

                <div class="grid">
                  <label>
                    Datos de prueba en JSON
                    <textarea [(ngModel)]="testInputText"></textarea>
                  </label>
                  <div>
                    <label>
                      Probar hasta
                      <select [(ngModel)]="previewThroughStepKey">
                        <option value="">Todo el borrador</option>
                        @for (step of selectedFlow.steps; track step.id) {
                          <option [value]="step.key">{{ step.name }}</option>
                        }
                      </select>
                    </label>
                    <div class="callout" style="margin-top: 10px;">
                      Esta prueba usa los pasos que estás editando. No necesitas crear ni publicar una versión.
                    </div>
                    <button class="primary" type="button" (click)="previewFlow()" [disabled]="executing || selectedFlow.steps.length === 0">
                      {{ executing ? 'Probando...' : 'Probar borrador' }}
                    </button>
                  </div>
                </div>

                @if (lastPreview) {
                  <div class="run-card" style="margin-top: 14px;">
                    <div class="toolbar">
                      <strong>{{ lastPreview.status === 'success' ? 'Prueba correcta' : 'La prueba encontró un problema' }}</strong>
                      <span class="badge" [class.status-success]="lastPreview.status === 'success'" [class.status-failed]="lastPreview.status === 'failed'">
                        {{ lastPreview.status }}
                      </span>
                    </div>
                    @if (lastPreview.error) {
                      <div class="message">{{ previewErrorMessage }}</div>
                    }
                    <div class="steps">
                      @for (step of lastPreview.steps; track step.stepKey) {
                        <div class="step-run">
                          <strong>{{ step.stepName }}</strong>
                          <span class="meta">{{ stepTypeLabel(step.stepType) }} · {{ step.status }} · {{ step.durationMs ?? 0 }} ms</span>
                          <details>
                            <summary>Ver entrada y resultado</summary>
                            <pre>{{ { input: step.input, output: step.output, error: step.error } | json }}</pre>
                          </details>
                        </div>
                      }
                    </div>
                    <details>
                      <summary><strong>Resultado final</strong></summary>
                      <pre>{{ lastPreview.output | json }}</pre>
                    </details>
                  </div>
                }

                <div class="row" style="margin-top: 14px;">
                  <button type="button" (click)="activeStage = 'build'">Volver a pasos</button>
                  <button class="primary" type="button" (click)="activeStage = 'publish'" [disabled]="lastPreview?.status !== 'success'">
                    Continuar a publicar
                  </button>
                </div>
              </section>
            }

            @if (selectedFlow && activeStage === 'publish') {
              <section>
                <div class="section-heading">
                  <h3>Versiona y publica</h3>
                  <p class="meta">Una versión congela el borrador actual. Publicarla la deja disponible para pantallas, eventos e integraciones.</p>
                </div>

                <div class="checklist">
                  <div class="check-item">
                    <span class="check-mark">{{ designerIssues.length === 0 ? '✓' : '!' }}</span>
                    <div>
                      <strong>Configuración completa</strong>
                      <span class="meta">{{ designerIssues.length === 0 ? selectedFlow.steps.length + ' pasos listos.' : designerIssues.length + ' puntos necesitan atención.' }}</span>
                    </div>
                  </div>
                  <div class="check-item">
                    <span class="check-mark">{{ lastPreview?.status === 'success' ? '✓' : '!' }}</span>
                    <div><strong>Prueba del borrador</strong><span class="meta">{{ lastPreview?.status === 'success' ? 'La última prueba terminó bien.' : 'Recomendado: vuelve a Probar antes de publicar.' }}</span></div>
                  </div>
                  <div class="check-item">
                    <span class="check-mark">{{ selectedFlow.latestVersion ? '✓' : '3' }}</span>
                    <div><strong>Versión</strong><span class="meta">{{ selectedFlow.latestVersion ? 'Última versión: v' + selectedFlow.latestVersion.version + ' (' + selectedFlow.latestVersion.status + ')' : 'Todavía no has creado una versión.' }}</span></div>
                  </div>
                </div>

                <div class="row">
                  <button type="button" (click)="createVersion()" [disabled]="!canPublish || designerIssues.length > 0">
                    1. Crear versión
                  </button>
                  <button class="primary" type="button" (click)="publishLatest()" [disabled]="!canPublish || !selectedFlow.latestVersion || selectedFlow.latestVersion.status === 'published'">
                    2. Publicar versión
                  </button>
                  <button type="button" (click)="executeFlow()" [disabled]="executing || !selectedFlow.publishedVersion">
                    Probar versión publicada
                  </button>
                </div>

                @if (selectedFlow.publishedVersion) {
                  <div class="message">
                    Activa: versión {{ selectedFlow.publishedVersion.version }}. Este proceso ya puede llamarse con la key
                    <code>{{ selectedFlow.key }}</code>.
                  </div>
                }

                @if (lastRun) {
                  <div class="run-card">
                    <strong>Última ejecución publicada: {{ lastRun.status }}</strong>
                    <pre>{{ lastRun | json }}</pre>
                  </div>
                }
              </section>
            }
          </section>
        </section>
    </main>
  `
})
export class FlowsPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  readonly stepTypes: FlowStepType[] = ['dynamic_service', 'validation', 'decision', 'formula', 'response'];
  readonly stages: Array<{ key: FlowStage; label: string; summary: string }> = [
    { key: 'describe', label: 'Definir', summary: 'Propósito' },
    { key: 'build', label: 'Construir', summary: 'Pasos' },
    { key: 'test', label: 'Probar', summary: 'Borrador' },
    { key: 'publish', label: 'Publicar', summary: 'Versión' }
  ];
  readonly starters: Array<{ key: FlowStarter; label: string; summary: string }> = [
    { key: 'validate', label: 'Validar datos', summary: 'Comprueba campos y decide si puede continuar.' },
    { key: 'service', label: 'Usar un servicio', summary: 'Consulta o modifica datos mediante un servicio publicado.' },
    { key: 'multi_service', label: 'Encadenar servicios', summary: 'Usa el resultado de un servicio como entrada del siguiente.' },
    { key: 'calculate', label: 'Calcular un valor', summary: 'Realiza operaciones matemáticas con los datos recibidos.' },
    { key: 'blank', label: 'Comenzar vacío', summary: 'Construye el recorrido sin una sugerencia inicial.' }
  ];
  flows: FlowItem[] = [];
  services: DynamicServiceItem[] = [];
  flowRuns: FlowRunItem[] = [];
  selectedFlowId = '';
  message = '';
  loading = false;
  executing = false;
  activeStage: FlowStage = 'describe';
  selectedStarter: FlowStarter = 'validate';
  previewThroughStepKey = '';
  testInputText = '{\n  "email": "admin@example.com"\n}';
  lastRun?: FlowRunItem;
  lastPreview?: FlowPreviewItem;
  flowInputs: FlowInputField[] = [];
  flowDraft: FlowDraft = this.emptyFlowDraft();
  stepDraft: StepDraft = this.emptyStepDraft();

  get selectedFlow() {
    return this.flows.find((flow) => flow.id === this.selectedFlowId);
  }

  get publishedServices() {
    return this.services.filter((service) => service.active && service.publishedVersion);
  }

  get selectedService() {
    return this.publishedServices.find((service) => service.key === this.stepDraft.serviceKey);
  }

  get selectedServiceInputKeys() {
    return this.selectedService ? this.serviceInputKeys(this.selectedService) : [];
  }

  get timelineStatuses(): FlowTimelineStatus[] {
    return (this.lastPreview?.steps ?? []).map((step) => ({
      stepKey: step.stepKey,
      status: step.status
    }));
  }

  get dataSourceOptions(): FlowDataOption[] {
    const options: FlowDataOption[] = this.flowInputs
      .filter((field) => field.key.trim())
      .map((field) => ({
        group: 'input',
        label: field.label || field.key,
        value: `{{input.${field.key}}}`,
        detail: field.type
      }));

    options.push(
      { group: 'context', label: 'ID de la organización', value: '{{tenant.id}}' },
      { group: 'context', label: 'Slug de la organización', value: '{{tenant.slug}}' },
      { group: 'context', label: 'ID del usuario actual', value: '{{user.id}}' },
      { group: 'context', label: 'Correo del usuario actual', value: '{{user.email}}' }
    );

    for (const option of this.previousStepOptions()) {
      options.push(option);
    }
    return this.uniqueDataOptions(options);
  }

  get designerIssues() {
    const flow = this.selectedFlow;
    if (!flow) {
      return [];
    }
    const issues: string[] = [];
    if (!flow.steps.length) {
      issues.push('Agrega al menos un paso al recorrido.');
    }

    const inputKeys = this.flowInputs.map((field) => field.key.trim()).filter(Boolean);
    if (inputKeys.some((key) => !/^[a-z][a-z0-9_]{1,79}$/.test(key))) {
      issues.push('Los identificadores de entrada deben usar snake_case y comenzar por una letra.');
    }
    if (new Set(inputKeys).size !== inputKeys.length) {
      issues.push('Hay datos de entrada con el mismo identificador.');
    }

    const outputKeys = flow.steps.map((step) => (step.outputKey || step.key).trim());
    if (new Set(outputKeys).size !== outputKeys.length) {
      issues.push('Cada paso debe guardar su resultado con un nombre diferente.');
    }

    for (const step of flow.steps) {
      if (step.type === 'dynamic_service') {
        const serviceKey = this.asString((step.config ?? {})['serviceKey']);
        if (!this.publishedServices.some((service) => service.key === serviceKey)) {
          issues.push(`El paso “${step.name}” necesita un servicio activo y publicado.`);
        }
      }
      if (
        step.type === 'decision' &&
        (!step.onTrueStepKey || !step.onFalseStepKey || step.onTrueStepKey === step.onFalseStepKey)
      ) {
        issues.push(`La decisión “${step.name}” necesita dos destinos diferentes: Sí y No.`);
      }
    }
    return [...new Set(issues)];
  }

  get canCreateDraft() {
    return this.flowDraft.name.trim().length >= 3 && /^[a-z][a-z0-9_]{2,119}$/.test(this.flowDraft.key);
  }

  get validationNeedsValue() {
    return !['required', 'not_empty', 'email'].includes(this.stepDraft.validationOperator);
  }

  get availableTargetSteps() {
    return (this.selectedFlow?.steps ?? []).filter((step) => step.id !== this.stepDraft.id);
  }

  get previewErrorMessage() {
    const message = this.lastPreview?.error?.['message'];
    return typeof message === 'string' ? message : 'Revisa el paso marcado en rojo.';
  }

  get canCreate() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasPermission('flows.create');
  }

  get canUpdate() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasPermission('flows.update');
  }

  get canPublish() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasPermission('flows.publish');
  }

  isStageDone(stage: FlowStage) {
    const flow = this.selectedFlow;
    if (!flow) {
      return false;
    }
    switch (stage) {
      case 'describe':
        return flow.name.trim().length >= 3;
      case 'build':
        return flow.steps.length > 0;
      case 'test':
        return this.lastPreview?.status === 'success';
      case 'publish':
        return Boolean(flow.publishedVersion);
    }
  }

  ngOnInit() {
    this.loadServices();
    this.load();
  }

  loadServices() {
    this.api.get<DynamicServiceItem[]>('dynamic-services').subscribe({
      next: (services) => {
        this.services = services;
      },
      error: () => {
        this.services = [];
      }
    });
  }

  load(selectId = this.selectedFlowId) {
    this.loading = true;
    this.message = 'Cargando Flow Designer...';
    this.api.get<FlowItem[]>('flows').subscribe({
      next: (flows) => {
        this.loading = false;
        this.flows = flows;
        if (this.auth.state.isOwnerOrAdmin && !this.auth.state.hasPermission('flows.read')) {
          this.message = 'Flow Designer listo. Ejecuta Seguridad -> Sincronizar seguridad para instalar permisos flows.* en este tenant.';
        } else {
          this.message = '';
        }
        const selected = flows.find((flow) => flow.id === selectId) ?? flows[0];
        if (selected) {
          this.selectFlow(selected, !selectId);
        } else {
          this.startNewFlow();
        }
      },
      error: () => {
        this.loading = false;
        this.flows = [];
        this.startNewFlow();
        this.message = 'No se pudieron cargar los flows. Verifica que la API esté arriba, que la sesión siga activa y que Seguridad -> Sincronizar seguridad haya instalado flows.*.';
      }
    });
  }

  startNewFlow() {
    this.selectedFlowId = '';
    this.activeStage = 'describe';
    this.flowDraft = this.emptyFlowDraft();
    this.selectedStarter = 'validate';
    this.chooseStarter('validate');
    this.stepDraft = this.emptyStepDraft();
    this.flowInputs = [];
    this.lastPreview = undefined;
  }

  selectFlow(flow: FlowItem, resetStage = true) {
    this.selectedFlowId = flow.id;
    if (resetStage) {
      this.activeStage = 'describe';
    }
    this.flowDraft = {
      key: flow.key,
      name: flow.name,
      description: flow.description ?? '',
      category: flow.category ?? ''
    };
    this.flowInputs = this.flowInputsFromMetadata(flow.metadata);
    if (resetStage) {
      this.syncTestInputFromFields();
    }
    this.stepDraft = this.emptyStepDraft(flow.steps.length ? Math.max(...flow.steps.map((step) => step.position)) + 10 : 10);
    this.lastRun = undefined;
    this.lastPreview = undefined;
    this.previewThroughStepKey = '';
    this.loadRuns(flow.id);
  }

  chooseStarter(starter: FlowStarter) {
    this.selectedStarter = starter;
    const examples: Record<FlowStarter, Pick<FlowDraft, 'name' | 'description' | 'category'>> = {
      validate: {
        name: 'Validar una solicitud',
        description: 'Comprobar que los datos recibidos sean correctos antes de continuar',
        category: 'operaciones'
      },
      service: {
        name: 'Consultar información',
        description: 'Ejecutar un servicio publicado y entregar su resultado',
        category: 'integraciones'
      },
      multi_service: {
        name: 'Encadenar servicios',
        description: 'Consultar información y usar el resultado en un segundo servicio',
        category: 'integraciones'
      },
      calculate: {
        name: 'Calcular un valor',
        description: 'Calcular un resultado a partir de los datos recibidos',
        category: 'operaciones'
      },
      blank: {
        name: '',
        description: '',
        category: 'operaciones'
      }
    };
    this.flowDraft = {
      ...this.flowDraft,
      ...examples[starter]
    };
    const starterInputs: Record<FlowStarter, FlowInputField[]> = {
      validate: [
        { key: 'email', label: 'Correo', type: 'email', required: true, example: 'persona@example.com' }
      ],
      service: [
        { key: 'email', label: 'Correo', type: 'email', required: true, example: 'persona@example.com' }
      ],
      multi_service: [
        { key: 'email', label: 'Correo', type: 'email', required: true, example: 'persona@example.com' }
      ],
      calculate: [
        { key: 'subtotal', label: 'Subtotal', type: 'number', required: true, example: '100' }
      ],
      blank: []
    };
    this.flowInputs = starterInputs[starter].map((field) => ({ ...field }));
    this.syncFlowKey(true);
    this.syncTestInputFromFields();
  }

  syncFlowKey(force = false) {
    if (!this.selectedFlow && (force || !this.flowDraft.key)) {
      this.flowDraft.key = this.slugify(this.flowDraft.name);
    }
  }

  addFlowInput() {
    this.flowInputs = [
      ...this.flowInputs,
      {
        key: '',
        label: '',
        type: 'text',
        required: false,
        example: ''
      }
    ];
  }

  removeFlowInput(index: number) {
    this.flowInputs = this.flowInputs.filter((_, fieldIndex) => fieldIndex !== index);
    this.syncTestInputFromFields();
  }

  onFlowInputsChanged() {
    this.syncTestInputFromFields();
  }

  createFlow() {
    if (!this.canCreateDraft) {
      this.message = 'Escribe un nombre de al menos 3 caracteres para comenzar.';
      return;
    }
    this.api.post<FlowItem>('flows', this.flowPayload()).subscribe({
      next: (flow) => {
        this.flows = [flow, ...this.flows];
        this.selectFlow(flow);
        this.activeStage = 'build';
        this.prepareStarterStep();
        this.message = 'Proceso creado. Configura el primer paso y guárdalo.';
      },
      error: () => {
        this.message = 'No se pudo crear el flow. Revisa key y nombre.';
      }
    });
  }

  goToStage(stage: FlowStage) {
    if (this.activeStage === 'describe' && stage !== 'describe') {
      this.saveFlow(stage);
      return;
    }
    this.activeStage = stage;
  }

  saveFlow(nextStage?: FlowStage) {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api.patch<FlowItem>(`flows/${flow.id}`, this.flowPayload()).subscribe({
      next: (updated) => {
        this.message = 'Flow actualizado.';
        this.replaceFlow(updated);
        if (nextStage) {
          this.activeStage = nextStage;
        }
      },
      error: () => {
        this.message = 'No se pudo guardar el flow.';
      }
    });
  }

  trashFlow() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api.post<FlowItem>(`flows/${flow.id}/trash`, {}).subscribe({
      next: () => {
        this.message = 'Flow enviado a papelera.';
        this.load('');
      },
      error: () => {
        this.message = 'No se pudo enviar a papelera.';
      }
    });
  }

  startNewStep() {
    const flow = this.selectedFlow;
    this.stepDraft = this.emptyStepDraft(flow?.steps.length ? Math.max(...flow.steps.map((step) => step.position)) + 10 : 10);
  }

  startNewStepAfter(step: FlowTimelineStep | null) {
    const steps = this.selectedFlow?.steps ?? [];
    if (!step) {
      const firstPosition = steps[0]?.position ?? 10;
      this.stepDraft = this.emptyStepDraft(Math.max(0, Math.floor(firstPosition / 2)));
      return;
    }
    const currentIndex = steps.findIndex((item) => item.id === step.id);
    const nextPosition = steps[currentIndex + 1]?.position;
    const position =
      nextPosition && nextPosition - step.position > 1
        ? Math.floor((step.position + nextPosition) / 2)
        : step.position;
    this.stepDraft = this.emptyStepDraft(position);
  }

  selectTimelineStep(step: FlowTimelineStep) {
    const saved = this.selectedFlow?.steps.find((item) => item.id === step.id);
    if (saved) {
      this.selectStep(saved);
    }
  }

  testTimelineStep(step: FlowTimelineStep) {
    this.previewThroughStepKey = step.key;
    this.activeStage = 'test';
    this.previewFlow();
  }

  syncStepKey() {
    if (!this.stepDraft.id && !this.stepDraft.key) {
      this.stepDraft.key = this.slugify(this.stepDraft.name);
      if (!this.stepDraft.outputKey) {
        this.stepDraft.outputKey = this.stepDraft.key;
      }
    }
  }

  selectStep(step: FlowStep) {
    this.stepDraft = {
      ...this.emptyStepDraft(step.position),
      id: step.id,
      key: step.key,
      name: step.name,
      type: step.type,
      position: step.position,
      outputKey: step.outputKey ?? '',
      nextStepKey: step.nextStepKey ?? '',
      onTrueStepKey: step.onTrueStepKey ?? '',
      onFalseStepKey: step.onFalseStepKey ?? '',
      onErrorStepKey: step.onErrorStepKey ?? '',
      configText: JSON.stringify(step.config ?? {}, null, 2),
      inputMapText: JSON.stringify(step.inputMap ?? {}, null, 2),
      ...this.guidedFieldsFromStep(step)
    };
  }

  setStepType(type: FlowStepType) {
    this.stepDraft.type = type;
    this.onStepTypeChange();
  }

  onStepTypeChange() {
    const labels: Record<FlowStepType, string> = {
      start: 'Inicio',
      dynamic_service: 'Ejecutar servicio',
      formula: 'Calcular valor',
      validation: 'Validar dato',
      decision: 'Tomar decisión',
      action: 'Ejecutar acción',
      response: 'Responder',
      end: 'Fin'
    };
    if (!this.stepDraft.name) {
      this.stepDraft.name = labels[this.stepDraft.type];
    }
    if (!this.stepDraft.key) {
      this.stepDraft.key = this.slugify(labels[this.stepDraft.type]);
    }
    this.syncGuidedStepJson();
  }

  addInputRow() {
    this.stepDraft.inputRows = [...this.stepDraft.inputRows, { key: '', value: '' }];
    this.syncGuidedStepJson();
  }

  updateInputRows(rows: FlowMapRow[]) {
    this.stepDraft.inputRows = rows;
    this.syncGuidedStepJson();
  }

  onServiceSelected() {
    const expectedKeys = this.selectedServiceInputKeys;
    const currentByKey = new Map(this.stepDraft.inputRows.map((row) => [row.key, row]));
    const suggestedRows = expectedKeys.map((key) => {
      const current = currentByKey.get(key);
      return current ?? {
        key,
        value: this.suggestSourceForInput(key)
      };
    });
    const extraRows = this.stepDraft.inputRows.filter((row) => !expectedKeys.includes(row.key) && row.key.trim());
    this.stepDraft.inputRows = [...suggestedRows, ...extraRows];
    this.syncGuidedStepJson();
  }

  private suggestSourceForInput(key: string) {
    const suffix = `.${key}}}`;
    const previousOutput = this.dataSourceOptions.find(
      (option) => option.group === 'steps' && option.value.endsWith(suffix)
    );
    if (previousOutput) {
      return previousOutput.value;
    }
    const matchingInput = this.flowInputs.find((field) => field.key === key);
    return matchingInput ? `{{input.${matchingInput.key}}}` : '';
  }

  removeInputRow(index: number) {
    this.stepDraft.inputRows = this.stepDraft.inputRows.filter((_, itemIndex) => itemIndex !== index);
    this.syncGuidedStepJson();
  }

  syncGuidedStepJson() {
    if (this.stepDraft.advancedMode) {
      return;
    }
    this.stepDraft.configText = JSON.stringify(this.guidedConfig(), null, 2);
    this.stepDraft.inputMapText = JSON.stringify(this.guidedInputMap(), null, 2);
  }

  stepTypeLabel(type: FlowStepType) {
    const labels: Record<FlowStepType, string> = {
      start: 'Inicio',
      dynamic_service: 'Servicio',
      formula: 'Fórmula',
      validation: 'Validación',
      decision: 'Decisión',
      action: 'Acción',
      response: 'Respuesta',
      end: 'Fin'
    };
    return labels[type];
  }

  stepTypeSummary(type: FlowStepType) {
    const summaries: Record<FlowStepType, string> = {
      start: 'Marca la entrada del proceso.',
      dynamic_service: 'Consume un servicio dinámico publicado.',
      formula: 'Calcula valores a partir del contexto.',
      validation: 'Verifica campos antes de avanzar.',
      decision: 'Divide el camino en verdadero o falso.',
      action: 'Ejecuta una acción declarativa.',
      response: 'Construye la salida final.',
      end: 'Cierra el proceso.'
    };
    return summaries[type];
  }

  saveStep() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    const validationMessage = this.validateStepDraft();
    if (validationMessage) {
      this.message = validationMessage;
      return;
    }
    this.syncGuidedStepJson();
    let payload: Record<string, unknown>;
    try {
      payload = this.stepPayload();
    } catch {
      this.message = 'El JSON del paso no es válido.';
      return;
    }
    const request = this.stepDraft.id
      ? this.api.patch<FlowItem>(`flows/${flow.id}/steps/${this.stepDraft.id}`, payload)
      : this.api.post<FlowItem>(`flows/${flow.id}/steps`, payload);

    request.subscribe({
      next: (updated) => {
        const createdFirstService =
          !this.stepDraft.id && this.selectedStarter === 'multi_service' && this.stepDraft.type === 'dynamic_service';
        this.message = this.stepDraft.id
          ? 'Paso actualizado.'
          : createdFirstService
            ? 'Primer servicio guardado. Usa el botón + debajo para agregar el segundo; sus entradas podrán tomar este resultado.'
            : 'Paso agregado.';
        this.replaceFlow(updated);
        this.startNewStep();
      },
      error: () => {
        this.message = 'No se pudo guardar el paso. Revisa el JSON y los campos obligatorios.';
      }
    });
  }

  deleteStep() {
    const flow = this.selectedFlow;
    if (!flow || !this.stepDraft.id) {
      return;
    }
    this.api.delete<FlowItem>(`flows/${flow.id}/steps/${this.stepDraft.id}`).subscribe({
      next: (updated) => {
        this.message = 'Paso eliminado.';
        this.replaceFlow(updated);
        this.startNewStep();
      },
      error: () => {
        this.message = 'No se pudo eliminar el paso.';
      }
    });
  }

  createVersion() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api.post<FlowVersion>(`flows/${flow.id}/versions`, {}).subscribe({
      next: () => {
        this.message = 'Versión creada desde los pasos actuales.';
        this.load(flow.id);
      },
      error: () => {
        this.message = 'No se pudo crear la versión.';
      }
    });
  }

  publishLatest() {
    const flow = this.selectedFlow;
    if (!flow?.latestVersion) {
      return;
    }
    this.api.post<FlowVersion>(`flows/${flow.id}/versions/${flow.latestVersion.id}/publish`, {}).subscribe({
      next: () => {
        this.message = 'Versión publicada.';
        this.load(flow.id);
      },
      error: () => {
        this.message = 'No se pudo publicar la versión.';
      }
    });
  }

  loadRuns(flowId = this.selectedFlowId) {
    if (!flowId) {
      this.flowRuns = [];
      return;
    }
    this.api.get<FlowRunItem[]>(`flows/${flowId}/runs`).subscribe({
      next: (runs) => {
        this.flowRuns = runs;
      },
      error: () => {
        this.flowRuns = [];
      }
    });
  }

  executeFlow() {
    const flow = this.selectedFlow;
    if (!flow?.publishedVersion) {
      this.message = 'Publica una versión antes de probar el flow.';
      return;
    }
    let input: Record<string, unknown>;
    try {
      input = this.parseJson(this.testInputText);
    } catch {
      this.message = 'El input JSON de prueba no es válido.';
      return;
    }

    this.executing = true;
    this.message = 'Ejecutando flow publicado...';
    this.api.post<FlowRunItem>(`flows/${flow.id}/execute`, { input, triggerType: 'test' }).subscribe({
      next: (run) => {
        this.executing = false;
        this.lastRun = run;
        this.message = run.status === 'success' ? 'Flow ejecutado correctamente.' : 'Flow terminó con error.';
        this.loadRuns(flow.id);
      },
      error: () => {
        this.executing = false;
        this.message = 'No se pudo ejecutar el flow. Revisa publicación, permisos y pasos.';
      }
    });
  }

  previewFlow() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    let input: Record<string, unknown>;
    try {
      input = this.parseJson(this.testInputText);
    } catch {
      this.message = 'Los datos de prueba no son un JSON válido.';
      return;
    }

    this.executing = true;
    this.lastPreview = undefined;
    this.message = 'Probando el borrador...';
    this.api
      .post<FlowPreviewItem>(`flows/${flow.id}/preview`, {
        input,
        throughStepKey: this.previewThroughStepKey || null
      })
      .subscribe({
        next: (preview) => {
          this.executing = false;
          this.lastPreview = preview;
          this.message =
            preview.status === 'success'
              ? 'La prueba terminó correctamente. Puedes revisar cada paso.'
              : 'La prueba se detuvo en el paso que necesita atención.';
        },
        error: () => {
          this.executing = false;
          this.message = 'No se pudo probar el borrador. Verifica que la API esté actualizada y disponible.';
        }
      });
  }

  private replaceFlow(flow: FlowItem) {
    this.flows = this.flows.map((item) => (item.id === flow.id ? flow : item));
    this.selectFlow(flow, false);
  }

  private flowPayload() {
    return {
      ...this.flowDraft,
      metadata: {
        ...(this.selectedFlow?.metadata ?? {}),
        inputFields: this.flowInputs.map((field) => ({
          key: field.key.trim(),
          label: field.label.trim() || field.key.trim(),
          type: field.type,
          required: field.required,
          example: field.example
        }))
      }
    };
  }

  private flowInputsFromMetadata(metadata?: Record<string, unknown> | null): FlowInputField[] {
    const fields = metadata?.['inputFields'];
    if (!Array.isArray(fields)) {
      return [];
    }
    return fields
      .map((value) => this.asRecord(value))
      .map((field) => ({
        key: this.asString(field['key']),
        label: this.asString(field['label']),
        type: this.flowInputType(field['type']),
        required: field['required'] === true,
        example: field['example'] === undefined || field['example'] === null ? '' : String(field['example'])
      }));
  }

  private flowInputType(value: unknown): FlowInputType {
    return ['text', 'number', 'boolean', 'email', 'date'].includes(String(value))
      ? (value as FlowInputType)
      : 'text';
  }

  private syncTestInputFromFields() {
    if (!this.flowInputs.length) {
      this.testInputText = '{}';
      return;
    }
    const input = this.flowInputs.reduce<Record<string, unknown>>((result, field) => {
      const key = field.key.trim();
      if (key) {
        result[key] = this.inputExampleValue(field);
      }
      return result;
    }, {});
    this.testInputText = JSON.stringify(input, null, 2);
  }

  private inputExampleValue(field: FlowInputField): unknown {
    if (field.type === 'number') {
      const value = Number(field.example);
      return Number.isFinite(value) ? value : 0;
    }
    if (field.type === 'boolean') {
      return field.example === 'true';
    }
    return field.example;
  }

  private serviceInputKeys(service: DynamicServiceItem) {
    const definition = service.publishedVersion?.definition;
    if (!definition) {
      return [];
    }
    const keys = new Set<string>();
    const serialized = JSON.stringify(definition);
    for (const match of serialized.matchAll(/\{\{\s*input\.([a-zA-Z0-9_-]+)/g)) {
      if (match[1]) {
        keys.add(match[1]);
      }
    }
    for (const filter of definition.dataTarget?.filters ?? []) {
      if (filter.valueSource === 'input' && filter.inputKey) {
        keys.add(filter.inputKey);
      }
    }
    return [...keys];
  }

  serviceResultLabel(service: DynamicServiceItem) {
    const definition = service.publishedVersion?.definition;
    const labels: Record<string, string> = {
      none: 'sin contenido',
      single: 'un registro',
      list: 'una lista',
      paginated_list: 'una lista paginada',
      boolean: 'sí o no',
      file: 'un archivo'
    };
    return labels[definition?.resultKind ?? 'single'] ?? 'un resultado';
  }

  private previousStepOptions(): FlowDataOption[] {
    const flow = this.selectedFlow;
    if (!flow) {
      return [];
    }
    const steps = flow.steps
      .filter((step) => step.id !== this.stepDraft.id && step.position <= this.stepDraft.position)
      .sort((a, b) => a.position - b.position);
    const options: FlowDataOption[] = [];

    for (const step of steps) {
      const outputKey = step.outputKey || step.key;
      options.push({
        group: 'steps',
        label: `${step.name}: resultado completo`,
        value: `{{steps.${outputKey}}}`
      });
      if (step.type === 'dynamic_service') {
        options.push(
          {
            group: 'steps',
            label: `${step.name}: fue correcto`,
            value: `{{steps.${outputKey}.ok}}`
          },
          {
            group: 'steps',
            label: `${step.name}: respuesta`,
            value: `{{steps.${outputKey}.response}}`
          }
        );
        const serviceKey = this.asString((step.config ?? {})['serviceKey']);
        const service = this.publishedServices.find((item) => item.key === serviceKey);
        const definition = service?.publishedVersion?.definition;
        if (definition?.source === 'internal_table') {
          options.push({
            group: 'steps',
            label: `${step.name}: resultado consultado`,
            value: `{{steps.${outputKey}.response.result}}`
          });
        } else {
          options.push({
            group: 'steps',
            label: `${step.name}: cuerpo de respuesta`,
            value: `{{steps.${outputKey}.response.body}}`
          });
        }
        for (const key of Object.keys(definition?.responseMap ?? {})) {
          options.push({
            group: 'steps',
            label: `${step.name}: ${key}`,
            value: `{{steps.${outputKey}.response.mapped.${key}}}`
          });
        }
      } else if (step.type === 'validation') {
        options.push(
          { group: 'steps', label: `${step.name}: es válido`, value: `{{steps.${outputKey}.valid}}` },
          { group: 'steps', label: `${step.name}: valor`, value: `{{steps.${outputKey}.value}}` }
        );
      } else if (step.type === 'decision') {
        options.push({
          group: 'steps',
          label: `${step.name}: resultado sí/no`,
          value: `{{steps.${outputKey}.result}}`
        });
      }

      const observed = this.lastPreview?.steps.find((item) => item.stepKey === step.key)?.output;
      if (observed && step.type !== 'formula') {
        for (const path of this.leafPaths(observed)) {
          options.push({
            group: 'steps',
            label: `${step.name}: ${path}`,
            value: `{{steps.${outputKey}.${path}}}`
          });
        }
      }
    }
    return options;
  }

  private leafPaths(value: unknown, prefix = '', depth = 0): string[] {
    if (depth > 4 || value === null || value === undefined) {
      return prefix ? [prefix] : [];
    }
    if (Array.isArray(value)) {
      return prefix ? [prefix] : [];
    }
    if (typeof value !== 'object') {
      return prefix ? [prefix] : [];
    }
    const paths = Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      this.leafPaths(item, prefix ? `${prefix}.${key}` : key, depth + 1)
    );
    return paths.length ? paths : prefix ? [prefix] : [];
  }

  private uniqueDataOptions(options: FlowDataOption[]) {
    const seen = new Set<string>();
    return options.filter((option) => {
      if (seen.has(option.value)) {
        return false;
      }
      seen.add(option.value);
      return true;
    });
  }

  private prepareStarterStep() {
    this.startNewStep();
    switch (this.selectedStarter) {
      case 'validate':
        this.stepDraft.type = 'validation';
        this.stepDraft.name = 'Validar correo';
        this.stepDraft.key = 'validar_correo';
        this.stepDraft.outputKey = 'validacion_correo';
        this.stepDraft.validationField = 'input.email';
        this.stepDraft.validationOperator = 'email';
        this.stepDraft.validationMessage = 'Escribe un correo válido';
        this.testInputText = '{\n  "email": "persona@example.com"\n}';
        break;
      case 'service':
      case 'multi_service':
        this.stepDraft.type = 'dynamic_service';
        this.stepDraft.name = this.selectedStarter === 'multi_service' ? 'Ejecutar primer servicio' : 'Ejecutar servicio';
        this.stepDraft.key = this.selectedStarter === 'multi_service' ? 'primer_servicio' : 'ejecutar_servicio';
        this.stepDraft.outputKey = this.selectedStarter === 'multi_service' ? 'primer_resultado' : 'resultado_servicio';
        this.stepDraft.serviceKey = this.publishedServices[0]?.key ?? '';
        this.testInputText = '{\n  "email": "persona@example.com"\n}';
        break;
      case 'calculate':
        this.stepDraft.type = 'formula';
        this.stepDraft.name = 'Calcular total';
        this.stepDraft.key = 'calcular_total';
        this.stepDraft.outputKey = 'total';
        this.stepDraft.formulaLeft = 'input.subtotal';
        this.stepDraft.formulaOperator = '*';
        this.stepDraft.formulaRight = '1.19';
        this.testInputText = '{\n  "subtotal": 100\n}';
        break;
      case 'blank':
        this.stepDraft = this.emptyStepDraft();
        this.stepDraft.inputRows = [];
        break;
    }
    this.syncGuidedStepJson();
  }

  private validateStepDraft() {
    if (this.stepDraft.name.trim().length < 3) {
      return 'Dale un nombre claro al paso.';
    }
    if (!/^[a-z][a-z0-9_]{2,119}$/.test(this.stepDraft.key)) {
      return 'El identificador del paso debe usar snake_case y tener al menos 3 caracteres.';
    }
    if (this.stepDraft.type === 'dynamic_service' && !this.stepDraft.serviceKey) {
      return 'Selecciona el servicio publicado que debe ejecutar este paso.';
    }
    if (this.stepDraft.type === 'decision' && (!this.stepDraft.decisionLeft.trim() || !this.stepDraft.decisionRight.trim())) {
      return 'Completa el dato, la comparación y el valor de la decisión.';
    }
    if (this.stepDraft.type === 'formula' && (!this.stepDraft.formulaLeft.trim() || !this.stepDraft.formulaRight.trim())) {
      return 'Completa los dos valores de la fórmula.';
    }
    if (this.stepDraft.type === 'validation' && !this.stepDraft.validationField.trim()) {
      return 'Indica qué campo debe validar este paso.';
    }
    return '';
  }

  private decisionRule() {
    const left = { var: this.stepDraft.decisionLeft.trim() };
    const right = this.decisionRightOperand();
    if (this.stepDraft.decisionOperator === 'in') {
      return { in: [right, left] };
    }
    return {
      [this.stepDraft.decisionOperator]: [left, right]
    };
  }

  private decisionRightOperand(): unknown {
    switch (this.stepDraft.decisionRightType) {
      case 'number':
        return Number(this.stepDraft.decisionRight);
      case 'boolean':
        return this.stepDraft.decisionRight === 'true';
      case 'path':
        return { var: this.stepDraft.decisionRight.trim() };
      case 'text':
        return this.stepDraft.decisionRight;
    }
  }

  private ruleOperand(value: string): unknown {
    const trimmed = value.trim();
    if (/^(input|tenant|user|steps)(\.[a-zA-Z0-9_-]+)+$/.test(trimmed)) {
      return { var: trimmed };
    }
    return this.parseScalar(trimmed);
  }

  private parseScalar(value: string): unknown {
    const trimmed = value.trim();
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
    if (trimmed === 'null') {
      return null;
    }
    if (trimmed !== '' && Number.isFinite(Number(trimmed))) {
      return Number(trimmed);
    }
    return value;
  }

  private guidedDecisionFields(value: unknown): Partial<StepDraft> {
    const rule = this.asRecord(value);
    const operator = Object.keys(rule)[0];
    const operands = Array.isArray(rule[operator]) ? (rule[operator] as unknown[]) : [];
    if (!operator || operands.length < 2) {
      return {};
    }
    const leftOperand = operator === 'in' ? operands[1] : operands[0];
    const rightOperand = operator === 'in' ? operands[0] : operands[1];
    const leftPath = this.asString(this.asRecord(leftOperand)['var']);
    const rightPath = this.asString(this.asRecord(rightOperand)['var']);
    const rightType: StepDraft['decisionRightType'] = rightPath
      ? 'path'
      : typeof rightOperand === 'number'
        ? 'number'
        : typeof rightOperand === 'boolean'
          ? 'boolean'
          : 'text';
    return {
      decisionLeft: leftPath || 'input.value',
      decisionOperator: operator,
      decisionRight: rightPath || String(rightOperand ?? ''),
      decisionRightType: rightType
    };
  }

  private guidedFormulaFields(value: unknown): Partial<StepDraft> {
    const rule = this.asRecord(value);
    const operator = Object.keys(rule)[0];
    if (!['+', '-', '*', '/', '%'].includes(operator)) {
      return {};
    }
    const operands = Array.isArray(rule[operator]) ? (rule[operator] as unknown[]) : [];
    return {
      formulaOperator: operator,
      formulaLeft: this.ruleOperandLabel(operands[0]),
      formulaRight: this.ruleOperandLabel(operands[1])
    };
  }

  private ruleOperandLabel(value: unknown) {
    const path = this.asString(this.asRecord(value)['var']);
    return path || String(value ?? '');
  }

  private guidedConfig() {
    const timeoutMs = Number(this.stepDraft.timeoutMs) || 0;
    const retryAttempts = Number(this.stepDraft.retryAttempts) || 0;
    const retryBackoffMs = Number(this.stepDraft.retryBackoffMs) || 0;
    switch (this.stepDraft.type) {
      case 'dynamic_service':
        return {
          serviceKey: this.stepDraft.serviceKey,
          timeoutMs,
          retry: {
            attempts: retryAttempts,
            backoffMs: retryBackoffMs
          }
        };
      case 'decision':
        return {
          language: 'json_logic',
          rule: this.decisionRule()
        };
      case 'formula':
        return {
          language: 'json_logic',
          rule: {
            [this.stepDraft.formulaOperator]: [
              this.ruleOperand(this.stepDraft.formulaLeft),
              this.ruleOperand(this.stepDraft.formulaRight)
            ]
          },
          precision: Number(this.stepDraft.formulaPrecision)
        };
      case 'validation':
        return {
          field: this.stepDraft.validationField,
          operator: this.stepDraft.validationOperator,
          value: this.validationNeedsValue ? this.parseScalar(this.stepDraft.validationValue) : null,
          message: this.stepDraft.validationMessage || null
        };
      case 'action':
        return {
          action: this.stepDraft.actionName
        };
      case 'response':
        return {
          status: this.stepDraft.responseStatus,
          body: this.parseJsonLenient(this.stepDraft.responseBodyText)
        };
      case 'start':
        return {
          mode: 'manual'
        };
      case 'end':
        return {
          status: 'completed'
        };
    }
  }

  private guidedInputMap() {
    return this.stepDraft.inputRows.reduce<Record<string, string>>((map, row) => {
      const key = row.key.trim();
      if (key) {
        map[key] = row.value;
      }
      return map;
    }, {});
  }

  private guidedFieldsFromStep(step: FlowStep): Partial<StepDraft> {
    const config = step.config ?? {};
    const inputMap = step.inputMap ?? {};
    const retry = this.asRecord(config['retry']);
    return {
      serviceKey: this.asString(config['serviceKey']),
      timeoutMs: this.asNumber(config['timeoutMs'], 8000),
      retryAttempts: this.asNumber(retry['attempts'], 0),
      retryBackoffMs: this.asNumber(retry['backoffMs'], 0),
      conditionExpression: this.asString(config['expression']),
      formulaExpression: this.asString(config['expression']),
      ...this.guidedDecisionFields(config['rule']),
      ...this.guidedFormulaFields(config['rule']),
      formulaPrecision: this.asNumber(config['precision'], 2),
      validationField: this.asString(config['field']),
      validationOperator: this.asString(config['operator']) || 'required',
      validationValue: config['value'] === null || config['value'] === undefined ? '' : String(config['value']),
      validationMessage: this.asString(config['message']),
      actionName: this.asString(config['action']) || 'create_record',
      responseStatus: this.asString(config['status']) || 'success',
      responseBodyText: JSON.stringify(config['body'] ?? { ok: true, data: '{{steps}}' }, null, 2),
      inputRows: Object.entries(inputMap).map(([key, value]) => ({ key, value: String(value) })),
      advancedMode: false
    };
  }

  private stepPayload() {
    return {
      key: this.stepDraft.key,
      name: this.stepDraft.name,
      type: this.stepDraft.type,
      position: Number(this.stepDraft.position),
      outputKey: this.stepDraft.outputKey || null,
      nextStepKey: this.stepDraft.nextStepKey || null,
      onTrueStepKey: this.stepDraft.onTrueStepKey || null,
      onFalseStepKey: this.stepDraft.onFalseStepKey || null,
      onErrorStepKey: this.stepDraft.onErrorStepKey || null,
      config: this.parseJson(this.stepDraft.configText),
      inputMap: this.parseJson(this.stepDraft.inputMapText)
    };
  }

  private parseJson(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return {};
    }
    return JSON.parse(trimmed) as Record<string, unknown>;
  }

  private parseJsonLenient(value: string) {
    try {
      return this.parseJson(value);
    } catch {
      return { raw: value };
    }
  }

  private emptyFlowDraft(): FlowDraft {
    return {
      key: '',
      name: '',
      description: '',
      category: 'operaciones'
    };
  }

  private emptyStepDraft(position = 10): StepDraft {
    return {
      id: '',
      key: '',
      name: '',
      type: 'dynamic_service',
      position,
      outputKey: '',
      nextStepKey: '',
      onTrueStepKey: '',
      onFalseStepKey: '',
      onErrorStepKey: '',
      configText: '{\n  "serviceKey": ""\n}',
      inputMapText: '{\n  "value": "{{input.value}}"\n}',
      serviceKey: '',
      timeoutMs: 8000,
      retryAttempts: 0,
      retryBackoffMs: 0,
      conditionExpression: '{{steps.servicio.ok}} === true',
      formulaExpression: '{{input.value}}',
      decisionLeft: 'input.value',
      decisionOperator: '===',
      decisionRight: 'true',
      decisionRightType: 'boolean',
      formulaLeft: 'input.value',
      formulaOperator: '*',
      formulaRight: '1',
      formulaPrecision: 2,
      validationField: 'input.value',
      validationOperator: 'required',
      validationValue: '',
      validationMessage: 'El valor es obligatorio',
      actionName: 'create_record',
      responseStatus: 'success',
      responseBodyText: '{\n  "ok": true,\n  "data": "{{steps}}"\n}',
      inputRows: [{ key: 'value', value: '{{input.value}}' }],
      advancedMode: false
    };
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private asString(value: unknown) {
    return typeof value === 'string' ? value : '';
  }

  private asNumber(value: unknown, fallback: number) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}

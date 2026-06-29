import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';
import {
  FlowDataMapperComponent,
  FlowDataOption,
  FlowMapRow
} from './flow-data-mapper.component';
import { FlowGraphComponent } from './flow-graph.component';
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
  onTimeoutStepKey?: string | null;
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
  onTimeoutStepKey: string;
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

type FlowTestTarget = 'draft' | 'published';
type FlowTestAssertionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'exists'
  | 'truthy'
  | 'greater_than'
  | 'less_than';

interface FlowTestAssertion {
  path: string;
  operator: FlowTestAssertionOperator;
  expected?: unknown;
}

interface FlowTestCaseItem {
  id: string;
  name: string;
  input: Record<string, unknown>;
  expectedOutput?: Record<string, unknown> | null;
  expectedStatus: 'success' | 'failed';
  target: FlowTestTarget;
  throughStepKey?: string | null;
  assertions?: FlowTestAssertion[] | null;
  active: boolean;
  lastResult?: FlowTestResult | null;
  lastRunAt?: string | null;
}

interface FlowTestResult {
  testCaseId?: string;
  testCaseName?: string;
  passed: boolean;
  target: FlowTestTarget;
  expectedStatus: 'success' | 'failed';
  actualStatus: 'success' | 'failed';
  statusPassed: boolean;
  expectedOutputPassed: boolean;
  assertionResults: Array<FlowTestAssertion & { actual?: unknown; passed: boolean }>;
  executionError?: string | null;
  actual: Record<string, unknown>;
}

interface FlowTestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  results: FlowTestResult[];
}

interface FlowTestCaseDraft {
  id: string;
  name: string;
  target: FlowTestTarget;
  expectedStatus: 'success' | 'failed';
  throughStepKey: string;
  inputText: string;
  expectedOutputText: string;
  assertions: Array<{
    path: string;
    operator: FlowTestAssertionOperator;
    expectedText: string;
  }>;
  active: boolean;
}

@Component({
  selector: 'app-flows-page',
  standalone: true,
  imports: [
    FormsModule,
    JsonPipe,
    MainNavComponent,
    FlowTimelineComponent,
    FlowGraphComponent,
    FlowDataMapperComponent
  ],
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

      .stage-button > span:last-child {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .stage-button strong,
      .stage-button .meta {
        display: block;
        overflow-wrap: anywhere;
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

      .view-switch {
        display: inline-flex;
        gap: 4px;
        padding: 3px;
        border: 1px solid #c8d9eb;
        border-radius: 8px;
        background: #eef4fa;
      }

      .view-switch button {
        border: 0;
        min-height: 30px;
        padding: 5px 9px;
        background: transparent;
      }

      .view-switch button.active {
        background: #fff;
        color: #174f91;
        box-shadow: 0 1px 4px rgba(23, 79, 145, 0.14);
      }

      .connection-summary {
        display: grid;
        gap: 8px;
        border-left: 4px solid #1f5ca8;
        background: #eef6ff;
        padding: 10px 12px;
      }

      .connection-summary strong {
        color: #174f91;
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

      .assistant-actions {
        position: sticky;
        bottom: 10px;
        z-index: 5;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 10px;
        border: 1px solid #b9cfe6;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.97);
        box-shadow: 0 8px 24px rgba(30, 80, 130, 0.14);
      }

      .assistant-actions .meta {
        margin-right: auto;
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

      .test-studio {
        display: grid;
        grid-template-columns: minmax(220px, 0.72fr) minmax(340px, 1.28fr);
        gap: 14px;
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid #d7e5f2;
      }

      .test-case-list {
        display: grid;
        gap: 7px;
      }

      .test-case {
        display: grid;
        gap: 3px;
        width: 100%;
        text-align: left;
      }

      .test-case.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .test-result-bar {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .test-result-bar > div {
        display: grid;
        gap: 2px;
        border: 1px solid #d7e5f2;
        border-radius: 7px;
        padding: 9px;
        background: #fff;
      }

      .assertion-row {
        display: grid;
        grid-template-columns: minmax(150px, 1.2fr) minmax(130px, 0.8fr) minmax(140px, 1fr) auto;
        gap: 8px;
        align-items: end;
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
        .test-studio,
        .test-result-bar,
        .assertion-row,
        .starter-grid {
          grid-template-columns: 1fr;
        }

        .stage-nav {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .stage-button {
          min-height: 62px;
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

                @if (selectedStarter === 'service' || selectedStarter === 'multi_service') {
                  <div class="guided-panel">
                    <div>
                      <div class="mini-title">
                        {{ selectedStarter === 'multi_service' ? 'Elige todos los servicios en el orden de ejecución' : 'Elige el servicio principal' }}
                      </div>
                      <p class="meta">Solo aparecen servicios activos con una versión publicada.</p>
                    </div>
                    @if (selectedStarter === 'multi_service') {
                      @for (serviceKey of starterServiceKeys; track $index) {
                        <div class="map-row">
                          <label>
                            Servicio {{ $index + 1 }}
                            <select [(ngModel)]="starterServiceKeys[$index]" (ngModelChange)="onStarterServicesChanged()">
                              <option value="">Selecciona un servicio</option>
                              @for (service of publishedServices; track service.id) {
                                <option [value]="service.key">{{ service.name }}</option>
                              }
                            </select>
                          </label>
                          <span class="meta">Se ejecuta después del servicio {{ $index || 'de entrada' }}.</span>
                          <button
                            type="button"
                            title="Quitar servicio"
                            (click)="removeStarterService($index)"
                            [disabled]="starterServiceKeys.length <= 2"
                          >
                            <i class="pi pi-trash" aria-hidden="true"></i>
                          </button>
                        </div>
                      }
                      <button type="button" (click)="addStarterService()">
                        <i class="pi pi-plus" aria-hidden="true"></i> Agregar otro servicio
                      </button>
                    } @else {
                      <div class="grid">
                        <label>
                          Servicio
                          <select [(ngModel)]="starterServiceKeys[0]" (ngModelChange)="onStarterServicesChanged()">
                            <option value="">Selecciona un servicio</option>
                            @for (service of publishedServices; track service.id) {
                              <option [value]="service.key">{{ service.name }}</option>
                            }
                          </select>
                        </label>
                      </div>
                    }
                    @if (!publishedServices.length) {
                      <div class="issue">
                        <i class="pi pi-info-circle" aria-hidden="true"></i>
                        <span>Primero crea y publica al menos un servicio desde Administración → Servicios.</span>
                      </div>
                    }
                  </div>
                }
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
                  <button class="primary" type="button" (click)="createFlow()" [disabled]="!canCreate || !canCreateDraft || creatingFlow">
                    {{ creatingFlow ? 'Creando proceso...' : 'Crear proceso completo' }}
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
                      <p class="meta">El mapa muestra exactamente qué resultado activa cada paso.</p>
                    </div>
                    <div class="row">
                      <span class="view-switch" aria-label="Vista del recorrido">
                        <button type="button" [class.active]="buildView === 'graph'" (click)="buildView = 'graph'">
                          <i class="pi pi-share-alt" aria-hidden="true"></i> Mapa
                        </button>
                        <button type="button" [class.active]="buildView === 'list'" (click)="buildView = 'list'">
                          <i class="pi pi-list" aria-hidden="true"></i> Lista
                        </button>
                      </span>
                      <button type="button" (click)="startNewStep()">Agregar paso</button>
                    </div>
                  </div>

                  @if (buildView === 'graph') {
                    <app-flow-graph
                      [steps]="selectedFlow.steps"
                      [selectedStepId]="stepDraft.id"
                      [statuses]="timelineStatuses"
                      (selected)="selectTimelineStep($event)"
                    ></app-flow-graph>
                  } @else {
                    <app-flow-timeline
                      [steps]="selectedFlow.steps"
                      [selectedStepId]="stepDraft.id"
                      [statuses]="timelineStatuses"
                      (selected)="selectTimelineStep($event)"
                      (addAfter)="startNewStepAfter($event)"
                      (testStep)="testTimelineStep($event)"
                      (duplicateStep)="duplicateTimelineStep($event)"
                    ></app-flow-timeline>
                  }

                  <div class="step-editor">
                    @if (stepDraftIssues.length) {
                      <div class="issue-list">
                        @for (issue of stepDraftIssues; track issue) {
                          <div class="issue">
                            <i class="pi pi-info-circle" aria-hidden="true"></i>
                            <span>{{ issue }}</span>
                          </div>
                        }
                      </div>
                    }
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
                        <p class="meta">Estas conexiones son las que usa el runner. Elige un destino explícito cuando no quieras seguir el orden visual.</p>
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
                            {{ stepDraft.type === 'dynamic_service' ? 'Cuando el servicio responde bien' : 'Cuando termina correctamente' }}
                            <select [(ngModel)]="stepDraft.nextStepKey">
                              <option value="">Siguiente paso de la lista</option>
                              @for (step of availableTargetSteps; track step.id) {
                                <option [value]="step.key">{{ step.name }}</option>
                              }
                            </select>
                          </label>
                          @if (stepDraft.type === 'validation' || stepDraft.type === 'dynamic_service') {
                            <label>
                              {{ stepDraft.type === 'dynamic_service' ? 'Cuando el servicio devuelve error' : 'Cuando no cumple' }}
                              <select [(ngModel)]="stepDraft.onErrorStepKey">
                                <option value="">Detener y mostrar el error</option>
                                @for (step of availableTargetSteps; track step.id) {
                                  <option [value]="step.key">{{ step.name }}</option>
                                }
                              </select>
                            </label>
                          }
                          @if (stepDraft.type === 'dynamic_service') {
                            <label>
                              Cuando supera el tiempo límite
                              <select [(ngModel)]="stepDraft.onTimeoutStepKey">
                                <option value="">Usar la ruta de error o detener</option>
                                @for (step of availableTargetSteps; track step.id) {
                                  <option [value]="step.key">{{ step.name }}</option>
                                }
                              </select>
                            </label>
                          }
                        </div>
                      }
                      <div class="connection-summary">
                        <strong>{{ currentConnectionSummary }}</strong>
                        <span class="meta">Guarda el paso para actualizar el mapa de ejecución.</span>
                      </div>
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

                    <div class="assistant-actions">
                      <span class="meta">
                        {{ stepHasChanges ? 'Hay cambios sin guardar.' : 'Paso guardado. Puedes probarlo o continuar.' }}
                      </span>
                      @if (stepDraft.id && stepHasChanges) {
                        <button type="button" (click)="resetStepChanges()">Deshacer cambios</button>
                      }
                      <button type="button" (click)="saveStep('stay')" [disabled]="!canUpdate || stepDraftIssues.length > 0">
                        <i class="pi pi-save" aria-hidden="true"></i> Guardar
                      </button>
                      <button class="primary" type="button" (click)="saveStep('test')" [disabled]="!canUpdate || stepDraftIssues.length > 0">
                        <i class="pi pi-bolt" aria-hidden="true"></i> Guardar y probar
                      </button>
                      <button type="button" (click)="saveStep('next')" [disabled]="!canUpdate || stepDraftIssues.length > 0">
                        Guardar y agregar siguiente <i class="pi pi-arrow-right" aria-hidden="true"></i>
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
                    <h3>Cómo se activa cada paso</h3>
                    <p class="meta">El runner empieza por el primer bloque y sigue la conexión producida por cada resultado.</p>
                  </div>
                  <div class="checklist">
                    <div class="check-item">
                      <span class="check-mark">1</span>
                      <div><strong>Entrada</strong><span class="meta">El proceso recibe los datos de prueba o de la pantalla que lo invoque.</span></div>
                    </div>
                    <div class="check-item">
                      <span class="check-mark">2</span>
                      <div><strong>Resultado y conexión</strong><span class="meta">Éxito, error, timeout, Sí o No seleccionan el siguiente destino.</span></div>
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
                  <div class="guided-panel">
                    <div>
                      <div class="mini-title">Datos de prueba</div>
                      <p class="meta">Completa el formulario como lo haría una pantalla real.</p>
                    </div>
                    @for (field of flowInputs; track field.key) {
                      <label>
                        {{ field.label || field.key }}{{ field.required ? ' *' : '' }}
                        @if (field.type === 'boolean') {
                          <select
                            [ngModel]="testInputValues[field.key]"
                            (ngModelChange)="setTestInputValue(field, $event)"
                          >
                            <option [ngValue]="true">Sí</option>
                            <option [ngValue]="false">No</option>
                          </select>
                        } @else {
                          <input
                            [type]="testInputType(field)"
                            [ngModel]="testInputValues[field.key]"
                            (ngModelChange)="setTestInputValue(field, $event)"
                          />
                        }
                      </label>
                    } @empty {
                      <div class="hint">Este proceso no definió entradas. Puedes usar el JSON avanzado.</div>
                    }
                    <details>
                      <summary><strong>JSON avanzado</strong></summary>
                      <textarea [(ngModel)]="testInputText" (ngModelChange)="syncTestValuesFromJson()"></textarea>
                    </details>
                  </div>
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
                    <div class="row">
                      @if (lastPreview.status === 'success') {
                        <button class="primary" type="button" (click)="continueFromPreview()">
                          Usar resultado y continuar <i class="pi pi-arrow-right" aria-hidden="true"></i>
                        </button>
                      } @else {
                        <button type="button" (click)="editFailedPreviewStep()">Corregir paso con error</button>
                      }
                    </div>
                  </div>
                }

                <div class="test-studio">
                  <section>
                    <div class="toolbar">
                      <div>
                        <h3>Casos guardados</h3>
                        <p class="meta">{{ testCases.length }} escenarios</p>
                      </div>
                      <button type="button" title="Nuevo caso" (click)="startNewTestCase()">
                        <i class="pi pi-plus" aria-hidden="true"></i>
                      </button>
                    </div>
                    <div class="test-case-list">
                      @for (testCase of testCases; track testCase.id) {
                        <button
                          class="test-case"
                          type="button"
                          [class.active]="testCase.id === testCaseDraft.id"
                          (click)="selectTestCase(testCase)"
                        >
                          <strong>{{ testCase.name }}</strong>
                          <span class="meta">
                            {{ testCase.target === 'draft' ? 'Borrador' : 'Publicada' }} ·
                            {{ testCase.assertions?.length ?? 0 }} comprobaciones
                          </span>
                          @if (testCase.lastResult) {
                            <span
                              class="badge"
                              [class.status-success]="testCase.lastResult.passed"
                              [class.status-failed]="!testCase.lastResult.passed"
                            >
                              {{ testCase.lastResult.passed ? 'PASÓ' : 'FALLÓ' }}
                            </span>
                          }
                        </button>
                      } @empty {
                        <div class="hint">Guarda el primer escenario para repetirlo después de cada cambio.</div>
                      }
                    </div>
                    <button
                      class="primary"
                      type="button"
                      style="margin-top: 10px; width: 100%;"
                      (click)="runTestSuite()"
                      [disabled]="runningTests || !testCases.length"
                    >
                      <i class="pi pi-play" aria-hidden="true"></i>
                      {{ runningTests ? 'Ejecutando suite...' : 'Ejecutar todos' }}
                    </button>
                  </section>

                  <section>
                    <div class="section-heading">
                      <h3>{{ testCaseDraft.id ? 'Editar caso de prueba' : 'Nuevo caso de prueba' }}</h3>
                      <p class="meta">Define la entrada y comprueba campos concretos de la respuesta sin leer todo el JSON.</p>
                    </div>
                    <div class="grid">
                      <label>
                        Nombre del escenario
                        <input [(ngModel)]="testCaseDraft.name" placeholder="Solicitud válida" />
                      </label>
                      <label>
                        Probar
                        <select [(ngModel)]="testCaseDraft.target">
                          <option value="draft">Borrador actual</option>
                          <option value="published">Versión publicada</option>
                        </select>
                      </label>
                      <label>
                        Resultado esperado
                        <select [(ngModel)]="testCaseDraft.expectedStatus">
                          <option value="success">Debe terminar correctamente</option>
                          <option value="failed">Debe fallar de forma controlada</option>
                        </select>
                      </label>
                      @if (testCaseDraft.target === 'draft') {
                        <label>
                          Ejecutar hasta
                          <select [(ngModel)]="testCaseDraft.throughStepKey">
                            <option value="">Todo el proceso</option>
                            @for (step of selectedFlow.steps; track step.id) {
                              <option [value]="step.key">{{ step.name }}</option>
                            }
                          </select>
                        </label>
                      }
                    </div>
                    <label style="margin-top: 10px;">
                      Entrada JSON
                      <textarea [(ngModel)]="testCaseDraft.inputText"></textarea>
                    </label>

                    <div class="toolbar" style="margin-top: 12px;">
                      <div>
                        <div class="mini-title">Comprobaciones</div>
                        <p class="meta">Ejemplo: <code>output.body.ok</code> es igual a <code>true</code>.</p>
                      </div>
                      <button type="button" (click)="addTestAssertion()">
                        <i class="pi pi-plus" aria-hidden="true"></i> Agregar
                      </button>
                    </div>
                    @for (assertion of testCaseDraft.assertions; track $index) {
                      <div class="assertion-row">
                        <label>
                          Campo de respuesta
                          <input [(ngModel)]="assertion.path" placeholder="output.body.ok" />
                        </label>
                        <label>
                          Comprobar
                          <select [(ngModel)]="assertion.operator">
                            <option value="equals">Es igual a</option>
                            <option value="not_equals">Es diferente de</option>
                            <option value="contains">Contiene</option>
                            <option value="exists">Existe</option>
                            <option value="truthy">Es verdadero</option>
                            <option value="greater_than">Es mayor que</option>
                            <option value="less_than">Es menor que</option>
                          </select>
                        </label>
                        <label>
                          Valor esperado
                          <input
                            [(ngModel)]="assertion.expectedText"
                            [disabled]="assertion.operator === 'exists' || assertion.operator === 'truthy'"
                            placeholder="true"
                          />
                        </label>
                        <button type="button" title="Quitar comprobación" (click)="removeTestAssertion($index)">
                          <i class="pi pi-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                    } @empty {
                      <div class="hint">Sin comprobaciones: solo se validará si el proceso termina como esperas.</div>
                    }

                    <details class="guided-panel">
                      <summary><strong>Comparar fragmento de salida JSON</strong></summary>
                      <p class="meta">Opcional. Solo se comparan las propiedades escritas; las propiedades adicionales se ignoran.</p>
                      <textarea [(ngModel)]="testCaseDraft.expectedOutputText" placeholder='{"body":{"ok":true}}'></textarea>
                    </details>

                    <div class="row" style="margin-top: 12px;">
                      <button class="primary" type="button" (click)="saveTestCase()" [disabled]="runningTests">
                        <i class="pi pi-save" aria-hidden="true"></i>
                        {{ testCaseDraft.id ? 'Guardar caso' : 'Crear caso' }}
                      </button>
                      @if (testCaseDraft.id) {
                        <button type="button" (click)="runSelectedTestCase()" [disabled]="runningTests">
                          <i class="pi pi-play" aria-hidden="true"></i> Ejecutar caso
                        </button>
                        <button class="danger" type="button" (click)="deleteTestCase()" [disabled]="runningTests">
                          Eliminar
                        </button>
                      }
                    </div>

                    @if (testSuiteResult) {
                      <div class="test-result-bar" style="margin-top: 12px;">
                        <div><strong>{{ testSuiteResult.total }}</strong><span class="meta">Ejecutados</span></div>
                        <div><strong>{{ testSuiteResult.passed }}</strong><span class="meta">Correctos</span></div>
                        <div><strong>{{ testSuiteResult.failed }}</strong><span class="meta">Fallidos</span></div>
                      </div>
                    }
                    @if (lastTestResult) {
                      <div class="run-card" style="margin-top: 12px;">
                        <strong>{{ lastTestResult.passed ? 'Caso correcto' : 'Caso con diferencias' }}</strong>
                        @for (assertion of lastTestResult.assertionResults; track assertion.path + assertion.operator) {
                          <div class="step-run">
                            <span>{{ assertion.path }} · {{ assertion.operator }}</span>
                            <span class="meta">{{ assertion.passed ? 'Cumple' : 'Esperado: ' + (assertion.expected | json) + ' · recibido: ' + (assertion.actual | json) }}</span>
                          </div>
                        }
                        <details>
                          <summary>Ver resultado completo</summary>
                          <pre>{{ lastTestResult.actual | json }}</pre>
                        </details>
                      </div>
                    }
                  </section>
                </div>

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
    { key: 'multi_service', label: 'Encadenar servicios', summary: 'Conecta tantos servicios como necesite el proceso.' },
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
  creatingFlow = false;
  runningTests = false;
  activeStage: FlowStage = 'describe';
  buildView: 'graph' | 'list' = 'graph';
  selectedStarter: FlowStarter = 'validate';
  starterServiceKeys = ['', ''];
  previewThroughStepKey = '';
  testInputText = '{\n  "email": "admin@example.com"\n}';
  testInputValues: Record<string, unknown> = {};
  lastRun?: FlowRunItem;
  lastPreview?: FlowPreviewItem;
  lastTestResult?: FlowTestResult;
  testSuiteResult?: FlowTestSuiteResult;
  testCases: FlowTestCaseItem[] = [];
  testCaseDraft: FlowTestCaseDraft = this.emptyTestCaseDraft();
  flowInputs: FlowInputField[] = [];
  stepBaseline = '';
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

  get stepDraftIssues() {
    const issues: string[] = [];
    const baseIssue = this.validateStepDraft();
    if (baseIssue) {
      issues.push(baseIssue);
    }
    if (this.stepDraft.type === 'dynamic_service' && this.stepDraft.serviceKey) {
      const missingInputs = this.selectedServiceInputKeys.filter((key) => {
        const row = this.stepDraft.inputRows.find((item) => item.key === key);
        return !row?.value || row.value === '__manual__';
      });
      if (missingInputs.length) {
        issues.push(`Conecta los datos requeridos por el servicio: ${missingInputs.join(', ')}.`);
      }
    }
    if (
      this.stepDraft.type === 'decision' &&
      (!this.stepDraft.onTrueStepKey ||
        !this.stepDraft.onFalseStepKey ||
        this.stepDraft.onTrueStepKey === this.stepDraft.onFalseStepKey)
    ) {
      issues.push('Selecciona dos pasos diferentes para las rutas Sí y No.');
    }
    return [...new Set(issues)];
  }

  get stepHasChanges() {
    return this.stepDraftSnapshot() !== this.stepBaseline;
  }

  get canCreateDraft() {
    const baseValid =
      this.flowDraft.name.trim().length >= 3 && /^[a-z][a-z0-9_]{2,119}$/.test(this.flowDraft.key);
    if (!baseValid) {
      return false;
    }
    if (this.selectedStarter === 'service') {
      return Boolean(this.starterServiceKeys[0]);
    }
    if (this.selectedStarter === 'multi_service') {
      return this.starterServiceKeys.length >= 2 && this.starterServiceKeys.every((key) => Boolean(key));
    }
    return true;
  }

  get validationNeedsValue() {
    return !['required', 'not_empty', 'email'].includes(this.stepDraft.validationOperator);
  }

  get availableTargetSteps() {
    return (this.selectedFlow?.steps ?? []).filter((step) => step.id !== this.stepDraft.id);
  }

  get currentConnectionSummary() {
    const targetName = (key: string, fallback: string) =>
      key ? this.availableTargetSteps.find((step) => step.key === key)?.name ?? key : fallback;
    if (this.stepDraft.type === 'decision') {
      return `Sí → ${targetName(this.stepDraft.onTrueStepKey, 'elige un destino')} · No → ${targetName(this.stepDraft.onFalseStepKey, 'elige otro destino')}`;
    }
    const success = targetName(this.stepDraft.nextStepKey, 'siguiente paso de la lista');
    if (this.stepDraft.type === 'dynamic_service') {
      const error = targetName(this.stepDraft.onErrorStepKey, 'detener con error');
      const timeout = targetName(this.stepDraft.onTimeoutStepKey, this.stepDraft.onErrorStepKey ? error : 'detener por timeout');
      return `Éxito → ${success} · Error → ${error} · Timeout → ${timeout}`;
    }
    if (this.stepDraft.type === 'validation') {
      return `Cumple → ${success} · No cumple → ${targetName(this.stepDraft.onErrorStepKey, 'detener con mensaje')}`;
    }
    return `Al terminar → ${success}`;
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
    this.flowInputs = [];
    this.chooseStarter('validate');
    this.stepDraft = this.emptyStepDraft();
    this.captureStepBaseline();
    this.lastPreview = undefined;
    this.testCases = [];
    this.testCaseDraft = this.emptyTestCaseDraft();
    this.lastTestResult = undefined;
    this.testSuiteResult = undefined;
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
    this.captureStepBaseline();
    this.lastRun = undefined;
    this.lastPreview = undefined;
    this.previewThroughStepKey = '';
    this.loadRuns(flow.id);
    this.loadTestCases(flow.id);
  }

  chooseStarter(starter: FlowStarter) {
    this.selectedStarter = starter;
    this.starterServiceKeys = ['', ''];
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
        description: 'Ejecutar varios servicios y pasar los resultados de uno al siguiente',
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

  onStarterServicesChanged() {
    const selectedServices = this.starterServiceKeys
      .map((key) => this.publishedServices.find((service) => service.key === key))
      .filter((service): service is DynamicServiceItem => Boolean(service));
    const requiredKeys = new Set(selectedServices.flatMap((service) => this.serviceInputKeys(service)));
    const existing = new Map(this.flowInputs.map((field) => [field.key, field]));
    this.flowInputs = [...requiredKeys].map(
      (key) =>
        existing.get(key) ?? {
          key,
          label: this.humanizeKey(key),
          type: key.toLowerCase().includes('email') ? 'email' : 'text',
          required: true,
          example: key.toLowerCase().includes('email') ? 'persona@example.com' : ''
        }
    );
    this.syncTestInputFromFields();
  }

  addStarterService() {
    this.starterServiceKeys = [...this.starterServiceKeys, ''];
  }

  removeStarterService(index: number) {
    if (this.starterServiceKeys.length <= 2) {
      return;
    }
    this.starterServiceKeys = this.starterServiceKeys.filter((_, serviceIndex) => serviceIndex !== index);
    this.onStarterServicesChanged();
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

  testInputType(field: FlowInputField) {
    if (field.type === 'number') {
      return 'number';
    }
    if (field.type === 'email') {
      return 'email';
    }
    if (field.type === 'date') {
      return 'date';
    }
    return 'text';
  }

  setTestInputValue(field: FlowInputField, value: unknown) {
    this.testInputValues = {
      ...this.testInputValues,
      [field.key]: field.type === 'number' && value !== '' ? Number(value) : value
    };
    this.testInputText = JSON.stringify(this.testInputValues, null, 2);
  }

  syncTestValuesFromJson() {
    try {
      this.testInputValues = this.parseJson(this.testInputText);
    } catch {
      // The advanced editor reports invalid JSON when the test is executed.
    }
  }

  async createFlow() {
    if (!this.canCreateDraft) {
      this.message = 'Completa el nombre y los servicios requeridos para crear el proceso.';
      return;
    }
    this.creatingFlow = true;
    this.message = 'Creando el proceso y sus pasos iniciales...';
    let flow: FlowItem | undefined;
    try {
      flow = await firstValueFrom(this.api.post<FlowItem>('flows', this.flowPayload()));
      let updated = flow;
      for (const step of this.starterSteps()) {
        updated = await firstValueFrom(this.api.post<FlowItem>(`flows/${flow.id}/steps`, step));
      }
      this.flows = [updated, ...this.flows.filter((item) => item.id !== updated.id)];
      this.selectFlow(updated);
      this.activeStage = updated.steps.length ? 'test' : 'build';
      this.message = updated.steps.length
        ? `Proceso creado con ${updated.steps.length} pasos. Prueba el borrador y revisa cada resultado.`
        : 'Proceso vacío creado. Agrega el primer paso con el botón +.';
    } catch {
      this.message = flow
        ? 'El proceso fue creado, pero no se pudieron completar todos los pasos de la plantilla. Puedes terminarlos desde Construir.'
        : 'No se pudo crear el proceso. Revisa el identificador y los datos obligatorios.';
      if (flow) {
        this.load(flow.id);
      }
    } finally {
      this.creatingFlow = false;
    }
  }

  goToStage(stage: FlowStage) {
    if (this.activeStage === 'describe' && stage !== 'describe') {
      this.saveFlow(stage);
      return;
    }
    this.activeStage = stage;
    if (stage === 'build' && !this.stepDraft.id && this.selectedFlow?.steps.length) {
      this.selectStep(this.selectedFlow.steps[0]);
    }
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
          if (nextStage === 'build' && !this.stepDraft.id && updated.steps.length) {
            this.selectStep(updated.steps[0]);
          }
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
    this.captureStepBaseline();
  }

  startNewStepAfter(step: FlowTimelineStep | null) {
    const steps = this.selectedFlow?.steps ?? [];
    if (!step) {
      const firstPosition = steps[0]?.position ?? 10;
      this.stepDraft = this.emptyStepDraft(Math.max(0, Math.floor(firstPosition / 2)));
      this.captureStepBaseline();
      return;
    }
    const currentIndex = steps.findIndex((item) => item.id === step.id);
    const nextPosition = steps[currentIndex + 1]?.position;
    const position =
      nextPosition && nextPosition - step.position > 1
        ? Math.floor((step.position + nextPosition) / 2)
        : step.position;
    this.stepDraft = this.emptyStepDraft(position);
    this.captureStepBaseline();
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

  async duplicateTimelineStep(step: FlowTimelineStep) {
    const flow = this.selectedFlow;
    const source = flow?.steps.find((item) => item.id === step.id);
    if (!flow || !source) {
      return;
    }
    const key = this.uniqueStepKey(`${source.key}_copia`);
    const outputKey = this.uniqueOutputKey(`${source.outputKey || source.key}_copia`);
    try {
      const updated = await firstValueFrom(
        this.api.post<FlowItem>(`flows/${flow.id}/steps`, {
          key,
          name: `${source.name} copia`,
          type: source.type,
          position: source.position,
          outputKey,
          nextStepKey: source.nextStepKey ?? null,
          onTrueStepKey: source.onTrueStepKey ?? null,
          onFalseStepKey: source.onFalseStepKey ?? null,
          onErrorStepKey: source.onErrorStepKey ?? null,
          onTimeoutStepKey: source.onTimeoutStepKey ?? null,
          config: source.config ?? {},
          inputMap: source.inputMap ?? {}
        })
      );
      this.replaceFlow(updated);
      const copy = updated.steps.find((item) => item.key === key);
      if (copy) {
        this.selectStep(copy);
      }
      this.message = 'Paso duplicado. Revisa sus conexiones antes de probar.';
    } catch {
      this.message = 'No se pudo duplicar el paso.';
    }
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
      onTimeoutStepKey: step.onTimeoutStepKey ?? '',
      configText: JSON.stringify(step.config ?? {}, null, 2),
      inputMapText: JSON.stringify(step.inputMap ?? {}, null, 2),
      ...this.guidedFieldsFromStep(step)
    };
    this.captureStepBaseline();
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

  saveStep(afterSave: 'stay' | 'test' | 'next' = 'stay') {
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
        const savedKey = this.stepDraft.key;
        const wasUpdate = Boolean(this.stepDraft.id);
        const createdFirstService =
          !this.stepDraft.id && this.selectedStarter === 'multi_service' && this.stepDraft.type === 'dynamic_service';
        this.replaceFlow(updated);
        const savedStep = updated.steps.find((step) => step.key === savedKey);
        if (afterSave === 'test' && savedStep) {
          this.previewThroughStepKey = savedStep.key;
          this.activeStage = 'test';
          this.previewFlow();
          return;
        }
        if (afterSave === 'next' && savedStep) {
          this.activeStage = 'build';
          this.startNewStepAfter(savedStep);
          this.message = 'Paso guardado. Configura el siguiente; ya puedes usar el resultado anterior como entrada.';
          return;
        }
        this.message = wasUpdate
          ? 'Paso actualizado.'
          : createdFirstService
            ? 'Primer servicio guardado. Usa el botón + debajo para agregar el segundo; sus entradas podrán tomar este resultado.'
            : 'Paso agregado.';
        if (savedStep) {
          this.selectStep(savedStep);
        } else {
          this.startNewStep();
        }
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

  loadTestCases(flowId = this.selectedFlowId, selectId = this.testCaseDraft.id) {
    if (!flowId) {
      this.testCases = [];
      return;
    }
    this.api.get<FlowTestCaseItem[]>(`flows/${flowId}/test-cases`).subscribe({
      next: (testCases) => {
        this.testCases = testCases;
        const selected = testCases.find((testCase) => testCase.id === selectId);
        if (selected) {
          this.selectTestCase(selected);
        }
      },
      error: () => {
        this.testCases = [];
      }
    });
  }

  startNewTestCase() {
    this.testCaseDraft = this.emptyTestCaseDraft();
    this.testCaseDraft.inputText = this.testInputText;
    this.lastTestResult = undefined;
  }

  selectTestCase(testCase: FlowTestCaseItem) {
    this.testCaseDraft = {
      id: testCase.id,
      name: testCase.name,
      target: testCase.target,
      expectedStatus: testCase.expectedStatus,
      throughStepKey: testCase.throughStepKey ?? '',
      inputText: JSON.stringify(testCase.input ?? {}, null, 2),
      expectedOutputText: testCase.expectedOutput ? JSON.stringify(testCase.expectedOutput, null, 2) : '',
      assertions: (testCase.assertions ?? []).map((assertion) => ({
        path: assertion.path,
        operator: assertion.operator,
        expectedText:
          assertion.expected === undefined
            ? ''
            : typeof assertion.expected === 'string'
              ? assertion.expected
              : JSON.stringify(assertion.expected)
      })),
      active: testCase.active
    };
    this.lastTestResult = testCase.lastResult ?? undefined;
  }

  addTestAssertion() {
    this.testCaseDraft.assertions.push({
      path: 'output.body.ok',
      operator: 'equals',
      expectedText: 'true'
    });
  }

  removeTestAssertion(index: number) {
    this.testCaseDraft.assertions.splice(index, 1);
  }

  saveTestCase() {
    const flow = this.selectedFlow;
    if (!flow || this.testCaseDraft.name.trim().length < 3) {
      this.message = 'Escribe un nombre de al menos 3 caracteres para el caso.';
      return;
    }
    let payload: Record<string, unknown>;
    try {
      payload = this.testCasePayload();
    } catch {
      this.message = 'La entrada o la salida esperada no contienen JSON válido.';
      return;
    }
    this.runningTests = true;
    const request = this.testCaseDraft.id
      ? this.api.patch<FlowTestCaseItem>(
          `flows/${flow.id}/test-cases/${this.testCaseDraft.id}`,
          payload
        )
      : this.api.post<FlowTestCaseItem>(`flows/${flow.id}/test-cases`, payload);
    request.subscribe({
      next: (testCase) => {
        this.runningTests = false;
        this.message = this.testCaseDraft.id ? 'Caso de prueba actualizado.' : 'Caso de prueba creado.';
        this.loadTestCases(flow.id, testCase.id);
      },
      error: () => {
        this.runningTests = false;
        this.message = 'No se pudo guardar el caso. Revisa rutas y valores esperados.';
      }
    });
  }

  runSelectedTestCase() {
    const flow = this.selectedFlow;
    if (!flow || !this.testCaseDraft.id) {
      return;
    }
    this.runningTests = true;
    this.lastTestResult = undefined;
    this.api
      .post<FlowTestResult>(
        `flows/${flow.id}/test-cases/${this.testCaseDraft.id}/run`,
        {}
      )
      .subscribe({
        next: (result) => {
          this.runningTests = false;
          this.lastTestResult = result;
          this.message = result.passed ? 'El caso cumplió todas las comprobaciones.' : 'El caso encontró diferencias.';
          this.loadTestCases(flow.id, this.testCaseDraft.id);
        },
        error: () => {
          this.runningTests = false;
          this.message = 'No se pudo ejecutar el caso de prueba.';
        }
      });
  }

  runTestSuite() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.runningTests = true;
    this.testSuiteResult = undefined;
    this.api.post<FlowTestSuiteResult>(`flows/${flow.id}/test-suite/run`, {}).subscribe({
      next: (result) => {
        this.runningTests = false;
        this.testSuiteResult = result;
        this.lastTestResult = result.results.find((item) => !item.passed) ?? result.results[0];
        this.message =
          result.failed === 0
            ? `Suite correcta: ${result.passed} casos pasaron.`
            : `Suite terminada: ${result.failed} de ${result.total} casos fallaron.`;
        this.loadTestCases(flow.id);
      },
      error: () => {
        this.runningTests = false;
        this.message = 'No se pudo ejecutar la suite de pruebas.';
      }
    });
  }

  deleteTestCase() {
    const flow = this.selectedFlow;
    if (!flow || !this.testCaseDraft.id) {
      return;
    }
    this.runningTests = true;
    this.api
      .delete<{ ok: true }>(`flows/${flow.id}/test-cases/${this.testCaseDraft.id}`)
      .subscribe({
        next: () => {
          this.runningTests = false;
          this.message = 'Caso de prueba eliminado.';
          this.startNewTestCase();
          this.loadTestCases(flow.id, '');
        },
        error: () => {
          this.runningTests = false;
          this.message = 'No se pudo eliminar el caso de prueba.';
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

  continueFromPreview() {
    const executedKeys = (this.lastPreview?.steps ?? []).map((step) => step.stepKey).reverse();
    const lastSavedStep = executedKeys
      .map((key) => this.selectedFlow?.steps.find((step) => step.key === key))
      .find((step): step is FlowStep => Boolean(step));
    this.activeStage = 'build';
    if (lastSavedStep) {
      this.startNewStepAfter(lastSavedStep);
      this.message = 'Resultado conservado. El siguiente paso puede elegir sus campos desde “Resultados de pasos anteriores”.';
    } else {
      this.startNewStep();
    }
  }

  editFailedPreviewStep() {
    const failedKey = this.lastPreview?.steps.find(
      (step) => step.status === 'failed' || step.status === 'timeout'
    )?.stepKey;
    const failedStep = this.selectedFlow?.steps.find((step) => step.key === failedKey);
    this.activeStage = 'build';
    if (failedStep) {
      this.selectStep(failedStep);
      this.message = `Revisa la configuración de “${failedStep.name}”.`;
    }
  }

  resetStepChanges() {
    const saved = this.selectedFlow?.steps.find((step) => step.id === this.stepDraft.id);
    if (saved) {
      this.selectStep(saved);
      this.message = 'Cambios del paso descartados.';
    }
  }

  private captureStepBaseline() {
    this.stepBaseline = this.stepDraftSnapshot();
  }

  private stepDraftSnapshot() {
    return JSON.stringify(this.stepDraft);
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
      this.testInputValues = {};
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
    this.testInputValues = input;
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

  private starterSteps(): Array<Record<string, unknown>> {
    switch (this.selectedStarter) {
      case 'validate':
        return [
          {
            key: 'validar_email',
            name: 'Validar correo',
            type: 'validation',
            position: 10,
            outputKey: 'validacion_email',
            nextStepKey: 'respuesta',
            config: {
              field: 'input.email',
              operator: 'email',
              value: null,
              message: 'Escribe un correo válido'
            },
            inputMap: {}
          },
          this.templateResponseStep(20, {
            ok: true,
            email: '{{input.email}}',
            validacion: '{{steps.validacion_email}}'
          })
        ];
      case 'calculate':
        return [
          {
            key: 'calcular_total',
            name: 'Calcular total',
            type: 'formula',
            position: 10,
            outputKey: 'total',
            nextStepKey: 'respuesta',
            config: {
              language: 'json_logic',
              rule: { '*': [{ var: 'input.subtotal' }, 1.19] },
              precision: 2
            },
            inputMap: {}
          },
          this.templateResponseStep(20, {
            ok: true,
            subtotal: '{{input.subtotal}}',
            total: '{{steps.total}}'
          })
        ];
      case 'service': {
        const service = this.publishedServices.find((item) => item.key === this.starterServiceKeys[0]);
        if (!service) {
          return [];
        }
        return [
          this.templateServiceStep(service, 10, 'ejecutar_servicio', 'resultado_servicio', 'respuesta'),
          this.templateResponseStep(20, {
            ok: '{{steps.resultado_servicio.ok}}',
            data: '{{steps.resultado_servicio.response}}'
          })
        ];
      }
      case 'multi_service': {
        const selectedServices = this.starterServiceKeys
          .map((key) => this.publishedServices.find((item) => item.key === key))
          .filter((service): service is DynamicServiceItem => Boolean(service));
        if (selectedServices.length !== this.starterServiceKeys.length || selectedServices.length < 2) {
          return [];
        }
        const serviceSteps = selectedServices.map((service, index) => {
          const previousService = selectedServices[index - 1];
          const previousOutputKey = index > 0 ? `resultado_${index}` : undefined;
          const nextStepKey = index === selectedServices.length - 1 ? 'respuesta' : `servicio_${index + 2}`;
          return this.templateServiceStep(
            service,
            (index + 1) * 10,
            `servicio_${index + 1}`,
            `resultado_${index + 1}`,
            nextStepKey,
            previousService,
            previousOutputKey
          );
        });
        const lastOutputKey = `resultado_${selectedServices.length}`;
        return [
          ...serviceSteps,
          this.templateResponseStep((selectedServices.length + 1) * 10, {
            ok: `{{steps.${lastOutputKey}.ok}}`,
            resultadoFinal: `{{steps.${lastOutputKey}.response}}`,
            resultados: '{{steps}}'
          })
        ];
      }
      case 'blank':
        return [];
    }
  }

  private templateServiceStep(
    service: DynamicServiceItem,
    position: number,
    key: string,
    outputKey: string,
    nextStepKey: string,
    previousService?: DynamicServiceItem,
    previousOutputKey?: string
  ) {
    return {
      key,
      name: service.name,
      type: 'dynamic_service',
      position,
      outputKey,
      nextStepKey,
      config: {
        serviceKey: service.key,
        timeoutMs: 8000,
        retry: { attempts: 0, backoffMs: 0 }
      },
      inputMap: this.templateServiceInputMap(service, previousService, previousOutputKey)
    };
  }

  private templateServiceInputMap(
    service: DynamicServiceItem,
    previousService?: DynamicServiceItem,
    previousOutputKey?: string
  ) {
    return this.serviceInputKeys(service).reduce<Record<string, string>>((map, key) => {
      const flowInput = this.flowInputs.find((field) => field.key === key);
      const previousDefinition = previousService?.publishedVersion?.definition;
      if (previousOutputKey && previousDefinition?.responseMap?.[key]) {
        map[key] = `{{steps.${previousOutputKey}.response.mapped.${key}}}`;
      } else if (flowInput) {
        map[key] = `{{input.${flowInput.key}}}`;
      } else if (previousOutputKey && previousDefinition?.source === 'internal_table') {
        map[key] = `{{steps.${previousOutputKey}.response.result.${key}}}`;
      } else if (previousOutputKey) {
        map[key] = `{{steps.${previousOutputKey}.response.body.${key}}}`;
      } else {
        map[key] = `{{input.${key}}}`;
      }
      return map;
    }, {});
  }

  private templateResponseStep(position: number, body: Record<string, unknown>) {
    return {
      key: 'respuesta',
      name: 'Construir respuesta',
      type: 'response',
      position,
      outputKey: 'respuesta',
      config: {
        status: 'success',
        body
      },
      inputMap: {}
    };
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
      onTimeoutStepKey: this.stepDraft.onTimeoutStepKey || null,
      config: this.parseJson(this.stepDraft.configText),
      inputMap: this.parseJson(this.stepDraft.inputMapText)
    };
  }

  private testCasePayload() {
    const expectedOutputText = this.testCaseDraft.expectedOutputText.trim();
    return {
      name: this.testCaseDraft.name.trim(),
      target: this.testCaseDraft.target,
      expectedStatus: this.testCaseDraft.expectedStatus,
      throughStepKey:
        this.testCaseDraft.target === 'draft'
          ? this.testCaseDraft.throughStepKey || null
          : null,
      input: this.parseJson(this.testCaseDraft.inputText),
      expectedOutput: expectedOutputText ? this.parseJson(expectedOutputText) : null,
      assertions: this.testCaseDraft.assertions
        .filter((assertion) => assertion.path.trim())
        .map((assertion) => ({
          path: assertion.path.trim(),
          operator: assertion.operator,
          expected:
            assertion.operator === 'exists' || assertion.operator === 'truthy'
              ? undefined
              : this.parseTestValue(assertion.expectedText)
        })),
      active: this.testCaseDraft.active
    };
  }

  private parseTestValue(value: string): unknown {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
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
      onTimeoutStepKey: '',
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

  private emptyTestCaseDraft(): FlowTestCaseDraft {
    return {
      id: '',
      name: '',
      target: 'draft',
      expectedStatus: 'success',
      throughStepKey: '',
      inputText: this.testInputText ?? '{}',
      expectedOutputText: '',
      assertions: [],
      active: true
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

  private humanizeKey(value: string) {
    const text = value.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : value;
  }

  private uniqueStepKey(base: string) {
    const existing = new Set((this.selectedFlow?.steps ?? []).map((step) => step.key));
    let key = this.slugify(base).slice(0, 112);
    let suffix = 2;
    while (existing.has(key)) {
      key = `${this.slugify(base).slice(0, 108)}_${suffix}`;
      suffix += 1;
    }
    return key;
  }

  private uniqueOutputKey(base: string) {
    const existing = new Set((this.selectedFlow?.steps ?? []).map((step) => step.outputKey || step.key));
    let key = this.slugify(base).slice(0, 112);
    let suffix = 2;
    while (existing.has(key)) {
      key = `${this.slugify(base).slice(0, 108)}_${suffix}`;
      suffix += 1;
    }
    return key;
  }
}

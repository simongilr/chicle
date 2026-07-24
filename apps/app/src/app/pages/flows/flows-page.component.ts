import { JsonPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { FlowLiveClientService, FlowLiveEvent } from '../../core/services/flow-live-client.service';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { AiAssistantService, ApplyFlowJsonAction } from '../../shared/ai-assistant-launcher/ai-assistant.service';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { CodeTextareaComponent } from '../../shared/code-textarea/code-textarea.component';
import { ContextAssistantComponent } from '../../shared/context-assistant/context-assistant.component';
import { DesignerCatalogPanelComponent } from '../../shared/designer-catalog-panel/designer-catalog-panel.component';
import { DesignerWorkspaceComponent } from '../../shared/designer-workspace/designer-workspace.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { JsonAuthoringPanelComponent } from '../../shared/json-authoring-panel/json-authoring-panel.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { ProcessStepItem, ProcessStepsComponent } from '../../shared/process-steps/process-steps.component';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';
import {
  SegmentedControlComponent,
  SegmentedControlItem
} from '../../shared/segmented-control/segmented-control.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { WorkflowGuideComponent } from '../../shared/workflow-guide/workflow-guide.component';
import { FlowDataMapperComponent, FlowDataOption, FlowMapRow } from './flow-data-mapper.component';
import { FlowGraphComponent } from './flow-graph.component';
import { FlowTimelineComponent, FlowTimelineStatus, FlowTimelineStep } from './flow-timeline.component';

type FlowStepType =
  | 'start'
  | 'dynamic_service'
  | 'parallel'
  | 'foreach'
  | 'subflow'
  | 'delay'
  | 'emit_event'
  | 'formula'
  | 'validation'
  | 'decision'
  | 'action'
  | 'response'
  | 'end';
type FlowStage = 'describe' | 'build' | 'test' | 'publish';
type FlowStarter = 'validate' | 'service' | 'multi_service' | 'calculate' | 'blank';
type StepEditorPhase = 'purpose' | 'configure' | 'data' | 'route' | 'save';
type FlowEntryMode = 'direct' | FlowTriggerType;

interface FlowGuideState {
  stepLabel: string;
  title: string;
  description: string;
  tone: 'info' | 'success' | 'warning';
  actionLabel?: string;
}

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

interface FlowTemplateItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  scope: 'system' | 'tenant';
  definition: Record<string, unknown>;
}

interface FlowVersionComparison {
  left: { id: string; version: number; status: string };
  right: { id: string; version: number; status: string };
  summary: {
    changed: boolean;
    changeCount: number;
    addedSteps: string[];
    removedSteps: string[];
    changedSteps: string[];
  };
  changes: Array<{ path: string; before?: unknown; after?: unknown }>;
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

interface FlowAuthoringResponse {
  artifactType: 'flow';
  id: string;
  key: string;
  flow: FlowItem;
  version?: FlowVersion | null;
  published: boolean;
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

interface FlowObservability {
  filters: {
    status?: string | null;
    triggerType?: string | null;
    from?: string | null;
    to?: string | null;
    sampleLimit: number;
  };
  summary: {
    total: number;
    success: number;
    failed: number;
    timeout: number;
    cancelled: number;
    successRate: number;
    averageDurationMs: number;
    p50DurationMs: number;
    p95DurationMs: number;
  };
  steps: Array<{
    stepKey: string;
    stepName: string;
    stepType: string;
    executions: number;
    failed: number;
    failureRate: number;
    averageDurationMs: number;
    p95DurationMs: number;
  }>;
  recentErrors: Array<{
    runId: string;
    status: string;
    triggerType: string;
    triggerKey?: string | null;
    durationMs?: number | null;
    error: Record<string, unknown>;
    createdAt: string;
  }>;
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

interface FlowAuthoringDocument {
  schemaVersion: 1;
  flow: FlowDraft;
  entry: {
    mode: FlowEntryMode;
    key: string;
    config: Record<string, unknown>;
  };
  inputFields: FlowInputField[];
  steps: Array<Record<string, unknown>>;
  output: {
    stepKey: string | null;
    responseTo: 'caller';
  };
}

type FlowInputType = 'text' | 'number' | 'boolean' | 'email' | 'date';

interface FlowInputField {
  key: string;
  label: string;
  type: FlowInputType;
  required: boolean;
  example: string;
}

interface ParallelBranchDraft {
  key: string;
  serviceKey: string;
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
  compensationServiceKey: string;
  parallelBranches: ParallelBranchDraft[];
  foreachItemsPath: string;
  foreachServiceKey: string;
  foreachItemInputKey: string;
  foreachConcurrency: number;
  subflowKey: string;
  delayMs: number;
  eventKey: string;
  eventPayloadText: string;
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
  latestVersion?: {
    version: number;
    status: string;
    definition: DynamicServiceDefinition;
  } | null;
  publishedVersion?: {
    version: number;
    status: string;
    definition: DynamicServiceDefinition;
  } | null;
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

type FlowTriggerType = 'manual' | 'http' | 'form_submit' | 'record_event' | 'schedule';

interface FlowTriggerItem {
  id: string;
  type: FlowTriggerType;
  key: string;
  config?: Record<string, unknown> | null;
  active: boolean;
  nextFireAt?: string | null;
  lastFiredAt?: string | null;
}

interface FlowTriggerDraft {
  id: string;
  type: FlowTriggerType;
  key: string;
  secret: string;
  intervalSeconds: number;
  inputMode: 'payload' | 'envelope';
  inputText: string;
  active: boolean;
}

interface FlowJobItem {
  id: string;
  flowId: string;
  triggerType: string;
  triggerKey?: string | null;
  status: 'queued' | 'running' | 'waiting' | 'success' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  runId?: string | null;
  error?: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-flows-page',
  standalone: true,
  imports: [
    FormsModule,
    JsonPipe,
    PageShellComponent,
    LoadingSkeletonComponent,
    ModuleHeaderComponent,
    CatalogItemComponent,
    CodeTextareaComponent,
    DesignerCatalogPanelComponent,
    ContextAssistantComponent,
    JsonAuthoringPanelComponent,
    DynamicFieldControlComponent,
    SectionHeaderComponent,
    SegmentedControlComponent,
    StatusNoticeComponent,
    UiKitButtonComponent,
    ProcessStepsComponent,
    WorkflowGuideComponent,
    DesignerWorkspaceComponent,
    FlowTimelineComponent,
    FlowGraphComponent,
    FlowDataMapperComponent
  ],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: var(--ch-color-text);
        background: var(--ch-color-background);
      }

      .page {
        display: grid;
        gap: 18px;
      }

      .eyebrow,
      .meta {
        color: var(--ch-color-muted);
        font-size: 0.86rem;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        font-size: 1.85rem;
        line-height: 1.05;
        margin: 6px 0 10px;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.15rem;
      }

      h3 {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      .panel {
        display: grid;
        gap: 16px;
        align-content: start;
        min-width: 0;
        max-width: 100%;
        background: var(--ch-color-surface);
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        padding: 18px;
        overflow-wrap: anywhere;
      }

      app-process-steps,
      app-workflow-guide {
        display: block;
      }

      .starter-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 9px;
        margin: 14px 0 18px;
      }

      .starter {
        min-height: 118px;
        text-align: left;
        display: grid;
        align-content: start;
        gap: 6px;
      }

      .starter i {
        color: var(--ch-color-primary);
        font-size: 1.15rem;
      }

      .starter.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      .authoring-grid {
        display: grid;
        gap: 16px;
        align-content: start;
        min-width: 0;
      }

      .contract-column,
      .json-column {
        display: grid;
        gap: 12px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 14px;
      }

      .contract-flow {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .contract-card {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 12px;
      }

      .contract-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
        font-size: 0.8rem;
        font-weight: 900;
      }

      .contract-copy {
        display: grid;
        gap: 4px;
      }

      .authoring-code {
        min-height: 360px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.82rem;
        line-height: 1.45;
      }

      .configuration-section {
        display: grid;
        gap: 14px;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 18px;
      }

      .configuration-section:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .configuration-title {
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
      }

      .configuration-title > span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
        font-size: 0.82rem;
        font-weight: 900;
      }

      .configuration-title div {
        display: grid;
        gap: 3px;
      }

      .section-heading {
        display: grid;
        gap: 5px;
        margin-bottom: 14px;
      }

      .callout {
        border-left: 4px solid var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
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
        border: 1px solid var(--ch-color-border);
        border-radius: 7px;
      }

      .check-item strong {
        display: block;
      }

      .check-mark {
        color: var(--ch-color-success);
        font-weight: 900;
      }

      .list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .toolbar,
      .section-head,
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

      .section-head {
        justify-content: space-between;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .builder {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 18px;
        margin-top: 14px;
      }

      .step-configuration {
        display: grid;
        gap: 16px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 16px;
      }

      .step-json {
        display: grid;
        gap: 12px;
        border-top: 1px solid var(--ch-color-border);
        padding-top: 16px;
      }

      .step-json .grid {
        align-items: stretch;
      }

      .step-json textarea {
        min-height: 190px;
      }

      .connection-summary {
        display: grid;
        gap: 8px;
        border-left: 4px solid var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        padding: 10px 12px;
      }

      .connection-summary strong {
        color: var(--ch-color-primary);
      }

      label {
        display: grid;
        gap: 5px;
        color: var(--ch-color-text);
        font-weight: 850;
        font-size: 0.9rem;
        line-height: 1.25;
      }

      input,
      select,
      textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        min-height: 38px;
        padding: 8px 10px;
        color: var(--ch-color-text);
        background: var(--ch-color-surface);
        font: inherit;
      }

      textarea {
        min-height: 132px;
        resize: vertical;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.86rem;
      }

      button {
        box-sizing: border-box;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        border-radius: 8px;
        min-height: 36px;
        padding: 8px 12px;
        font-weight: 800;
        cursor: pointer;
      }

      button.primary {
        background: var(--ch-color-primary);
        border-color: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      button.danger {
        color: var(--ch-color-danger);
        border-color: var(--ch-color-danger-border);
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
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
        text-align: left;
      }

      .step-card.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 42px;
        height: 28px;
        border-radius: 999px;
        background: var(--ch-color-surface-muted);
        color: var(--ch-color-text);
        font-size: 0.78rem;
        font-weight: 900;
      }

      .type-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
        margin: 10px 0;
      }

      .type-button {
        justify-content: flex-start;
        min-height: 58px;
        text-align: left;
      }

      .type-button.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      .guided-panel {
        display: grid;
        gap: 10px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        margin-top: 10px;
        padding: 12px;
      }

      .step-phase {
        scroll-margin-top: 18px;
      }

      .step-guide {
        margin-top: 12px;
      }

      .step-guide app-process-steps,
      .step-guide app-workflow-guide {
        margin-bottom: 10px;
      }

      .advanced-panel > summary {
        display: grid;
        gap: 4px;
        cursor: pointer;
        font-weight: 900;
      }

      .advanced-panel[open] > summary {
        margin-bottom: 12px;
      }

      .trash-state {
        min-height: 260px;
        align-content: center;
        justify-items: start;
      }

      .step-editor {
        display: grid;
        gap: 16px;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid var(--ch-color-border);
      }

      .capability-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .capability-group {
        display: grid;
        align-content: start;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 12px;
      }

      .capability-group.supported {
        border-top: 3px solid var(--ch-color-success);
      }

      .capability-group.delegated {
        border-top: 3px solid var(--ch-color-primary);
      }

      .capability-group.pending {
        border-top: 3px solid var(--ch-color-warning);
      }

      .capability-item {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        gap: 7px;
        align-items: start;
        color: var(--ch-color-muted);
        font-size: 0.84rem;
        line-height: 1.4;
      }

      .capability-item i {
        margin-top: 2px;
        color: var(--ch-color-primary);
      }

      .map-row {
        display: grid;
        grid-template-columns: minmax(120px, 0.7fr) minmax(160px, 1fr) auto;
        gap: 8px;
        align-items: end;
      }

      .branch-row {
        display: grid;
        grid-template-columns: minmax(120px, 0.7fr) minmax(220px, 1.3fr) auto;
        gap: 8px;
        align-items: end;
      }

      .branch-list {
        display: grid;
        gap: 8px;
      }

      .input-field-row {
        display: grid;
        grid-template-columns:
          minmax(120px, 0.8fr) minmax(150px, 1.1fr)
          120px minmax(130px, 0.9fr) auto auto;
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
        border: 1px solid var(--ch-color-warning-border);
        border-radius: 7px;
        background: var(--ch-color-surface)8ef;
        color: var(--ch-color-warning);
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
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: color-mix(in srgb, var(--ch-color-surface) 97%, transparent);
        box-shadow: 0 8px 24px color-mix(in srgb, var(--ch-color-text) 14%, transparent);
      }

      .assistant-actions .meta {
        margin-right: auto;
      }

      .hint {
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
        padding: 9px 10px;
        line-height: 1.45;
      }

      .mini-title {
        color: var(--ch-color-text);
        font-size: 0.9rem;
        font-weight: 900;
      }

      .run-card {
        display: grid;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .test-studio {
        display: grid;
        grid-template-columns: minmax(220px, 0.72fr) minmax(340px, 1.28fr);
        gap: 14px;
        margin-top: 14px;
      }

      .test-suite-panel {
        margin-top: 18px;
        border-top: 1px solid var(--ch-color-border);
        padding-top: 14px;
      }

      .test-suite-panel > summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        cursor: pointer;
        list-style: none;
      }

      .test-suite-panel > summary::-webkit-details-marker {
        display: none;
      }

      .test-suite-panel > summary > span:first-child {
        display: grid;
        gap: 3px;
      }

      .test-suite-panel > summary small {
        color: var(--ch-color-muted);
        font-size: 0.8rem;
        font-weight: 500;
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
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      .test-result-bar {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .test-result-bar > div {
        display: grid;
        gap: 2px;
        border: 1px solid var(--ch-color-border);
        border-radius: 7px;
        padding: 9px;
        background: var(--ch-color-surface);
      }

      .assertion-row {
        display: grid;
        grid-template-columns:
          minmax(150px, 1.2fr) minmax(130px, 0.8fr) minmax(140px, 1fr)
          auto;
        gap: 8px;
        align-items: end;
      }

      .runtime-grid {
        display: grid;
        grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
        gap: 14px;
        margin-top: 18px;
      }

      .operations-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 16px;
      }

      .operation-panel {
        display: grid;
        gap: 12px;
        align-content: start;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 14px;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }

      .metric {
        display: grid;
        gap: 3px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: 7px;
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .metric strong {
        font-size: 1.2rem;
      }

      .version-list {
        display: grid;
        gap: 8px;
        max-height: 320px;
        overflow: auto;
      }

      .version-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        border: 1px solid var(--ch-color-border);
        border-radius: 7px;
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .version-item .row {
        justify-content: flex-end;
      }

      .runtime-list {
        display: grid;
        gap: 8px;
      }

      .runtime-item {
        display: grid;
        gap: 6px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .runtime-item.selected {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      .runtime-state {
        display: inline-flex;
        gap: 6px;
        align-items: center;
        font-size: 0.82rem;
        font-weight: 800;
      }

      .runtime-state::before {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ch-color-muted);
        content: '';
      }

      .runtime-state.connected::before,
      .runtime-state.success::before {
        background: var(--ch-color-success);
      }

      .runtime-state.running::before,
      .runtime-state.queued::before {
        background: var(--ch-color-warning);
      }

      .runtime-state.failed::before,
      .runtime-state.cancelled::before {
        background: var(--ch-color-danger);
      }

      .code-line {
        overflow-wrap: anywhere;
        border: 1px solid var(--ch-color-border);
        border-radius: 7px;
        background: var(--ch-color-surface-alt);
        padding: 8px 10px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.8rem;
      }

      .status-success {
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
      }

      .status-failed,
      .status-timeout {
        background: var(--ch-color-surface)0f0;
        color: var(--ch-color-danger);
      }

      .step-run {
        display: grid;
        gap: 4px;
        border-left: 3px solid var(--ch-color-border);
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
        border: 1px solid var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
        border-radius: 8px;
        padding: 10px 12px;
      }

      @media (max-width: 1120px) {
        .builder,
        .test-studio,
        .runtime-grid,
        .operations-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 900px) {
        .grid,
        .map-row,
        .branch-row,
        .input-field-row,
        .test-result-bar,
        .metric-grid,
        .assertion-row,
        .contract-flow,
        .capability-grid {
          grid-template-columns: 1fr;
        }

        h1 {
          font-size: 1.8rem;
        }
      }

      @media (max-width: 760px) {
        .starter-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

      }

      @media (max-width: 520px) {
        .starter-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Flow Designer">
      <div class="page">
      <app-module-header
        eyebrow="Procesos de la organización"
        title="Flows dinámicos"
        description="Crea un proceso paso a paso, pruébalo con datos de ejemplo y publícalo cuando el resultado sea correcto."
        badge="Flow Engine"
      ></app-module-header>

      @if (loading) {
        <app-loading-skeleton
          variant="page"
          label="Cargando Flow Designer"
        ></app-loading-skeleton>
      } @else if (message) {
        <app-status-notice tone="info">{{ message }}</app-status-notice>
      }

      @if (!viewingTrash) {
        <app-process-steps
          [items]="flowProcessSteps"
          [activeKey]="activeStage"
          (selected)="goToStage($event)"
        ></app-process-steps>

        <app-workflow-guide
          [stepLabel]="currentGuide.stepLabel"
          [title]="currentGuide.title"
          [description]="currentGuide.description"
          [tone]="currentGuide.tone"
        >
          @if (selectedFlow && currentGuide.actionLabel) {
            <app-ui-kit-button
              [label]="currentGuide.actionLabel"
              icon="pi pi-arrow-right"
              variant="outline"
              (pressed)="runGuideAction()"
            ></app-ui-kit-button>
          }
        </app-workflow-guide>
      }

      <app-designer-workspace>
        <ng-container designer-navigation>
          <app-designer-catalog-panel
            [title]="viewingTrash ? 'Papelera' : 'Flows'"
            [summary]="flows.length + (flows.length === 1 ? ' proceso' : ' procesos')"
            [loading]="loading"
            loadingLabel="Cargando flows"
            [loadingRows]="4"
            [empty]="!flows.length"
            [emptyTitle]="viewingTrash ? 'Papelera vacía' : 'Sin flows todavía'"
            [emptyMessage]="
              viewingTrash
                ? 'Los procesos eliminados aparecerán aquí y podrán restaurarse.'
                : 'Pulsa Nuevo. El asistente te ayudará a crear el primer proceso.'
            "
            [showRetry]="false"
          >
            @for (flow of flows; track flow.id) {
              <app-catalog-item
                [title]="flow.name"
                [meta]="flow.key + ' · ' + (viewingTrash ? 'en papelera' : flow.status)"
                [detail]="
                  flow.steps.length +
                  ' pasos · publicada: ' +
                  (flow.publishedVersion ? 'v' + flow.publishedVersion.version : 'sin publicar')
                "
                [active]="flow.id === selectedFlowId"
                (selected)="selectFlow(flow)"
              ></app-catalog-item>
            }
            <app-ui-kit-button
              catalog-actions
              [label]="viewingTrash ? 'Activos' : 'Papelera'"
              variant="outline"
              (pressed)="toggleTrash()"
            ></app-ui-kit-button>
            @if (!viewingTrash) {
              <app-ui-kit-button
                catalog-actions
                label="Nuevo"
                [disabled]="!canCreate"
                (pressed)="startNewFlow()"
              ></app-ui-kit-button>
            }
          </app-designer-catalog-panel>
        </ng-container>

        <ng-container designer-workspace>
          @if (viewingTrash) {
            <section class="panel trash-state">
              @if (selectedFlow) {
                <span class="badge">En papelera</span>
                <h2>{{ selectedFlow.name }}</h2>
                <p class="meta">
                  {{ selectedFlow.key }} · {{ selectedFlow.steps.length }} pasos. Restáuralo para volver a editar,
                  probar o publicar.
                </p>
                <app-ui-kit-button
                  label="Restaurar flow"
                  [disabled]="!canUpdate"
                  (pressed)="restoreFlow()"
                ></app-ui-kit-button>
              } @else {
                <h2>Selecciona un flow eliminado</h2>
                <p class="meta">Desde aquí puedes revisar y restaurar procesos sin mezclarlos con los activos.</p>
              }
            </section>
          } @else {
            <section class="panel">
              <app-section-header
                [title]="selectedFlow ? selectedFlow.name : 'Crea tu primer proceso'"
                [description]="
                  selectedFlow
                    ? 'Avanza por las cuatro etapas sin perder el contexto.'
                    : 'Primero dinos qué quieres lograr. Los datos técnicos se generan solos.'
                "
                [stepLabel]="selectedFlow ? 'Flow seleccionado' : 'Nuevo flow'"
              >
                @if (selectedFlow) {
                  <app-ui-kit-button
                    label="Enviar a papelera"
                    tone="danger"
                    variant="outline"
                    [disabled]="!canUpdate"
                    (pressed)="trashFlow()"
                  ></app-ui-kit-button>
                }
              </app-section-header>

              @if (!selectedFlow || activeStage === 'describe') {
                <section class="configuration-section">
                  <div class="configuration-title">
                    <span>1</span>
                    <div>
                      <h3>
                        {{ selectedFlow ? 'Propósito del proceso' : '¿Qué quieres automatizar?' }}
                      </h3>
                      <p class="meta">
                        {{
                          selectedFlow
                            ? 'Estos datos ayudan a encontrar y entender el proceso.'
                            : 'Elige el punto de partida más parecido. Después podrás cambiar cada paso.'
                        }}
                      </p>
                    </div>
                  </div>
                  <app-context-assistant
                    [title]="
                      flowPurposeReady ? 'El propósito ya se entiende' : 'Describe el resultado, no la tecnología'
                    "
                    [description]="
                      flowPurposeReady
                        ? 'Nombre, resultado esperado e identificador están completos.'
                        : 'Escribe qué debe conseguir el proceso con palabras que entienda una persona del negocio.'
                    "
                    example="Validar una solicitud y devolver si puede aprobarse."
                    [nextAction]="
                      flowPurposeReady
                        ? 'Define quién inicia el proceso.'
                        : 'Completa nombre, resultado e identificador.'
                    "
                    [stateLabel]="flowPurposeReady ? 'Listo' : 'Por completar'"
                    [tone]="flowPurposeReady ? 'success' : 'warning'"
                    [icon]="flowPurposeReady ? 'pi pi-check' : 'pi pi-lightbulb'"
                  ></app-context-assistant>

                  @if (!selectedFlow) {
                    @if (flowTemplates.length) {
                      <div class="guided-panel">
                        <div>
                          <div class="mini-title">Comenzar desde una plantilla reutilizable</div>
                          <p class="meta">
                            Las plantillas del sistema y de tu organización crean un borrador completo que luego puedes
                            modificar.
                          </p>
                        </div>
                        <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('selectedTemplateId', 'select', 'Plantilla', '', templateOptions)"
                            [value]="selectedTemplateId"
                            (valueChange)="selectedTemplateId = controlString($event); onTemplateSelected()"
                          ></app-dynamic-field-control>
                          @if (selectedTemplate) {
                            <div class="hint">
                              <strong>{{ selectedTemplate.name }}</strong
                              ><br />
                              {{ selectedTemplate.description || 'Plantilla reutilizable de flow.' }}
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <div class="starter-grid">
                      @for (starter of starters; track starter.key) {
                        <article
                          class="starter"
                          role="button"
                          tabindex="0"
                          [class.active]="selectedStarter === starter.key"
                          (click)="chooseStarter(starter.key)"
                          (keydown.enter)="chooseStarter(starter.key)"
                          (keydown.space)="chooseStarter(starter.key)"
                        >
                          <i [class]="starter.icon" aria-hidden="true"></i>
                          <strong>{{ starter.label }}</strong>
                          <span class="meta">{{ starter.summary }}</span>
                        </article>
                      }
                    </div>

                    @if (selectedStarter === 'service' || selectedStarter === 'multi_service') {
                      <div class="guided-panel">
                        <div>
                          <div class="mini-title">
                            {{
                              selectedStarter === 'multi_service'
                                ? 'Elige todos los servicios en el orden de ejecución'
                                : 'Elige el servicio principal'
                            }}
                          </div>
                          <p class="meta">Solo aparecen servicios activos con una versión publicada.</p>
                        </div>
                        @if (selectedStarter === 'multi_service') {
                          @for (serviceKey of starterServiceKeys; track $index) {
                            <div class="map-row">
                              <app-dynamic-field-control
                                [field]="runtimeField('starterService' + $index, 'select', 'Servicio ' + ($index + 1), '', publishedServiceOptions)"
                                [value]="starterServiceKeys[$index]"
                                (valueChange)="starterServiceKeys[$index] = controlString($event); onStarterServicesChanged()"
                              ></app-dynamic-field-control>
                              <span class="meta">Se ejecuta después del servicio {{ $index || 'de entrada' }}.</span>
                              <app-ui-kit-button
                                label="Quitar"
                                icon="pi pi-trash"
                                tone="danger"
                                variant="outline"
                                [disabled]="starterServiceKeys.length <= 2"
                                (pressed)="removeStarterService($index)"
                              ></app-ui-kit-button>
                            </div>
                          }
                          <app-ui-kit-button
                            label="Agregar otro servicio"
                            icon="pi pi-plus"
                            variant="outline"
                            (pressed)="addStarterService()"
                          ></app-ui-kit-button>
                        } @else {
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('starterService0', 'select', 'Servicio', '', publishedServiceOptions)"
                              [value]="starterServiceKeys[0]"
                              (valueChange)="starterServiceKeys[0] = controlString($event); onStarterServicesChanged()"
                            ></app-dynamic-field-control>
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
                    <app-dynamic-field-control
                      [field]="runtimeField('flowName', 'text', 'Nombre del proceso', 'Validar una solicitud')"
                      [value]="flowDraft.name"
                      (valueChange)="setObjectString(flowDraft, 'name', $event); onFlowIdentityChanged(true)"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('flowDescription', 'text', '¿Qué resultado esperas?', 'Aceptar solicitudes con datos completos')"
                      [value]="flowDraft.description"
                      (valueChange)="setObjectString(flowDraft, 'description', $event); onFlowIdentityChanged()"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('flowCategory', 'select', 'Categoría', '', flowCategoryOptions)"
                      [value]="flowDraft.category"
                      (valueChange)="setObjectString(flowDraft, 'category', $event); onFlowIdentityChanged()"
                    ></app-dynamic-field-control>
                    <app-dynamic-field-control
                      [field]="runtimeField('flowKey', 'text', 'Identificador técnico', 'validar_solicitud')"
                      [value]="flowDraft.key"
                      [disabled]="!!selectedFlow"
                      (valueChange)="setObjectString(flowDraft, 'key', $event); onFlowIdentityChanged()"
                    ></app-dynamic-field-control>
                  </div>
                </section>

                <section class="configuration-section">
                  <div class="configuration-title">
                    <span>2</span>
                    <div>
                      <h3>¿Qué inicia el proceso?</h3>
                      <p class="meta">La entrada entrega los datos; el primer servicio se ejecuta después.</p>
                    </div>
                  </div>
                  <app-context-assistant
                    [title]="flowEntryReady ? 'La entrada está definida' : 'Falta identificar el activador'"
                    [description]="selectedEntrySummary"
                    example="Llamada directa para un botón del front; Evento para reaccionar a un registro creado."
                    [nextAction]="
                      flowEntryReady
                        ? 'Define los datos que recibirá esta entrada.'
                        : 'Escribe una clave estable para reconocer el activador.'
                    "
                    [stateLabel]="flowEntryReady ? 'Listo' : 'Requiere clave'"
                    [tone]="flowEntryReady ? 'success' : 'warning'"
                    [icon]="flowEntryReady ? 'pi pi-check' : 'pi pi-bolt'"
                  ></app-context-assistant>
                  <div class="grid">
                    <app-dynamic-field-control
                      [field]="runtimeField('entryMode', 'select', 'Canal de entrada', '', entryModeSelectOptions)"
                      [value]="entryMode"
                      (valueChange)="entryMode = controlString($event) === '' ? 'direct' : toFlowEntryMode($event); onEntryModeChanged()"
                    ></app-dynamic-field-control>
                    @if (entryMode !== 'direct') {
                      <app-dynamic-field-control
                        [field]="runtimeField('entryKey', 'text', 'Clave del activador', 'record.created')"
                        [value]="entryKey"
                        (valueChange)="entryKey = controlString($event); refreshAuthoringDefinition()"
                      ></app-dynamic-field-control>
                    }
                  </div>
                  <div class="hint">
                    <strong>{{ selectedEntrySummary }}</strong
                    ><br />
                    @if (entryMode === 'direct') {
                      La pantalla espera la respuesta de
                      <code>POST /api/flows/by-key/{{ flowDraft.key || 'flow_key' }}/execute</code>.
                    } @else {
                      Se configura y activa después de publicar desde Activadores.
                      {{ entryMode === 'http' ? 'El secreto se guarda protegido y nunca aparece en el JSON.' : '' }}
                    }
                  </div>
                </section>

                <section class="configuration-section">
                  <div class="toolbar">
                    <div class="configuration-title">
                      <span>3</span>
                      <div>
                        <h3>¿Qué datos recibe?</h3>
                        <p class="meta">Aparecerán como opciones al conectar servicios, reglas y respuestas.</p>
                      </div>
                    </div>
                    <app-ui-kit-button
                      label="Agregar dato"
                      icon="pi pi-plus"
                      variant="outline"
                      (pressed)="addFlowInput()"
                    ></app-ui-kit-button>
                  </div>
                  <app-context-assistant
                    title="Define solo los datos que llegan desde afuera"
                    [description]="
                      flowInputs.length
                        ? 'Estos nombres estarán disponibles en validaciones, servicios, fórmulas y respuestas.'
                        : 'Puedes continuar sin entradas cuando el proceso use únicamente tenant, usuario o valores fijos.'
                    "
                    example="email, total, fecha_evento o id_cliente."
                    [nextAction]="
                      flowInputsReady
                        ? 'Revisa el recorrido que se generará.'
                        : 'Corrige identificadores repetidos o que no estén en snake_case.'
                    "
                    [stateLabel]="
                      flowInputs.length ? (flowInputsReady ? 'Datos válidos' : 'Revisar datos') : 'Opcional'
                    "
                    [tone]="flowInputsReady ? 'success' : 'warning'"
                    [icon]="flowInputsReady ? 'pi pi-check' : 'pi pi-info-circle'"
                  ></app-context-assistant>
                  @for (field of flowInputs; track $index) {
                    <div class="input-field-row">
                      <app-dynamic-field-control
                        [field]="runtimeField('inputKey' + $index, 'text', 'Identificador', 'email')"
                        [value]="field.key"
                        (valueChange)="setObjectString(field, 'key', $event); onFlowInputsChanged()"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('inputLabel' + $index, 'text', 'Nombre visible', 'Correo')"
                        [value]="field.label"
                        (valueChange)="setObjectString(field, 'label', $event); onFlowInputsChanged()"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('inputType' + $index, 'select', 'Tipo', '', flowInputTypeOptions)"
                        [value]="field.type"
                        (valueChange)="setObjectString(field, 'type', $event); onFlowInputsChanged()"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('inputExample' + $index, 'text', 'Ejemplo', 'persona@example.com')"
                        [value]="field.example"
                        (valueChange)="setObjectString(field, 'example', $event); onFlowInputsChanged()"
                      ></app-dynamic-field-control>
                      <app-dynamic-field-control
                        [field]="runtimeField('inputRequired' + $index, 'checkbox', 'Obligatorio', 'Dato obligatorio')"
                        [value]="field.required"
                        (valueChange)="setObjectBoolean(field, 'required', $event); onFlowInputsChanged()"
                      ></app-dynamic-field-control>
                      <app-ui-kit-button
                        label="Quitar"
                        icon="pi pi-trash"
                        tone="danger"
                        variant="outline"
                        (pressed)="removeFlowInput($index)"
                      ></app-ui-kit-button>
                    </div>
                  } @empty {
                    <div class="hint">
                      Sin datos definidos. Puedes agregarlos ahora o escribirlos manualmente durante las pruebas.
                    </div>
                  }
                </section>

                <section class="configuration-section">
                  <div class="configuration-title">
                    <span>4</span>
                    <div>
                      <h3>Revisa el recorrido completo</h3>
                      <p class="meta">Esta es la lectura sencilla de lo que quedará guardado en el JSON.</p>
                    </div>
                  </div>
                  <app-context-assistant
                    title="Comprueba la historia completa de izquierda a derecha"
                    description="Alguien inicia el flow, los pasos transforman los datos y Response entrega el resultado."
                    example="Botón Guardar → validar → consultar servicio → responder al formulario."
                    nextAction="Revisa el JSON generado y crea o guarda el proceso."
                    stateLabel="Revisión final"
                    tone="info"
                    icon="pi pi-share-alt"
                  ></app-context-assistant>
                  <div class="contract-flow">
                    <div class="contract-card">
                      <span class="contract-number">1</span>
                      <div class="contract-copy">
                        <strong>Entrada</strong>
                        <span class="meta">{{ selectedEntrySummary }}</span>
                      </div>
                    </div>
                    <div class="contract-card">
                      <span class="contract-number">2</span>
                      <div class="contract-copy">
                        <strong>Proceso</strong>
                        <span class="meta">
                          {{ selectedFlow?.steps?.length || starterStepCount }}
                          pasos procesan, validan o deciden.
                        </span>
                      </div>
                    </div>
                    <div class="contract-card">
                      <span class="contract-number">3</span>
                      <div class="contract-copy">
                        <strong>Respuesta</strong>
                        <span class="meta">
                          El paso de respuesta entrega el resultado a la pantalla o sistema que inició el flow.
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="json-column">
                  <app-json-authoring-panel
                    artifactLabel="Flow"
                    title="JSON editable del flow"
                    description="Puedes construir el flow solo desde este JSON. Aplicar sincroniza la guía; guardar draft y publicar usan el endpoint estándar para asistentes."
                    stepLabel="Authoring JSON"
                    endpoint="/api/flows/authoring/json"
                    [value]="authoringDefinitionText"
                    [error]="authoringDefinitionError || authoringJsonValidationError"
                    [ready]="authoringJsonReady"
                    [isBusy]="applyingDefinition || creatingFlow"
                    [draftDisabled]="!canCreate && !canUpdate"
                    [publishDisabled]="!canPublish"
                    (valueChange)="authoringDefinitionText = $event; authoringDefinitionError = ''"
                    (resetJson)="refreshAuthoringDefinition()"
                    (applyJson)="applyAuthoringDefinition(!!selectedFlow)"
                    (saveDraft)="saveFlowJsonOnly(false)"
                    (saveAndPublish)="saveFlowJsonOnly(true)"
                  >
                    <app-context-assistant
                      [title]="authoringJsonReady ? 'Listo para guardar' : 'Necesita corrección'"
                      [description]="
                        authoringJsonReady
                          ? 'Este mismo JSON puede crear, actualizar, versionar y publicar el flow.'
                          : 'Corrige estructura, claves o rutas antes de guardar.'
                      "
                      example="Edita flow, entry, inputFields, steps u output. El backend validará todo el contrato."
                      [nextAction]="authoringJsonReady ? 'Guarda draft o publica desde el JSON.' : 'Corrige el error indicado.'"
                      [stateLabel]="authoringJsonReady ? 'Contrato listo' : 'Contrato pendiente'"
                      [tone]="authoringJsonReady ? 'success' : 'warning'"
                      [icon]="authoringJsonReady ? 'pi pi-check' : 'pi pi-code'"
                    ></app-context-assistant>
                  </app-json-authoring-panel>
                </section>

                <details class="guided-panel">
                  <summary>
                    <strong>Qué puede construir este motor</strong>
                  </summary>
                  <p class="meta">
                    El Flow coordina lógica y servicios. Las conexiones técnicas específicas se resuelven en Servicios.
                  </p>
                  <div class="capability-grid">
                    @for (group of capabilityGroups; track group.title) {
                      <section
                        class="capability-group"
                        [class.supported]="group.tone === 'supported'"
                        [class.delegated]="group.tone === 'delegated'"
                        [class.pending]="group.tone === 'pending'"
                      >
                        <h3>{{ group.title }}</h3>
                        @for (item of group.items; track item) {
                          <div class="capability-item">
                            <i [class]="group.icon" aria-hidden="true"></i>
                            <span>{{ item }}</span>
                          </div>
                        }
                      </section>
                    }
                  </div>
                </details>

                <div class="row" style="margin-top: 14px;">
                  @if (selectedFlow) {
                    <app-ui-kit-button
                      label="Guardar cambios"
                      [disabled]="!canUpdate"
                      (pressed)="saveFlow()"
                    ></app-ui-kit-button>
                    <app-ui-kit-button
                      label="Guardar y continuar"
                      variant="outline"
                      (pressed)="saveFlow('build')"
                    ></app-ui-kit-button>
                  } @else {
                    <app-ui-kit-button
                      [label]="
                        creatingFlow
                          ? 'Creando proceso...'
                          : selectedTemplateId
                            ? 'Crear desde plantilla'
                            : 'Crear proceso completo'
                      "
                      [disabled]="!canCreate || !canCreateDraft || creatingFlow"
                      (pressed)="selectedTemplateId ? createFromTemplate() : createFlow()"
                    ></app-ui-kit-button>
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
                    El borrador está completo para probar. Usa “Probar hasta aquí” en cualquier paso o continúa a
                    Pruebas.
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
                        <app-segmented-control
                          [items]="buildViewOptions"
                          [value]="buildView"
                          (valueChange)="setBuildView($event)"
                          ariaLabel="Vista del recorrido"
                        ></app-segmented-control>
                        <app-ui-kit-button
                          label="Agregar paso"
                          icon="pi pi-plus"
                          variant="outline"
                          (pressed)="startNewStep()"
                        ></app-ui-kit-button>
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
                      <app-section-header
                        [title]="stepDraft.id ? 'Configurar: ' + stepDraft.name : 'Agregar un paso'"
                        description="Completa la operación de arriba hacia abajo. El JSON resultante aparece al final."
                        [stepLabel]="stepDraft.id ? 'Paso seleccionado' : 'Nuevo paso'"
                      ></app-section-header>
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
                      <section class="step-configuration">
                      <div class="configuration-title step-phase" id="flow-step-purpose">
                        <span>1</span>
                        <div>
                          <div class="mini-title">
                            {{ stepDraft.id ? 'Edita este paso' : '¿Qué debe ocurrir ahora?' }}
                          </div>
                          <p class="meta">
                            Elige el bloque por su propósito. Solo aparecerán los datos necesarios para configurarlo.
                          </p>
                        </div>
                      </div>
                      <app-context-assistant
                          [title]="
                            stepPurposeReady ? 'El paso se reconoce claramente' : 'Dale una intención a este bloque'
                          "
                        [description]="
                          stepPurposeReady
                            ? 'El tipo, el nombre visible y el identificador están listos.'
                            : 'Primero elige qué debe ocurrir; después el diseñador mostrará únicamente sus opciones.'
                        "
                        example="Validar correo, Consultar cliente o Construir respuesta."
                          [nextAction]="
                            stepPurposeReady ? 'Configura la operación.' : 'Elige un tipo y escribe un nombre claro.'
                          "
                        [stateLabel]="stepPurposeReady ? 'Listo' : 'Por completar'"
                        [tone]="stepPurposeReady ? 'success' : 'warning'"
                        [icon]="stepPurposeReady ? 'pi pi-check' : 'pi pi-lightbulb'"
                      ></app-context-assistant>
                      <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('stepType', 'select', 'Tipo de paso', '', stepTypeOptions)"
                            [value]="stepDraft.type"
                            (valueChange)="setStepTypeFromControl($event)"
                          ></app-dynamic-field-control>
                          <div class="hint">
                            <strong>{{ stepTypeLabel(stepDraft.type) }}</strong
                            ><br />
                            {{ stepTypeSummary(stepDraft.type) }}
                          </div>
                        </div>

                      <div class="grid">
                        <app-dynamic-field-control
                          [field]="runtimeField('stepName', 'text', 'Nombre visible', 'Validar correo')"
                          [value]="stepDraft.name"
                          (valueChange)="setObjectString(stepDraft, 'name', $event); syncStepKey()"
                        ></app-dynamic-field-control>
                        <app-dynamic-field-control
                          [field]="runtimeField('stepOutputKey', 'text', 'Guardar resultado como', 'validacion_correo')"
                          [value]="stepDraft.outputKey"
                          (valueChange)="setObjectString(stepDraft, 'outputKey', $event)"
                        ></app-dynamic-field-control>
                      </div>

                      <div class="configuration-title step-phase" id="flow-step-configure">
                        <span>2</span>
                        <div>
                          <div class="mini-title">Configura la operación</div>
                            <p class="meta">
                              {{ stepTypeSummary(stepDraft.type) }}
                            </p>
                        </div>
                      </div>
                      <app-context-assistant
                        [title]="stepConfigurationReady ? 'La operación tiene lo necesario' : 'Completa la operación'"
                        [description]="
                          stepConfigurationReady
                            ? stepTypeSummary(stepDraft.type)
                            : stepDraftIssues[0] || 'Los campos obligatorios dependen del tipo de paso seleccionado.'
                        "
                        [example]="stepConfigurationExample"
                        [nextAction]="
                          stepConfigurationReady
                              ? stepUsesDataMap
                                ? 'Conecta los datos que necesita.'
                                : 'Define qué ocurre al terminar.'
                            : 'Completa los campos marcados en este recuadro.'
                        "
                        [stateLabel]="stepConfigurationReady ? 'Operación lista' : 'Faltan datos'"
                        [tone]="stepConfigurationReady ? 'success' : 'warning'"
                        [icon]="stepConfigurationReady ? 'pi pi-check' : 'pi pi-cog'"
                      ></app-context-assistant>
                      <div class="guided-panel">
                        @if (stepDraft.type === 'dynamic_service') {
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('stepServiceKey', 'select', 'Servicio publicado', '', publishedServiceOptions)"
                              [value]="stepDraft.serviceKey"
                              (valueChange)="setObjectString(stepDraft, 'serviceKey', $event); onServiceSelected()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('stepTimeoutMs', 'number', 'Timeout ms', '8000')"
                              [value]="stepDraft.timeoutMs"
                              (valueChange)="setObjectNumber(stepDraft, 'timeoutMs', $event, 8000); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('stepRetryAttempts', 'number', 'Reintentos', '0')"
                              [value]="stepDraft.retryAttempts"
                              (valueChange)="setObjectNumber(stepDraft, 'retryAttempts', $event, 0); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('stepRetryBackoffMs', 'number', 'Backoff ms', '0')"
                              [value]="stepDraft.retryBackoffMs"
                              (valueChange)="setObjectNumber(stepDraft, 'retryBackoffMs', $event, 0); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('stepCompensationServiceKey', 'select', 'Si luego falla, compensar con', '', compensationServiceOptions)"
                              [value]="stepDraft.compensationServiceKey"
                              (valueChange)="setObjectString(stepDraft, 'compensationServiceKey', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                          </div>
                          @if (selectedService; as service) {
                            <div class="hint">
                              <strong>{{ service.name }}</strong
                              ><br />
                              Necesita:
                              {{
                                selectedServiceInputKeys.length
                                  ? selectedServiceInputKeys.join(', ')
                                  : 'ningún dato obligatorio detectado'
                              }}.<br />
                              Devuelve: {{ serviceResultLabel(service) }}.
                            </div>
                          } @else {
                            <div class="hint">
                              Selecciona un servicio para ver qué datos necesita y qué resultado entrega.
                            </div>
                          }
                        } @else if (stepDraft.type === 'parallel') {
                          <div class="section-heading">
                            <div class="mini-title">Ejecuta varios servicios al mismo tiempo</div>
                            <p class="meta">
                              El paso espera todas las respuestas. Continúa solo si todas terminan correctamente.
                            </p>
                          </div>
                          <div class="branch-list">
                            @for (branch of stepDraft.parallelBranches; track $index; let index = $index) {
                              <div class="branch-row">
                                <app-dynamic-field-control
                                  [field]="runtimeField('parallelBranchKey' + index, 'text', 'Nombre de la rama', 'consulta_' + (index + 1))"
                                  [value]="branch.key"
                                  (valueChange)="setObjectString(branch, 'key', $event); syncGuidedStepJson()"
                                ></app-dynamic-field-control>
                                <app-dynamic-field-control
                                  [field]="runtimeField('parallelBranchService' + index, 'select', 'Servicio publicado', '', publishedServiceOptions)"
                                  [value]="branch.serviceKey"
                                  (valueChange)="setObjectString(branch, 'serviceKey', $event); syncGuidedStepJson()"
                                ></app-dynamic-field-control>
                                <app-ui-kit-button
                                  label="Quitar"
                                  icon="pi pi-trash"
                                  tone="danger"
                                  variant="outline"
                                  [disabled]="stepDraft.parallelBranches.length <= 2"
                                  (pressed)="removeParallelBranch(index)"
                                ></app-ui-kit-button>
                              </div>
                            }
                          </div>
                          <app-ui-kit-button
                            label="Agregar servicio paralelo"
                            icon="pi pi-plus"
                            variant="outline"
                            (pressed)="addParallelBranch()"
                          ></app-ui-kit-button>
                        } @else if (stepDraft.type === 'foreach') {
                          <div class="section-heading">
                            <div class="mini-title">Repite un servicio por cada elemento</div>
                            <p class="meta">
                              Indica dónde está la lista. Cada elemento se entrega al servicio sin mantener conexiones
                              abiertas.
                            </p>
                          </div>
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('foreachItemsPath', 'text', 'Ruta de la lista', 'input.items')"
                              [value]="stepDraft.foreachItemsPath"
                              (valueChange)="setObjectString(stepDraft, 'foreachItemsPath', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('foreachServiceKey', 'select', 'Servicio publicado', '', publishedServiceOptions)"
                              [value]="stepDraft.foreachServiceKey"
                              (valueChange)="setObjectString(stepDraft, 'foreachServiceKey', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('foreachItemInputKey', 'text', 'Nombre del elemento', 'item')"
                              [value]="stepDraft.foreachItemInputKey"
                              (valueChange)="setObjectString(stepDraft, 'foreachItemInputKey', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('foreachConcurrency', 'number', 'Ejecuciones simultáneas', '4')"
                              [value]="stepDraft.foreachConcurrency"
                              (valueChange)="setObjectNumber(stepDraft, 'foreachConcurrency', $event, 4); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                          </div>
                        } @else if (stepDraft.type === 'subflow') {
                          <div class="section-heading">
                            <div class="mini-title">Reutiliza otro flow publicado</div>
                            <p class="meta">El resultado del flow hijo queda disponible como salida de este paso.</p>
                          </div>
                          <app-dynamic-field-control
                            [field]="runtimeField('subflowKey', 'select', 'Flow publicado', '', publishedSubflowOptions)"
                            [value]="stepDraft.subflowKey"
                            (valueChange)="setObjectString(stepDraft, 'subflowKey', $event); syncGuidedStepJson()"
                          ></app-dynamic-field-control>
                        } @else if (stepDraft.type === 'delay') {
                          <div class="section-heading">
                            <div class="mini-title">Espera antes de continuar</div>
                            <p class="meta">
                                Para esperas breves dentro de una ejecución. El límite general se administra en
                                Confisys.
                            </p>
                          </div>
                          <app-dynamic-field-control
                            [field]="runtimeField('delayMs', 'number', 'Duración en milisegundos', '1000')"
                            [value]="stepDraft.delayMs"
                            (valueChange)="setObjectNumber(stepDraft, 'delayMs', $event, 1000); syncGuidedStepJson()"
                          ></app-dynamic-field-control>
                        } @else if (stepDraft.type === 'emit_event') {
                          <div class="section-heading">
                            <div class="mini-title">Publica un evento durable</div>
                            <p class="meta">
                              Otros flows pueden reaccionar después aunque el proceso actual ya haya terminado.
                            </p>
                          </div>
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('eventKey', 'text', 'Nombre del evento', 'pedido.aprobado')"
                              [value]="stepDraft.eventKey"
                              (valueChange)="setObjectString(stepDraft, 'eventKey', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-code-textarea
                              label="Datos del evento"
                              controlId="eventPayloadText"
                              [value]="stepDraft.eventPayloadText"
                              minHeight="132px"
                              (valueChange)="setObjectString(stepDraft, 'eventPayloadText', $event); syncGuidedStepJson()"
                            ></app-code-textarea>
                          </div>
                        } @else if (stepDraft.type === 'decision') {
                          <div class="section-heading">
                            <div class="mini-title">Compara un dato</div>
                              <p class="meta">
                                Ejemplo: si <code>input.edad</code> es mayor o igual a <code>18</code>.
                              </p>
                          </div>
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('decisionLeft', 'text', 'Dato a revisar', 'input.edad')"
                              [value]="stepDraft.decisionLeft"
                              (valueChange)="setObjectString(stepDraft, 'decisionLeft', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('decisionOperator', 'select', 'Comparación', '', decisionOperatorOptions)"
                              [value]="stepDraft.decisionOperator"
                              (valueChange)="setObjectString(stepDraft, 'decisionOperator', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('decisionRightType', 'select', 'Tipo del valor', '', decisionRightTypeOptions)"
                              [value]="stepDraft.decisionRightType"
                              (valueChange)="setObjectString(stepDraft, 'decisionRightType', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('decisionRight', 'text', 'Valor para comparar', '18')"
                              [value]="stepDraft.decisionRight"
                              (valueChange)="setObjectString(stepDraft, 'decisionRight', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                          </div>
                        } @else if (stepDraft.type === 'formula') {
                          <div class="section-heading">
                            <div class="mini-title">Calcula un valor</div>
                            <p class="meta">Usa rutas como <code>input.total</code> o números directos.</p>
                          </div>
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('formulaLeft', 'text', 'Primer valor', 'input.total')"
                              [value]="stepDraft.formulaLeft"
                              (valueChange)="setObjectString(stepDraft, 'formulaLeft', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('formulaOperator', 'select', 'Operación', '', formulaOperatorOptions)"
                              [value]="stepDraft.formulaOperator"
                              (valueChange)="setObjectString(stepDraft, 'formulaOperator', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('formulaRight', 'text', 'Segundo valor', '0.19')"
                              [value]="stepDraft.formulaRight"
                              (valueChange)="setObjectString(stepDraft, 'formulaRight', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('formulaPrecision', 'number', 'Decimales', '2')"
                              [value]="stepDraft.formulaPrecision"
                              (valueChange)="setObjectNumber(stepDraft, 'formulaPrecision', $event, 2); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                          </div>
                        } @else if (stepDraft.type === 'validation') {
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('validationField', 'text', 'Campo', 'input.email')"
                              [value]="stepDraft.validationField"
                              (valueChange)="setObjectString(stepDraft, 'validationField', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('validationOperator', 'select', 'Operador', '', validationOperatorOptions)"
                              [value]="stepDraft.validationOperator"
                              (valueChange)="setObjectString(stepDraft, 'validationOperator', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            @if (validationNeedsValue) {
                              <app-dynamic-field-control
                                [field]="runtimeField('validationValue', 'text', 'Valor esperado', 'Valor de comparación')"
                                [value]="stepDraft.validationValue"
                                (valueChange)="setObjectString(stepDraft, 'validationValue', $event); syncGuidedStepJson()"
                              ></app-dynamic-field-control>
                            }
                            <app-dynamic-field-control
                              [field]="runtimeField('validationMessage', 'text', 'Mensaje si no cumple', 'El correo es obligatorio')"
                              [value]="stepDraft.validationMessage"
                              (valueChange)="setObjectString(stepDraft, 'validationMessage', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                          </div>
                        } @else if (stepDraft.type === 'response') {
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('responseStatus', 'select', 'Estado', '', responseStatusOptions)"
                              [value]="stepDraft.responseStatus"
                              (valueChange)="setObjectString(stepDraft, 'responseStatus', $event); syncGuidedStepJson()"
                            ></app-dynamic-field-control>
                            <app-code-textarea
                              label="Cuerpo de respuesta JSON"
                              controlId="responseBodyText"
                              [value]="stepDraft.responseBodyText"
                              minHeight="132px"
                              (valueChange)="setObjectString(stepDraft, 'responseBodyText', $event); syncGuidedStepJson()"
                            ></app-code-textarea>
                          </div>
                        } @else if (stepDraft.type === 'action') {
                          <app-dynamic-field-control
                            [field]="runtimeField('actionName', 'select', 'Acción declarativa', '', actionNameOptions)"
                            [value]="stepDraft.actionName"
                            (valueChange)="setObjectString(stepDraft, 'actionName', $event); syncGuidedStepJson()"
                          ></app-dynamic-field-control>
                        } @else {
                          <div class="hint">
                            {{ stepTypeSummary(stepDraft.type) }}
                          </div>
                        }
                      </div>

                      @if (stepDraft.type === 'dynamic_service' || stepDraft.type === 'action') {
                        <div class="configuration-title step-phase" id="flow-step-data">
                          <span>3</span>
                          <div>
                            <div class="mini-title">Conecta los datos</div>
                            <p class="meta">Selecciona el origen de cada valor sin escribir expresiones.</p>
                          </div>
                        </div>
                        <app-context-assistant
                          [title]="stepDataReady ? 'Las entradas están conectadas' : 'Indica de dónde sale cada dato'"
                          [description]="
                            stepDataReady
                              ? 'El servicio recibirá valores del input, contexto o resultados anteriores.'
                              : 'Cada entrada obligatoria necesita un origen antes de ejecutar el paso.'
                          "
                          example="email toma el valor Correo del formulario."
                            [nextAction]="
                              stepDataReady
                                ? 'Define las rutas del resultado.'
                                : 'Selecciona una opción para cada dato pendiente.'
                            "
                          [stateLabel]="stepDataReady ? 'Conectado' : 'Faltan conexiones'"
                          [tone]="stepDataReady ? 'success' : 'warning'"
                          [icon]="stepDataReady ? 'pi pi-check' : 'pi pi-link'"
                        ></app-context-assistant>
                        <div class="guided-panel">
                          <div class="toolbar">
                            <div>
                              <div class="mini-title">Datos que recibe la operación</div>
                              <p class="meta">
                                Los datos del formulario y los resultados anteriores aparecen como opciones.
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

                      <div class="configuration-title step-phase" id="flow-step-route">
                        <span>{{ stepUsesDataMap ? '4' : '3' }}</span>
                        <div>
                          <div class="mini-title">Define qué ocurre después</div>
                          <p class="meta">Conecta el resultado correcto, el error y el timeout cuando aplique.</p>
                        </div>
                      </div>
                      <app-context-assistant
                        [title]="stepRouteReady ? 'La continuación es coherente' : 'Define caminos diferentes'"
                        [description]="currentConnectionSummary"
                        example="Éxito → Construir respuesta; Error → Responder error."
                          [nextAction]="
                            stepRouteReady ? 'Revisa el JSON generado y guarda.' : 'Selecciona los destinos que faltan.'
                          "
                        [stateLabel]="stepRouteReady ? 'Ruta lista' : 'Ruta incompleta'"
                        [tone]="stepRouteReady ? 'success' : 'warning'"
                        [icon]="stepRouteReady ? 'pi pi-check' : 'pi pi-share-alt'"
                      ></app-context-assistant>
                      <div class="guided-panel">
                        <div>
                          <div class="mini-title">Rutas del resultado</div>
                          <p class="meta">
                            Si no eliges un destino explícito, el runner continúa con el siguiente paso de la lista.
                          </p>
                        </div>
                        @if (stepDraft.type === 'decision') {
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('onTrueStepKey', 'select', 'Si se cumple', '', targetStepOptions)"
                              [value]="stepDraft.onTrueStepKey"
                              (valueChange)="setObjectString(stepDraft, 'onTrueStepKey', $event)"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('onFalseStepKey', 'select', 'Si no se cumple', '', targetStepOptions)"
                              [value]="stepDraft.onFalseStepKey"
                              (valueChange)="setObjectString(stepDraft, 'onFalseStepKey', $event)"
                            ></app-dynamic-field-control>
                          </div>
                        } @else {
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('nextStepKey', 'select', stepDraft.type === 'dynamic_service' ? 'Cuando el servicio responde bien' : 'Cuando termina correctamente', '', targetStepOptions)"
                              [value]="stepDraft.nextStepKey"
                              (valueChange)="setObjectString(stepDraft, 'nextStepKey', $event)"
                            ></app-dynamic-field-control>
                            @if (
                              stepDraft.type === 'validation' ||
                              stepDraft.type === 'dynamic_service' ||
                              stepDraft.type === 'parallel' ||
                              stepDraft.type === 'foreach' ||
                              stepDraft.type === 'subflow'
                            ) {
                              <app-dynamic-field-control
                                [field]="runtimeField('onErrorStepKey', 'select', stepDraft.type === 'validation' ? 'Cuando no cumple' : 'Cuando la operación devuelve error', '', errorTargetStepOptions)"
                                [value]="stepDraft.onErrorStepKey"
                                (valueChange)="setObjectString(stepDraft, 'onErrorStepKey', $event)"
                              ></app-dynamic-field-control>
                            }
                            @if (stepDraft.type === 'dynamic_service') {
                              <app-dynamic-field-control
                                [field]="runtimeField('onTimeoutStepKey', 'select', 'Cuando supera el tiempo límite', '', timeoutTargetStepOptions)"
                                [value]="stepDraft.onTimeoutStepKey"
                                (valueChange)="setObjectString(stepDraft, 'onTimeoutStepKey', $event)"
                              ></app-dynamic-field-control>
                            }
                          </div>
                        }
                        <div class="connection-summary">
                          <strong>{{ currentConnectionSummary }}</strong>
                          <span class="meta">Guarda el paso para actualizar el mapa de ejecución.</span>
                        </div>
                      </div>

                      <section class="step-json">
                        <div class="toolbar">
                          <div>
                            <div class="mini-title">JSON generado del paso</div>
                            <p class="meta">
                                La guía mantiene estos objetos sincronizados. Activa la edición solo para un caso
                                avanzado.
                            </p>
                          </div>
                          <app-dynamic-field-control
                            [field]="runtimeField('stepAdvancedMode', 'checkbox', 'Editar JSON', 'Permite editar la definición técnica del paso.')"
                            [value]="stepDraft.advancedMode"
                            (valueChange)="setObjectBoolean(stepDraft, 'advancedMode', $event)"
                          ></app-dynamic-field-control>
                        </div>
                        <div class="grid">
                          <app-code-textarea
                            label="Configuración JSON"
                            controlId="stepConfigText"
                            [value]="stepDraft.configText"
                            [disabled]="!stepDraft.advancedMode"
                            minHeight="190px"
                            (valueChange)="setObjectString(stepDraft, 'configText', $event)"
                          ></app-code-textarea>
                          <app-code-textarea
                            label="Mapa de datos JSON"
                            controlId="stepInputMapText"
                            [value]="stepDraft.inputMapText"
                            [disabled]="!stepDraft.advancedMode"
                            minHeight="190px"
                            (valueChange)="setObjectString(stepDraft, 'inputMapText', $event)"
                          ></app-code-textarea>
                        </div>
                        <app-context-assistant
                            [title]="
                              stepJsonReady ? 'Los objetos JSON son válidos' : 'Hay un JSON que no puede interpretarse'
                            "
                          [description]="
                            stepDraft.advancedMode
                              ? 'Estás editando la definición técnica. La guía dejará de reemplazar tus cambios.'
                              : 'Estos objetos se generan con los controles anteriores y se guardan con el paso.'
                          "
                          example="config controla la operación; inputMap conecta sus entradas."
                            [nextAction]="
                              stepJsonReady ? 'Guarda y prueba el paso.' : 'Corrige llaves, comas o valores del JSON.'
                            "
                          [stateLabel]="stepJsonReady ? 'JSON válido' : 'JSON inválido'"
                          [tone]="stepJsonReady ? 'success' : 'warning'"
                          [icon]="stepJsonReady ? 'pi pi-check' : 'pi pi-code'"
                        ></app-context-assistant>
                        <details class="advanced-panel">
                          <summary>
                            Identidad y orden técnico
                            <span class="meta">Normalmente se generan automáticamente.</span>
                          </summary>
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('stepKey', 'text', 'Identificador del paso', 'validar_correo')"
                              [value]="stepDraft.key"
                              (valueChange)="setObjectString(stepDraft, 'key', $event)"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('stepPosition', 'number', 'Orden', '10')"
                              [value]="stepDraft.position"
                              (valueChange)="setObjectNumber(stepDraft, 'position', $event, 10)"
                            ></app-dynamic-field-control>
                          </div>
                        </details>
                      </section>
                      </section>

                      <div class="assistant-actions step-phase" id="flow-step-save">
                        <span class="meta">
                          {{
                            stepHasChanges ? 'Hay cambios sin guardar.' : 'Paso guardado. Puedes probarlo o continuar.'
                          }}
                        </span>
                        @if (stepDraft.id && stepHasChanges) {
                          <app-ui-kit-button
                            label="Deshacer cambios"
                            variant="outline"
                            (pressed)="resetStepChanges()"
                          ></app-ui-kit-button>
                        }
                        <app-ui-kit-button
                          label="Guardar"
                          icon="pi pi-save"
                          variant="outline"
                          [disabled]="!canUpdate || stepDraftIssues.length > 0"
                          (pressed)="saveStep('stay')"
                        ></app-ui-kit-button>
                        <app-ui-kit-button
                          label="Guardar y probar"
                          icon="pi pi-bolt"
                          [disabled]="!canUpdate || stepDraftIssues.length > 0"
                          (pressed)="saveStep('test')"
                        ></app-ui-kit-button>
                        <app-ui-kit-button
                          label="Guardar y agregar siguiente"
                          icon="pi pi-arrow-right"
                          variant="outline"
                          [disabled]="!canUpdate || stepDraftIssues.length > 0"
                          (pressed)="saveStep('next')"
                        ></app-ui-kit-button>
                        @if (stepDraft.id) {
                          <app-ui-kit-button
                            label="Eliminar paso"
                            tone="danger"
                            variant="outline"
                            [disabled]="!canUpdate"
                            (pressed)="deleteStep()"
                          ></app-ui-kit-button>
                        }
                      </div>
                    </div>
                  </section>

                  <section>
                    <div class="section-heading">
                      <h3>Cómo se activa cada paso</h3>
                      <p class="meta">
                        El runner empieza por el primer bloque y sigue la conexión producida por cada resultado.
                      </p>
                    </div>
                    <div class="checklist">
                      <div class="check-item">
                        <span class="check-mark">1</span>
                        <div>
                          <strong>Entrada</strong
                          ><span class="meta"
                            >El proceso recibe los datos de prueba o de la pantalla que lo invoque.</span
                          >
                        </div>
                      </div>
                      <div class="check-item">
                        <span class="check-mark">2</span>
                        <div>
                          <strong>Resultado y conexión</strong
                          ><span class="meta">Éxito, error, timeout, Sí o No seleccionan el siguiente destino.</span>
                        </div>
                      </div>
                      <div class="check-item">
                        <span class="check-mark">3</span>
                        <div>
                          <strong>Respuesta</strong
                          ><span class="meta"
                            >El último bloque construye lo que recibirá la pantalla o integración.</span
                          >
                        </div>
                      </div>
                    </div>

                    <details class="guided-panel">
                      <summary><strong>Ver definición técnica</strong></summary>
                      <pre>{{ selectedFlow.definitionPreview | json }}</pre>
                    </details>

                    <app-ui-kit-button
                      label="Continuar a pruebas"
                      variant="outline"
                      [disabled]="selectedFlow.steps.length === 0"
                      (pressed)="activeStage = 'test'"
                    ></app-ui-kit-button>
                  </section>
                </div>
              }

              @if (selectedFlow && activeStage === 'test') {
                <section>
                  <div class="section-heading">
                    <h3>Prueba antes de publicar</h3>
                    <p class="meta">
                      Ejecuta el borrador completo o detente después de un paso para revisar qué recibió y qué produjo.
                    </p>
                  </div>

                  <app-process-steps
                    [items]="flowTestSteps"
                    activeKey="execute"
                    [compact]="true"
                    [interactive]="false"
                    ariaLabel="Recorrido de prueba"
                  ></app-process-steps>

                  <div class="grid">
                    <div class="guided-panel">
                      <div>
                        <div class="mini-title">Datos de prueba</div>
                        <p class="meta">Completa el formulario como lo haría una pantalla real.</p>
                      </div>
                      @for (field of flowInputs; track field.key) {
                        <app-dynamic-field-control
                          [field]="runtimeField('flowTestInput' + field.key, field.type === 'boolean' ? 'select' : field.type, field.label || field.key, '', field.type === 'boolean' ? booleanOptions : [], field.required)"
                          [value]="testInputValues[field.key]"
                          (valueChange)="setTestInputValue(field, $event)"
                        ></app-dynamic-field-control>
                      } @empty {
                        <div class="hint">Este proceso no definió entradas. Puedes usar el JSON avanzado.</div>
                      }
                      <details>
                        <summary><strong>JSON avanzado</strong></summary>
                        <app-code-textarea
                          controlId="flowTestInputText"
                          [value]="testInputText"
                          minHeight="132px"
                          (valueChange)="testInputText = $event; syncTestValuesFromJson()"
                        ></app-code-textarea>
                      </details>
                    </div>
                    <div>
                      <app-dynamic-field-control
                        [field]="runtimeField('previewThroughStepKey', 'select', 'Probar hasta', '', previewStepOptions)"
                        [value]="previewThroughStepKey"
                        (valueChange)="previewThroughStepKey = controlString($event)"
                      ></app-dynamic-field-control>
                      <div class="callout" style="margin-top: 10px;">
                        Esta prueba usa los pasos que estás editando. No necesitas crear ni publicar una versión.
                      </div>
                      <app-ui-kit-button
                        [label]="executing ? 'Probando...' : 'Probar borrador'"
                        [disabled]="executing || selectedFlow.steps.length === 0"
                        (pressed)="previewFlow()"
                      ></app-ui-kit-button>
                    </div>
                  </div>

                  @if (lastPreview) {
                    <div class="run-card" style="margin-top: 14px;">
                      <div class="toolbar">
                        <strong>{{
                          lastPreview.status === 'success' ? 'Prueba correcta' : 'La prueba encontró un problema'
                        }}</strong>
                        <span
                          class="badge"
                          [class.status-success]="lastPreview.status === 'success'"
                          [class.status-failed]="lastPreview.status === 'failed'"
                        >
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
                            <span class="meta"
                              >{{ stepTypeLabel(step.stepType) }} · {{ step.status }} ·
                              {{ step.durationMs ?? 0 }} ms</span
                            >
                            <details>
                              <summary>Ver entrada y resultado</summary>
                              <pre>{{
                                {
                                  input: step.input,
                                  output: step.output,
                                  error: step.error
                                } | json
                              }}</pre>
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
                          <app-ui-kit-button
                            label="Usar resultado y continuar"
                            icon="pi pi-arrow-right"
                            (pressed)="continueFromPreview()"
                          ></app-ui-kit-button>
                        } @else {
                          <app-ui-kit-button
                            label="Corregir paso con error"
                            variant="outline"
                            (pressed)="editFailedPreviewStep()"
                          ></app-ui-kit-button>
                        }
                      </div>
                    </div>
                  }

                  <details class="test-suite-panel" [open]="testCases.length > 0">
                    <summary>
                      <span>
                        <strong>Pruebas repetibles</strong>
                        <small>Opcional · guarda escenarios para ejecutarlos después de cada cambio</small>
                      </span>
                      <span class="badge">{{ testCases.length }}</span>
                    </summary>
                    <div class="test-studio">
                      <section>
                        <div class="toolbar">
                          <div>
                            <h3>Casos guardados</h3>
                            <p class="meta">{{ testCases.length }} escenarios</p>
                          </div>
                          <app-ui-kit-button
                            label="Nuevo"
                            icon="pi pi-plus"
                            variant="outline"
                            (pressed)="startNewTestCase()"
                          ></app-ui-kit-button>
                        </div>
                        <div class="test-case-list">
                          @for (testCase of testCases; track testCase.id) {
                            <article
                              class="test-case"
                              role="button"
                              tabindex="0"
                              [class.active]="testCase.id === testCaseDraft.id"
                              (click)="selectTestCase(testCase)"
                              (keydown.enter)="selectTestCase(testCase)"
                              (keydown.space)="selectTestCase(testCase)"
                            >
                              <strong>{{ testCase.name }}</strong>
                              <span class="meta">
                                {{ testCase.target === 'draft' ? 'Borrador' : 'Publicada' }}
                                ·
                                {{ testCase.assertions?.length ?? 0 }}
                                comprobaciones
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
                            </article>
                          } @empty {
                            <div class="hint">Guarda el primer escenario para repetirlo después de cada cambio.</div>
                          }
                        </div>
                        <app-ui-kit-button
                          [label]="runningTests ? 'Ejecutando suite...' : 'Ejecutar todos'"
                          icon="pi pi-play"
                          [full]="true"
                          [disabled]="runningTests || !testCases.length"
                          (pressed)="runTestSuite()"
                        ></app-ui-kit-button>
                      </section>

                      <section>
                        <div class="section-heading">
                          <h3>
                            {{ testCaseDraft.id ? 'Editar caso de prueba' : 'Nuevo caso de prueba' }}
                          </h3>
                          <p class="meta">
                            Define la entrada y comprueba campos concretos de la respuesta sin leer todo el JSON.
                          </p>
                        </div>
                        <div class="grid">
                          <app-dynamic-field-control
                            [field]="runtimeField('testCaseName', 'text', 'Nombre del escenario', 'Solicitud válida')"
                            [value]="testCaseDraft.name"
                            (valueChange)="setObjectString(testCaseDraft, 'name', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('testCaseTarget', 'select', 'Probar', '', flowTestTargetOptions)"
                            [value]="testCaseDraft.target"
                            (valueChange)="setObjectString(testCaseDraft, 'target', $event)"
                          ></app-dynamic-field-control>
                          <app-dynamic-field-control
                            [field]="runtimeField('testCaseExpectedStatus', 'select', 'Resultado esperado', '', expectedStatusOptions)"
                            [value]="testCaseDraft.expectedStatus"
                            (valueChange)="setObjectString(testCaseDraft, 'expectedStatus', $event)"
                          ></app-dynamic-field-control>
                          @if (testCaseDraft.target === 'draft') {
                            <app-dynamic-field-control
                              [field]="runtimeField('testCaseThroughStepKey', 'select', 'Ejecutar hasta', '', testCaseStepOptions)"
                              [value]="testCaseDraft.throughStepKey"
                              (valueChange)="setObjectString(testCaseDraft, 'throughStepKey', $event)"
                            ></app-dynamic-field-control>
                          }
                        </div>
                        <app-code-textarea
                          label="Entrada JSON"
                          controlId="testCaseInputText"
                          [value]="testCaseDraft.inputText"
                          minHeight="132px"
                          (valueChange)="setObjectString(testCaseDraft, 'inputText', $event)"
                        ></app-code-textarea>

                        <div class="toolbar" style="margin-top: 12px;">
                          <div>
                            <div class="mini-title">Comprobaciones</div>
                            <p class="meta">Ejemplo: <code>output.body.ok</code> es igual a <code>true</code>.</p>
                          </div>
                          <app-ui-kit-button
                            label="Agregar"
                            icon="pi pi-plus"
                            variant="outline"
                            (pressed)="addTestAssertion()"
                          ></app-ui-kit-button>
                        </div>
                        @for (assertion of testCaseDraft.assertions; track $index) {
                          <div class="assertion-row">
                            <app-dynamic-field-control
                              [field]="runtimeField('assertionPath' + $index, 'text', 'Campo de respuesta', 'output.body.ok')"
                              [value]="assertion.path"
                              (valueChange)="setObjectString(assertion, 'path', $event)"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('assertionOperator' + $index, 'select', 'Comprobar', '', assertionOperatorOptions)"
                              [value]="assertion.operator"
                              (valueChange)="setObjectString(assertion, 'operator', $event)"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('assertionExpected' + $index, 'text', 'Valor esperado', 'true')"
                              [value]="assertion.expectedText"
                              [disabled]="assertion.operator === 'exists' || assertion.operator === 'truthy'"
                              (valueChange)="setObjectString(assertion, 'expectedText', $event)"
                            ></app-dynamic-field-control>
                            <app-ui-kit-button
                              label="Quitar"
                              icon="pi pi-trash"
                              tone="danger"
                              variant="outline"
                              (pressed)="removeTestAssertion($index)"
                            ></app-ui-kit-button>
                          </div>
                        } @empty {
                          <div class="hint">
                            Sin comprobaciones: solo se validará si el proceso termina como esperas.
                          </div>
                        }

                        <details class="guided-panel">
                          <summary>
                            <strong>Comparar fragmento de salida JSON</strong>
                          </summary>
                          <p class="meta">
                            Opcional. Solo se comparan las propiedades escritas; las propiedades adicionales se ignoran.
                          </p>
                          <app-code-textarea
                            controlId="testCaseExpectedOutputText"
                            [value]="testCaseDraft.expectedOutputText"
                            minHeight="132px"
                            (valueChange)="setObjectString(testCaseDraft, 'expectedOutputText', $event)"
                          ></app-code-textarea>
                        </details>

                        <div class="row" style="margin-top: 12px;">
                          <app-ui-kit-button
                            [label]="testCaseDraft.id ? 'Guardar caso' : 'Crear caso'"
                            icon="pi pi-save"
                            [disabled]="runningTests"
                            (pressed)="saveTestCase()"
                          ></app-ui-kit-button>
                          @if (testCaseDraft.id) {
                            <app-ui-kit-button
                              label="Ejecutar caso"
                              icon="pi pi-play"
                              variant="outline"
                              [disabled]="runningTests"
                              (pressed)="runSelectedTestCase()"
                            ></app-ui-kit-button>
                            <app-ui-kit-button
                              label="Eliminar"
                              tone="danger"
                              variant="outline"
                              [disabled]="runningTests"
                              (pressed)="deleteTestCase()"
                            ></app-ui-kit-button>
                          }
                        </div>

                        @if (testSuiteResult) {
                          <div class="test-result-bar" style="margin-top: 12px;">
                            <div>
                              <strong>{{ testSuiteResult.total }}</strong
                              ><span class="meta">Ejecutados</span>
                            </div>
                            <div>
                              <strong>{{ testSuiteResult.passed }}</strong
                              ><span class="meta">Correctos</span>
                            </div>
                            <div>
                              <strong>{{ testSuiteResult.failed }}</strong
                              ><span class="meta">Fallidos</span>
                            </div>
                          </div>
                        }
                        @if (lastTestResult) {
                          <div class="run-card" style="margin-top: 12px;">
                            <strong>{{ lastTestResult.passed ? 'Caso correcto' : 'Caso con diferencias' }}</strong>
                            @for (
                              assertion of lastTestResult.assertionResults;
                              track assertion.path + assertion.operator
                            ) {
                              <div class="step-run">
                                <span>{{ assertion.path }} · {{ assertion.operator }}</span>
                                <span class="meta">{{
                                  assertion.passed
                                    ? 'Cumple'
                                    : 'Esperado: ' +
                                      (assertion.expected | json) +
                                      ' · recibido: ' +
                                      (assertion.actual | json)
                                }}</span>
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
                  </details>

                  <div class="row" style="margin-top: 14px;">
                    <app-ui-kit-button
                      label="Volver a pasos"
                      variant="outline"
                      (pressed)="activeStage = 'build'"
                    ></app-ui-kit-button>
                    <app-ui-kit-button
                      label="Continuar a publicar"
                      [disabled]="lastPreview?.status !== 'success'"
                      (pressed)="activeStage = 'publish'"
                    ></app-ui-kit-button>
                  </div>
                </section>
              }

              @if (selectedFlow && activeStage === 'publish') {
                <section>
                  <div class="section-heading">
                    <h3>Versiona y publica</h3>
                    <p class="meta">
                      Una versión congela el borrador actual. Publicarla la deja disponible para pantallas, eventos e
                      integraciones.
                    </p>
                  </div>

                  <div class="checklist">
                    <div class="check-item">
                      <span class="check-mark">{{ designerIssues.length === 0 ? '✓' : '!' }}</span>
                      <div>
                        <strong>Configuración completa</strong>
                        <span class="meta">{{
                          designerIssues.length === 0
                            ? selectedFlow.steps.length + ' pasos listos.'
                            : designerIssues.length + ' puntos necesitan atención.'
                        }}</span>
                      </div>
                    </div>
                    <div class="check-item">
                      <span class="check-mark">{{ lastPreview?.status === 'success' ? '✓' : '!' }}</span>
                      <div>
                        <strong>Prueba del borrador</strong
                        ><span class="meta">{{
                          lastPreview?.status === 'success'
                            ? 'La última prueba terminó bien.'
                            : 'Recomendado: vuelve a Probar antes de publicar.'
                        }}</span>
                      </div>
                    </div>
                    <div class="check-item">
                      <span class="check-mark">{{ selectedFlow.latestVersion ? '✓' : '3' }}</span>
                      <div>
                        <strong>Versión</strong
                        ><span class="meta">{{
                          selectedFlow.latestVersion
                            ? 'Última versión: v' +
                              selectedFlow.latestVersion.version +
                              ' (' +
                              selectedFlow.latestVersion.status +
                              ')'
                            : 'Todavía no has creado una versión.'
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="row">
                    <app-ui-kit-button
                      label="1. Crear versión"
                      variant="outline"
                      [disabled]="!canPublish || designerIssues.length > 0"
                      (pressed)="createVersion()"
                    ></app-ui-kit-button>
                    <app-ui-kit-button
                      label="2. Publicar versión"
                      [disabled]="
                        !canPublish || !selectedFlow.latestVersion || selectedFlow.latestVersion.status === 'published'
                      "
                      (pressed)="publishLatest()"
                    ></app-ui-kit-button>
                    <app-ui-kit-button
                      label="Probar versión publicada"
                      variant="outline"
                      [disabled]="executing || !selectedFlow.publishedVersion"
                      (pressed)="executeFlow()"
                    ></app-ui-kit-button>
                  </div>

                  @if (selectedFlow.publishedVersion) {
                    <div class="message">
                      Activa: versión
                      {{ selectedFlow.publishedVersion.version }}. Este proceso ya puede llamarse con la key
                      <code>{{ selectedFlow.key }}</code
                      >.
                    </div>
                  }

                  @if (lastRun) {
                    <div class="run-card">
                      <strong>Última ejecución publicada: {{ lastRun.status }}</strong>
                      <pre>{{ lastRun | json }}</pre>
                    </div>
                  }

                  <div class="operations-grid">
                    <section class="operation-panel">
                      <div class="toolbar">
                        <div>
                          <h3>Historial de versiones</h3>
                          <p class="meta">Compara o recupera una versión sin modificar la publicada.</p>
                        </div>
                        <app-ui-kit-button
                          label="Actualizar"
                          icon="pi pi-refresh"
                          variant="outline"
                          (pressed)="loadVersions()"
                        ></app-ui-kit-button>
                      </div>
                      <div class="version-list">
                        @for (version of flowVersions; track version.id) {
                          <div class="version-item">
                            <div>
                              <strong>Versión {{ version.version }}</strong>
                              <div class="meta">{{ version.status }} · {{ version.createdAt }}</div>
                            </div>
                            <div class="row">
                              <app-ui-kit-button
                                label="Comparar"
                                icon="pi pi-clone"
                                variant="outline"
                                (pressed)="selectVersionForComparison(version.id)"
                              ></app-ui-kit-button>
                              <app-ui-kit-button
                                label="Restaurar"
                                icon="pi pi-history"
                                variant="outline"
                                [disabled]="!canUpdate"
                                (pressed)="restoreVersionDraft(version)"
                              ></app-ui-kit-button>
                            </div>
                          </div>
                        } @empty {
                          <div class="hint">Crea la primera versión para iniciar el historial.</div>
                        }
                      </div>
                      @if (compareVersionIds[0] || compareVersionIds[1]) {
                        <div class="hint">
                          Comparación:
                          {{ versionLabel(compareVersionIds[0]) }} → {{ versionLabel(compareVersionIds[1]) }}.
                          Selecciona dos versiones.
                        </div>
                      }
                      @if (versionComparison) {
                        <app-status-notice
                          [tone]="versionComparison.summary.changed ? 'info' : 'success'"
                          [title]="
                            versionComparison.summary.changed
                              ? versionComparison.summary.changeCount + ' cambios encontrados'
                              : 'Las versiones son iguales'
                          "
                        >
                          Agregados:
                          {{ versionComparison.summary.addedSteps.join(', ') || 'ninguno' }}
                          · Eliminados:
                          {{ versionComparison.summary.removedSteps.join(', ') || 'ninguno' }}
                          · Modificados:
                          {{ versionComparison.summary.changedSteps.join(', ') || 'ninguno' }}.
                        </app-status-notice>
                      }
                    </section>

                    <section class="operation-panel">
                      <div>
                        <h3>Reutilizar este proceso</h3>
                        <p class="meta">Duplica el borrador o guárdalo como plantilla de la organización.</p>
                      </div>
                      <div class="grid">
                        <app-dynamic-field-control
                          [field]="runtimeField('duplicateName', 'text', 'Nombre de la copia', 'Copia de este flow')"
                          [value]="duplicateDraft.name"
                          (valueChange)="setObjectString(duplicateDraft, 'name', $event)"
                        ></app-dynamic-field-control>
                        <app-dynamic-field-control
                          [field]="runtimeField('duplicateKey', 'text', 'Key de la copia', 'copia_del_flow')"
                          [value]="duplicateDraft.key"
                          (valueChange)="setObjectString(duplicateDraft, 'key', $event)"
                        ></app-dynamic-field-control>
                      </div>
                      <app-ui-kit-button
                        label="Duplicar como borrador"
                        icon="pi pi-copy"
                        variant="outline"
                        [disabled]="!canCreate"
                        (pressed)="duplicateFlow()"
                      ></app-ui-kit-button>
                      <div class="grid">
                        <app-dynamic-field-control
                          [field]="runtimeField('templateName', 'text', 'Nombre de la plantilla', 'Proceso reutilizable')"
                          [value]="templateDraft.name"
                          (valueChange)="setObjectString(templateDraft, 'name', $event)"
                        ></app-dynamic-field-control>
                        <app-dynamic-field-control
                          [field]="runtimeField('templateKey', 'text', 'Key de la plantilla', 'proceso_reutilizable')"
                          [value]="templateDraft.key"
                          (valueChange)="setObjectString(templateDraft, 'key', $event)"
                        ></app-dynamic-field-control>
                      </div>
                      <app-ui-kit-button
                        label="Guardar como plantilla"
                        icon="pi pi-bookmark"
                        variant="outline"
                        [disabled]="!canUpdate"
                        (pressed)="saveFlowTemplate()"
                      ></app-ui-kit-button>
                    </section>

                    <section class="operation-panel" style="grid-column: 1 / -1;">
                      <div class="toolbar">
                        <div>
                          <h3>Salud del flow</h3>
                          <p class="meta">Éxito, latencia y pasos problemáticos sobre ejecuciones reales.</p>
                        </div>
                        <div class="row">
                          <app-dynamic-field-control
                            [field]="runtimeField('observabilityStatus', 'select', 'Estado', '', observabilityStatusOptions)"
                            [value]="observabilityStatus"
                            (valueChange)="observabilityStatus = controlString($event)"
                          ></app-dynamic-field-control>
                          <app-ui-kit-button
                            label="Actualizar"
                            icon="pi pi-chart-line"
                            variant="outline"
                            (pressed)="loadObservability()"
                          ></app-ui-kit-button>
                        </div>
                      </div>
                      @if (observability) {
                        <div class="metric-grid">
                          <div class="metric">
                            <span class="meta">Ejecuciones</span><strong>{{ observability.summary.total }}</strong>
                          </div>
                          <div class="metric">
                            <span class="meta">Éxito</span><strong>{{ observability.summary.successRate }}%</strong>
                          </div>
                          <div class="metric">
                            <span class="meta">Promedio</span
                            ><strong>{{ observability.summary.averageDurationMs }} ms</strong>
                          </div>
                          <div class="metric">
                            <span class="meta">P95</span><strong>{{ observability.summary.p95DurationMs }} ms</strong>
                          </div>
                        </div>
                        <div class="runtime-list">
                          @for (step of observability.steps.slice(0, 5); track step.stepKey) {
                            <div class="runtime-item">
                              <div class="toolbar" style="margin: 0;">
                                <strong>{{ step.stepName }}</strong>
                                <span class="meta">{{ step.failureRate }}% errores</span>
                              </div>
                              <span class="meta">
                                {{ step.executions }} ejecuciones · promedio {{ step.averageDurationMs }} ms · P95
                                {{ step.p95DurationMs }} ms
                              </span>
                            </div>
                          } @empty {
                            <div class="hint">Todavía no hay pasos ejecutados para este filtro.</div>
                          }
                        </div>
                      } @else {
                        <div class="hint">Actualiza para calcular métricas desde el historial del flow.</div>
                      }
                    </section>
                  </div>

                  @if (selectedFlow.publishedVersion) {
                    <div class="runtime-grid">
                      <section>
                        <div class="toolbar">
                          <div>
                            <h3>Activadores</h3>
                            <p class="meta">Define cuándo se encola este proceso.</p>
                          </div>
                          <app-ui-kit-button
                            label="Nuevo"
                            icon="pi pi-plus"
                            variant="outline"
                            (pressed)="startNewTrigger()"
                          ></app-ui-kit-button>
                        </div>

                        <div class="runtime-list">
                          @for (trigger of triggers; track trigger.id) {
                            <article
                              class="runtime-item"
                              role="button"
                              tabindex="0"
                              [class.selected]="trigger.id === triggerDraft.id"
                              (click)="selectTrigger(trigger)"
                              (keydown.enter)="selectTrigger(trigger)"
                              (keydown.space)="selectTrigger(trigger)"
                            >
                              <span class="toolbar" style="margin: 0;">
                                <strong>{{ triggerTypeLabel(trigger.type) }}</strong>
                                <span class="runtime-state" [class.connected]="trigger.active">
                                  {{ trigger.active ? 'Activo' : 'Pausado' }}
                                </span>
                              </span>
                              <span class="meta">{{ trigger.key }}</span>
                              @if (trigger.type === 'schedule' && trigger.nextFireAt) {
                                <span class="meta">Próxima ejecución: {{ trigger.nextFireAt }}</span>
                              }
                            </article>
                          } @empty {
                            <div class="hint">Sin activadores. El flow solo se ejecuta manualmente.</div>
                          }
                        </div>

                        <div class="guided-panel">
                          <div class="grid">
                            <app-dynamic-field-control
                              [field]="runtimeField('triggerType', 'select', 'Tipo', '', triggerTypeOptions)"
                              [value]="triggerDraft.type"
                              (valueChange)="setTriggerTypeFromControl($event)"
                            ></app-dynamic-field-control>
                            <app-dynamic-field-control
                              [field]="runtimeField('triggerKey', 'text', 'Clave', 'record.created')"
                              [value]="triggerDraft.key"
                              (valueChange)="setObjectString(triggerDraft, 'key', $event)"
                            ></app-dynamic-field-control>
                            @if (triggerDraft.type === 'http') {
                              <app-dynamic-field-control
                                [field]="runtimeField('triggerSecret', 'password', triggerDraft.id ? 'Nuevo secreto (opcional)' : 'Secreto del webhook', 'Mínimo 16 caracteres')"
                                [value]="triggerDraft.secret"
                                (valueChange)="setObjectString(triggerDraft, 'secret', $event)"
                              ></app-dynamic-field-control>
                            }
                            @if (triggerDraft.type === 'schedule') {
                              <app-dynamic-field-control
                                [field]="runtimeField('triggerIntervalSeconds', 'number', 'Ejecutar cada (segundos)', '60')"
                                [value]="triggerDraft.intervalSeconds"
                                (valueChange)="setObjectNumber(triggerDraft, 'intervalSeconds', $event, 60)"
                              ></app-dynamic-field-control>
                            }
                            @if (
                              triggerDraft.type === 'record_event' ||
                              triggerDraft.type === 'form_submit' ||
                              triggerDraft.type === 'http'
                            ) {
                              <app-dynamic-field-control
                                [field]="runtimeField('triggerInputMode', 'select', 'Forma de entrada', '', triggerInputModeOptions)"
                                [value]="triggerDraft.inputMode"
                                (valueChange)="setObjectString(triggerDraft, 'inputMode', $event)"
                              ></app-dynamic-field-control>
                            }
                            <app-dynamic-field-control
                              [field]="runtimeField('triggerActive', 'checkbox', 'Activador activo', 'El activador queda disponible después de guardar.')"
                              [value]="triggerDraft.active"
                              (valueChange)="setObjectBoolean(triggerDraft, 'active', $event)"
                            ></app-dynamic-field-control>
                          </div>
                          @if (triggerDraft.type === 'schedule') {
                            <app-code-textarea
                              label="Entrada programada JSON"
                              controlId="triggerInputText"
                              [value]="triggerDraft.inputText"
                              minHeight="132px"
                              (valueChange)="setObjectString(triggerDraft, 'inputText', $event)"
                            ></app-code-textarea>
                          }
                          @if (triggerDraft.id && triggerDraft.type === 'http') {
                            <div class="code-line">
                              {{ webhookUrl(triggerDraft.key) }}
                            </div>
                          }
                          <div class="row">
                            <app-ui-kit-button
                              [label]="triggerDraft.id ? 'Guardar activador' : 'Crear activador'"
                              icon="pi pi-save"
                              [disabled]="savingTrigger"
                              (pressed)="saveTrigger()"
                            ></app-ui-kit-button>
                            @if (triggerDraft.id && triggerDraft.type === 'manual') {
                              <app-ui-kit-button
                                label="Disparar ahora"
                                icon="pi pi-play"
                                variant="outline"
                                [disabled]="savingTrigger"
                                (pressed)="fireManualTrigger()"
                              ></app-ui-kit-button>
                            }
                            @if (triggerDraft.id) {
                              <app-ui-kit-button
                                label="Eliminar"
                                tone="danger"
                                variant="outline"
                                [disabled]="savingTrigger"
                                (pressed)="deleteTrigger()"
                              ></app-ui-kit-button>
                            }
                          </div>
                        </div>
                      </section>

                      <section>
                        <div class="toolbar">
                          <div>
                            <h3>Cola y ejecuciones</h3>
                            <span class="runtime-state" [class.connected]="flowLive.connected()">
                              {{ flowLive.connected() ? 'Actualización en vivo' : 'Reconectando' }}
                            </span>
                          </div>
                          <div class="row">
                            <app-ui-kit-button
                              label="Actualizar"
                              icon="pi pi-refresh"
                              variant="outline"
                              (pressed)="loadJobs()"
                            ></app-ui-kit-button>
                            <app-ui-kit-button
                              label="Encolar prueba"
                              icon="pi pi-send"
                              [disabled]="executing"
                              (pressed)="enqueueFlow()"
                            ></app-ui-kit-button>
                          </div>
                        </div>
                        @if (lastLiveEvent) {
                          <div class="callout">
                            {{ liveEventLabel(lastLiveEvent) }}
                          </div>
                        }
                        <div class="runtime-list">
                          @for (job of flowJobs; track job.id) {
                            <div class="runtime-item">
                              <div class="toolbar" style="margin: 0;">
                                <strong>{{ job.triggerKey || job.triggerType }}</strong>
                                <span
                                  class="runtime-state"
                                  [class.success]="job.status === 'success'"
                                  [class.running]="job.status === 'running'"
                                  [class.queued]="job.status === 'queued' || job.status === 'waiting'"
                                  [class.failed]="job.status === 'failed'"
                                  [class.cancelled]="job.status === 'cancelled'"
                                  >{{ job.status }}</span
                                >
                              </div>
                              <span class="meta">
                                Intento {{ job.attempts }}/{{ job.maxAttempts }}
                                ·
                                {{ job.createdAt }}
                              </span>
                              @if (job.error) {
                                <span class="message">{{ job.error }}</span>
                              }
                              <div class="row">
                                @if (job.status === 'queued' || job.status === 'waiting') {
                                  <app-ui-kit-button
                                    label="Cancelar"
                                    tone="danger"
                                    variant="outline"
                                    (pressed)="cancelJob(job)"
                                  ></app-ui-kit-button>
                                }
                                @if (job.status === 'failed' || job.status === 'cancelled') {
                                  <app-ui-kit-button
                                    label="Reintentar"
                                    variant="outline"
                                    (pressed)="retryJob(job)"
                                  ></app-ui-kit-button>
                                }
                              </div>
                            </div>
                          } @empty {
                            <div class="hint">La cola está vacía. Encola una prueba o activa un trigger.</div>
                          }
                        </div>
                      </section>
                    </div>
                  }
                </section>
              }
            </section>
          }
        </ng-container>
      </app-designer-workspace>
      </div>
    </app-page-shell>
  `
})
export class FlowsPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiClientService);
  private readonly assistant = inject(AiAssistantService);
  readonly flowLive = inject(FlowLiveClientService);
  private liveSubscription?: Subscription;
  readonly auth = inject(AuthService);
  private appliedAssistantProposalId = 0;
  private readonly unregisterAssistantState = this.assistant.registerScreenStateProvider('flows', () =>
    this.assistantScreenState()
  );
  private readonly assistantProposalEffect = effect(() => {
    const proposal = this.assistant.proposal();
    if (!proposal || proposal.id === this.appliedAssistantProposalId || proposal.scope !== 'flows') {
      return;
    }

    const action = proposal.actions.find((item): item is ApplyFlowJsonAction => item.type === 'apply_flow_json');
    if (!action) {
      return;
    }

    this.appliedAssistantProposalId = proposal.id;
    this.applyAssistantFlowProposal(action);
  });

  readonly stepTypes: FlowStepType[] = [
    'dynamic_service',
    'parallel',
    'foreach',
    'subflow',
    'validation',
    'decision',
    'formula',
    'delay',
    'emit_event',
    'response'
  ];
  readonly stages: Array<{ key: FlowStage; label: string; summary: string }> = [
    { key: 'describe', label: 'Definir', summary: 'Propósito' },
    { key: 'build', label: 'Construir', summary: 'Pasos' },
    { key: 'test', label: 'Probar', summary: 'Borrador' },
    { key: 'publish', label: 'Publicar', summary: 'Versión' }
  ];
  readonly starters: Array<{
    key: FlowStarter;
    label: string;
    summary: string;
    icon: string;
  }> = [
    {
      key: 'validate',
      label: 'Validar datos',
      summary: 'Comprueba campos y decide si puede continuar.',
      icon: 'pi pi-check-circle'
    },
    {
      key: 'service',
      label: 'Usar un servicio',
      summary: 'Consulta o modifica datos mediante un servicio publicado.',
      icon: 'pi pi-bolt'
    },
    {
      key: 'multi_service',
      label: 'Encadenar servicios',
      summary: 'Conecta tantos servicios como necesite el proceso.',
      icon: 'pi pi-share-alt'
    },
    {
      key: 'calculate',
      label: 'Calcular un valor',
      summary: 'Realiza operaciones matemáticas con los datos recibidos.',
      icon: 'pi pi-calculator'
    },
    {
      key: 'blank',
      label: 'Comenzar vacío',
      summary: 'Construye el recorrido sin una sugerencia inicial.',
      icon: 'pi pi-plus'
    }
  ];
  flows: FlowItem[] = [];
  services: DynamicServiceItem[] = [];
  flowTemplates: FlowTemplateItem[] = [];
  selectedTemplateId = '';
  flowRuns: FlowRunItem[] = [];
  flowVersions: FlowVersion[] = [];
  compareVersionIds: [string, string] = ['', ''];
  versionComparison?: FlowVersionComparison;
  observability?: FlowObservability;
  observabilityStatus = '';
  duplicateDraft = { name: '', key: '' };
  templateDraft = { name: '', key: '' };
  selectedFlowId = '';
  message = '';
  loading = false;
  executing = false;
  creatingFlow = false;
  runningTests = false;
  activeStage: FlowStage = 'describe';
  stepEditorPhase: StepEditorPhase = 'purpose';
  buildView: 'graph' | 'list' = 'graph';
  readonly buildViewOptions: SegmentedControlItem[] = [
    { key: 'graph', label: 'Mapa', icon: 'pi pi-share-alt' },
    { key: 'list', label: 'Lista', icon: 'pi pi-list' }
  ];
  readonly entryModeOptions: Array<{
    value: FlowEntryMode;
    label: string;
    summary: string;
  }> = [
    {
      value: 'direct',
      label: 'Llamada directa',
      summary: 'Una pantalla o integración ejecuta el flow por su key y espera la respuesta.'
    },
    {
      value: 'manual',
      label: 'Manual',
      summary: 'Un operador lo dispara desde administración.'
    },
    {
      value: 'http',
      label: 'Webhook HTTP',
      summary: 'Un sistema externo llama una URL firmada.'
    },
    {
      value: 'record_event',
      label: 'Evento',
      summary: 'Reacciona a un evento durable del sistema.'
    },
    {
      value: 'form_submit',
      label: 'Formulario',
      summary: 'Se dispara cuando se envía un formulario.'
    },
    {
      value: 'schedule',
      label: 'Horario',
      summary: 'Se encola periódicamente después de publicarlo.'
    }
  ];
  readonly flowCategoryOptions = [
    { label: 'Operaciones', value: 'operaciones' },
    { label: 'Ventas', value: 'ventas' },
    { label: 'Seguridad', value: 'seguridad' },
    { label: 'Integraciones', value: 'integraciones' },
    { label: 'Experiencia de usuario', value: 'experiencia' },
    { label: 'Otro', value: 'otro' }
  ];
  readonly flowInputTypeOptions = [
    { label: 'Texto', value: 'text' },
    { label: 'Correo', value: 'email' },
    { label: 'Número', value: 'number' },
    { label: 'Sí / no', value: 'boolean' },
    { label: 'Fecha', value: 'date' }
  ];
  readonly stepTypeOptions = [
    { label: 'Ejecutar un servicio', value: 'dynamic_service' },
    { label: 'Validar un dato', value: 'validation' },
    { label: 'Tomar una decisión', value: 'decision' },
    { label: 'Calcular un valor', value: 'formula' },
    { label: 'Construir la respuesta', value: 'response' },
    { label: 'Ejecutar varios servicios a la vez', value: 'parallel' },
    { label: 'Procesar cada elemento de una lista', value: 'foreach' },
    { label: 'Ejecutar otro flow', value: 'subflow' },
    { label: 'Esperar antes de continuar', value: 'delay' },
    { label: 'Emitir un evento', value: 'emit_event' }
  ];
  readonly decisionOperatorOptions = [
    { label: 'Es igual a', value: '===' },
    { label: 'Es diferente de', value: '!==' },
    { label: 'Es mayor que', value: '>' },
    { label: 'Es mayor o igual que', value: '>=' },
    { label: 'Es menor que', value: '<' },
    { label: 'Es menor o igual que', value: '<=' },
    { label: 'Contiene', value: 'in' }
  ];
  readonly decisionRightTypeOptions = [
    { label: 'Texto', value: 'text' },
    { label: 'Número', value: 'number' },
    { label: 'Sí / no', value: 'boolean' },
    { label: 'Otro dato del proceso', value: 'path' }
  ];
  readonly formulaOperatorOptions = [
    { label: 'Sumar', value: '+' },
    { label: 'Restar', value: '-' },
    { label: 'Multiplicar', value: '*' },
    { label: 'Dividir', value: '/' },
    { label: 'Residuo', value: '%' }
  ];
  readonly validationOperatorOptions = [
    { label: 'Requerido', value: 'required' },
    { label: 'Igual a', value: 'equals' },
    { label: 'Diferente de', value: 'not_equals' },
    { label: 'No vacío', value: 'not_empty' },
    { label: 'Mínimo', value: 'greater_than' },
    { label: 'Máximo', value: 'less_than' },
    { label: 'Contiene', value: 'contains' },
    { label: 'Correo válido', value: 'email' }
  ];
  readonly responseStatusOptions = [
    { label: 'success', value: 'success' },
    { label: 'failed', value: 'failed' },
    { label: 'partial', value: 'partial' }
  ];
  readonly actionNameOptions = [
    { label: 'create_record', value: 'create_record' },
    { label: 'show_modal', value: 'show_modal' },
    { label: 'navigate', value: 'navigate' },
    { label: 'queue_offline', value: 'queue_offline' },
    { label: 'upload_files', value: 'upload_files' }
  ];
  readonly flowTestTargetOptions = [
    { label: 'Borrador actual', value: 'draft' },
    { label: 'Versión publicada', value: 'published' }
  ];
  readonly expectedStatusOptions = [
    { label: 'Debe terminar correctamente', value: 'success' },
    { label: 'Debe fallar de forma controlada', value: 'failed' }
  ];
  readonly assertionOperatorOptions = [
    { label: 'Es igual a', value: 'equals' },
    { label: 'Es diferente de', value: 'not_equals' },
    { label: 'Contiene', value: 'contains' },
    { label: 'Existe', value: 'exists' },
    { label: 'Es verdadero', value: 'truthy' },
    { label: 'Es mayor que', value: 'greater_than' },
    { label: 'Es menor que', value: 'less_than' }
  ];
  readonly observabilityStatusOptions = [
    { label: 'Todos los estados', value: '' },
    { label: 'Correctas', value: 'success' },
    { label: 'Fallidas', value: 'failed' },
    { label: 'Timeout', value: 'timeout' },
    { label: 'Canceladas', value: 'cancelled' }
  ];
  readonly triggerTypeOptions = [
    { label: 'Manual', value: 'manual' },
    { label: 'Webhook HTTP', value: 'http' },
    { label: 'Evento de record', value: 'record_event' },
    { label: 'Envío de formulario', value: 'form_submit' },
    { label: 'Programado', value: 'schedule' }
  ];
  readonly triggerInputModeOptions = [
    { label: 'Usar payload directamente', value: 'payload' },
    { label: 'Conservar sobre del evento', value: 'envelope' }
  ];
  readonly booleanOptions = [
    { label: 'Sí', value: true },
    { label: 'No', value: false }
  ];
  readonly capabilityGroups = [
    {
      title: 'Disponible en Flow',
      tone: 'supported',
      icon: 'pi pi-check-circle',
      items: [
        'Validar, decidir, calcular y construir respuestas.',
        'Encadenar servicios sin límite fijo de dos pasos.',
        'Ejecutar en paralelo, recorrer listas y llamar subflows.',
        'Reintentos, timeout, compensación, eventos y pruebas.',
        'Entrada directa, manual, HTTP, formulario, evento u horario.'
      ]
    },
    {
      title: 'Se configura en Servicios',
      tone: 'delegated',
      icon: 'pi pi-arrow-right',
      items: [
        'Consultar o modificar tablas y records.',
        'Consumir REST y transformar request/response.',
        'SOAP, WebSocket y conectores cuando estén disponibles.',
        'Credenciales, secretos y políticas propias de integración.'
      ]
    },
    {
      title: 'Aún no disponible',
      tone: 'pending',
      icon: 'pi pi-clock',
      items: [
        'Esperas humanas o procesos pausados durante días.',
        'Código libre o scripts personalizados dentro del flow.',
        'Importar o exportar diagramas BPMN.',
        'Transacciones distribuidas; se usa idempotencia y compensación.',
        'Bucles while arbitrarios; hoy se recorren listas con Para cada.'
      ]
    }
  ];
  viewingTrash = false;
  entryMode: FlowEntryMode = 'direct';
  entryKey = 'direct';
  authoringDefinitionText = '';
  authoringDefinitionError = '';
  applyingDefinition = false;
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
  triggers: FlowTriggerItem[] = [];
  triggerDraft: FlowTriggerDraft = this.emptyTriggerDraft();
  flowJobs: FlowJobItem[] = [];
  lastLiveEvent?: FlowLiveEvent;
  savingTrigger = false;
  flowInputs: FlowInputField[] = [];
  stepBaseline = '';
  flowDraft: FlowDraft = this.emptyFlowDraft();
  stepDraft: StepDraft = this.emptyStepDraft();

  get selectedFlow() {
    return this.flows.find((flow) => flow.id === this.selectedFlowId);
  }

  get selectedTemplate() {
    return this.flowTemplates.find((template) => template.id === this.selectedTemplateId);
  }

  get starterStepCount() {
    return this.starterSteps().length;
  }

  get flowPurposeReady() {
    return (
      this.flowDraft.name.trim().length >= 3 &&
      this.flowDraft.description.trim().length >= 3 &&
      /^[a-z][a-z0-9_]{2,119}$/.test(this.flowDraft.key)
    );
  }

  get flowEntryReady() {
    return this.entryMode === 'direct' || /^[a-z0-9_.-]{3,120}$/.test(this.entryKey.trim());
  }

  get flowInputsReady() {
    const keys = this.flowInputs.map((field) => field.key.trim()).filter(Boolean);
    return (
      keys.length === this.flowInputs.length &&
      keys.every((key) => /^[a-z][a-z0-9_]{1,79}$/.test(key)) &&
      new Set(keys).size === keys.length
    );
  }

  get authoringJsonReady() {
    try {
      this.readAuthoringDocument();
      return true;
    } catch {
      return false;
    }
  }

  get authoringJsonValidationError() {
    try {
      this.readAuthoringDocument();
      return '';
    } catch (error) {
      return error instanceof Error ? error.message : 'El JSON del flow no es válido.';
    }
  }

  get stepJsonReady() {
    try {
      const config = JSON.parse(this.stepDraft.configText || '{}');
      const inputMap = JSON.parse(this.stepDraft.inputMapText || '{}');
      return (
        Boolean(config) &&
        typeof config === 'object' &&
        !Array.isArray(config) &&
        Boolean(inputMap) &&
        typeof inputMap === 'object' &&
        !Array.isArray(inputMap)
      );
    } catch {
      return false;
    }
  }

  get flowProcessSteps(): ProcessStepItem[] {
    return this.stages.map((stage) => ({
      ...stage,
      summary: this.flowStageSummary(stage.key),
      state: stage.key === this.activeStage ? 'active' : this.isStageDone(stage.key) ? 'complete' : 'pending',
      disabled: !this.selectedFlow && stage.key !== 'describe'
    }));
  }

  get flowTestSteps(): ProcessStepItem[] {
    const previewStatus = this.lastPreview?.status;
    return [
      {
        key: 'input',
        label: 'Preparar entrada',
        summary: this.flowInputs.length ? `${this.flowInputs.length} datos definidos` : 'Sin datos obligatorios',
        state: 'complete'
      },
      {
        key: 'execute',
        label: 'Ejecutar borrador',
        summary: previewStatus ? 'Prueba ejecutada' : 'Prueba pendiente',
        state: previewStatus ? 'complete' : 'active'
      },
      {
        key: 'review',
        label: 'Revisar resultado',
        summary:
          previewStatus === 'success'
            ? 'Todos los pasos respondieron'
            : previewStatus === 'failed'
              ? 'Hay un paso por corregir'
              : 'Aún no hay resultado',
        state: previewStatus === 'success' ? 'complete' : previewStatus === 'failed' ? 'warning' : 'pending'
      }
    ];
  }

  get stepEditorSteps(): ProcessStepItem[] {
    const usesDataMap = this.stepUsesDataMap;
    return [
      {
        key: 'purpose',
        label: 'Propósito',
        summary: this.stepPurposeReady ? 'Nombre y tipo listos' : 'Qué debe hacer',
        state: this.stepEditorState('purpose', this.stepPurposeReady)
      },
      {
        key: 'configure',
        label: 'Configurar',
        summary: this.stepConfigurationReady ? 'Operación completa' : 'Datos de la operación',
        state: this.stepEditorState('configure', this.stepConfigurationReady)
      },
      {
        key: 'data',
        label: 'Conectar datos',
        summary: usesDataMap ? (this.stepDataReady ? 'Entradas conectadas' : 'Origen de entradas') : 'No requerido',
        state: usesDataMap ? this.stepEditorState('data', this.stepDataReady) : 'complete',
        disabled: !usesDataMap
      },
      {
        key: 'route',
        label: 'Continuación',
        summary: this.stepRouteReady ? 'Rutas definidas' : 'Qué ocurre después',
        state: this.stepEditorState('route', this.stepRouteReady)
      },
      {
        key: 'save',
        label: 'Guardar y probar',
        summary: this.stepDraft.id && !this.stepHasChanges ? 'Paso guardado' : 'Revisar cambios',
        state: this.stepEditorState('save', Boolean(this.stepDraft.id && !this.stepHasChanges))
      }
    ];
  }

  get stepEditorGuide(): FlowGuideState & { actionLabel: string } {
    if (this.stepEditorPhase === 'purpose') {
      return {
        stepLabel: 'Paso 1 de 5',
        title: 'Elige qué debe ocurrir',
        description: 'Selecciona el tipo de bloque y dale un nombre que cualquier persona pueda reconocer.',
        tone: this.stepPurposeReady ? 'success' : 'info',
        actionLabel: 'Configurar operación'
      };
    }
    if (this.stepEditorPhase === 'configure') {
      return {
        stepLabel: 'Paso 2 de 5',
        title: `Configura: ${this.stepTypeLabel(this.stepDraft.type)}`,
        description: this.stepConfigurationReady
          ? 'La operación tiene sus datos mínimos. Continúa con las entradas y rutas.'
          : this.stepDraftIssues[0] || 'Completa los campos visibles para esta operación.',
        tone: this.stepConfigurationReady ? 'success' : 'warning',
        actionLabel: this.stepUsesDataMap ? 'Conectar datos' : 'Definir continuación'
      };
    }
    if (this.stepEditorPhase === 'data') {
      return {
        stepLabel: 'Paso 3 de 5',
        title: 'Conecta las entradas sin escribir expresiones',
        description: this.stepDataReady
          ? 'Cada entrada requerida ya tiene un origen.'
          : 'Elige datos del formulario, del tenant, del usuario o de resultados anteriores.',
        tone: this.stepDataReady ? 'success' : 'warning',
        actionLabel: 'Definir continuación'
      };
    }
    if (this.stepEditorPhase === 'route') {
      return {
        stepLabel: 'Paso 4 de 5',
        title: 'Decide qué activa este resultado',
        description: this.currentConnectionSummary,
        tone: this.stepRouteReady ? 'success' : 'warning',
        actionLabel: 'Revisar y guardar'
      };
    }
    return {
      stepLabel: 'Paso 5 de 5',
      title: this.stepDraftIssues.length ? 'Corrige los puntos pendientes' : 'El paso está listo para probar',
      description:
        this.stepDraftIssues[0] || 'Guarda el bloque y ejecútalo aislado antes de continuar con el recorrido.',
      tone: this.stepDraftIssues.length ? 'warning' : 'success',
      actionLabel: this.stepDraft.id && !this.stepHasChanges ? 'Probar paso' : 'Guardar paso'
    };
  }

  get stepUsesDataMap() {
    return this.stepDraft.type === 'dynamic_service' || this.stepDraft.type === 'action';
  }

  get stepPurposeReady() {
    return (
      this.stepDraft.name.trim().length >= 3 &&
      /^[a-z][a-z0-9_]{2,119}$/.test(this.stepDraft.key) &&
      Boolean(this.stepDraft.type)
    );
  }

  get stepConfigurationReady() {
    const draft = this.stepDraft;
    switch (draft.type) {
      case 'dynamic_service':
        return Boolean(draft.serviceKey);
      case 'parallel':
        return (
          draft.parallelBranches.length >= 2 &&
          draft.parallelBranches.every((branch) => Boolean(branch.key.trim() && branch.serviceKey))
        );
      case 'foreach':
        return Boolean(draft.foreachItemsPath.trim() && draft.foreachServiceKey);
      case 'subflow':
        return Boolean(draft.subflowKey);
      case 'emit_event':
        return /^[a-z0-9_.-]{3,120}$/.test(draft.eventKey.trim());
      case 'decision':
        return Boolean(draft.decisionLeft.trim() && draft.decisionRight.trim());
      case 'formula':
        return Boolean(draft.formulaLeft.trim() && draft.formulaRight.trim());
      case 'validation':
        return Boolean(draft.validationField.trim());
      default:
        return true;
    }
  }

  get stepConfigurationExample() {
    const examples: Record<FlowStepType, string> = {
      start: 'Recibir los datos iniciales.',
      dynamic_service: 'Consultar cliente con timeout de 8 segundos.',
      parallel: 'Consultar inventario y precios al mismo tiempo.',
      foreach: 'Enviar una notificación por cada asistente.',
      subflow: 'Reutilizar el flow validar_pago.',
      delay: 'Esperar 1000 ms antes de reintentar.',
      emit_event: 'Emitir pedido.aprobado con el resultado.',
      formula: 'Multiplicar subtotal por 1.19.',
      validation: 'Comprobar que input.email sea un correo válido.',
      decision: 'Si input.total es mayor a 100, solicitar aprobación.',
      action: 'Crear un record con los datos recibidos.',
      response: 'Devolver ok y el resultado al front.',
      end: 'Finalizar el proceso.'
    };
    return examples[this.stepDraft.type];
  }

  get stepDataReady() {
    if (!this.stepUsesDataMap) {
      return true;
    }
    if (this.stepDraft.type !== 'dynamic_service') {
      return this.stepDraft.inputRows.every((row) => Boolean(row.key.trim() && row.value));
    }
    return this.selectedServiceInputKeys.every((key) => {
      const row = this.stepDraft.inputRows.find((item) => item.key === key);
      return Boolean(row?.value && row.value !== '__manual__');
    });
  }

  get stepRouteReady() {
    if (this.stepDraft.type !== 'decision') {
      return true;
    }
    return Boolean(
      this.stepDraft.onTrueStepKey &&
      this.stepDraft.onFalseStepKey &&
      this.stepDraft.onTrueStepKey !== this.stepDraft.onFalseStepKey
    );
  }

  get currentGuide(): FlowGuideState {
    const flow = this.selectedFlow;
    if (!flow) {
      return {
        stepLabel: 'Inicio',
        title: 'Elige una plantilla y describe el resultado que necesitas',
        description: 'El asistente creará un recorrido inicial. Después podrás probar cada paso antes de publicar.',
        tone: 'info'
      };
    }
    if (this.activeStage === 'describe') {
      return {
        stepLabel: 'Etapa 1 de 4',
        title: 'Define qué recibe y qué debe resolver el flow',
        description: 'Guarda un nombre entendible y los datos de entrada. Todavía no ejecutamos ninguna operación.',
        tone: this.isStageDone('describe') ? 'success' : 'info',
        actionLabel: 'Guardar y construir'
      };
    }
    if (this.activeStage === 'build') {
      if (this.designerIssues.length) {
        return {
          stepLabel: 'Etapa 2 de 4',
          title: 'Completa el recorrido antes de probar',
          description: this.designerIssues[0],
          tone: 'warning'
        };
      }
      return {
        stepLabel: 'Etapa 2 de 4',
        title: `Recorrido listo con ${flow.steps.length} pasos`,
        description:
          'El mapa indica qué activa cada paso. Ahora ejecútalo con datos de ejemplo para comprobar el resultado.',
        tone: 'success',
        actionLabel: 'Ir a probar'
      };
    }
    if (this.activeStage === 'test') {
      if (this.lastPreview?.status === 'success') {
        return {
          stepLabel: 'Etapa 3 de 4',
          title: 'El borrador respondió correctamente',
          description:
            'Revisa las entradas y salidas observadas. Puedes guardar escenarios repetibles o continuar a publicación.',
          tone: 'success',
          actionLabel: 'Continuar a publicar'
        };
      }
      if (this.lastPreview?.status === 'failed') {
        return {
          stepLabel: 'Etapa 3 de 4',
          title: 'La prueba encontró un paso por corregir',
          description: this.previewErrorMessage,
          tone: 'warning',
          actionLabel: 'Corregir paso'
        };
      }
      return {
        stepLabel: 'Etapa 3 de 4',
        title: 'Prueba el borrador antes de crear una versión',
        description:
          'Completa los datos como lo haría una pantalla real y ejecuta todo el proceso o solo hasta un paso.',
        tone: 'info',
        actionLabel: 'Ejecutar prueba'
      };
    }
    if (flow.publishedVersion) {
      return {
        stepLabel: 'Etapa 4 de 4',
        title: `Versión ${flow.publishedVersion.version} activa`,
        description: 'El flow ya puede ser llamado por su key, por un activador o desde una pantalla dinámica.',
        tone: 'success'
      };
    }
    return {
      stepLabel: 'Etapa 4 de 4',
      title: 'Congela el borrador y publícalo',
      description: 'Crear versión guarda una fotografía inmutable. Publicar la convierte en la versión ejecutable.',
      tone: 'info',
      actionLabel: flow.latestVersion ? 'Publicar última' : 'Crear versión'
    };
  }

  get publishedServices() {
    return this.services.filter((service) => service.active && service.publishedVersion);
  }

  get publishedSubflows() {
    return this.flows.filter(
      (flow) => flow.id !== this.selectedFlowId && flow.status === 'active' && flow.publishedVersion
    );
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
      {
        group: 'context',
        label: 'ID de la organización',
        value: '{{tenant.id}}'
      },
      {
        group: 'context',
        label: 'Slug de la organización',
        value: '{{tenant.slug}}'
      },
      {
        group: 'context',
        label: 'ID del usuario actual',
        value: '{{user.id}}'
      },
      {
        group: 'context',
        label: 'Correo del usuario actual',
        value: '{{user.email}}'
      }
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

    const validTargets = new Set(['start', 'end', ...flow.steps.map((step) => step.key)]);
    for (const step of flow.steps) {
      const targets = [
        step.nextStepKey,
        step.onTrueStepKey,
        step.onFalseStepKey,
        step.onErrorStepKey,
        step.onTimeoutStepKey
      ].filter((target): target is string => Boolean(target));
      const missingTarget = targets.find((target) => !validTargets.has(target));
      if (missingTarget) {
        issues.push(`El paso “${step.name}” apunta a “${missingTarget}”, pero ese destino ya no existe.`);
      }
      if (step.type === 'dynamic_service') {
        const serviceKey = this.asString((step.config ?? {})['serviceKey']);
        if (!this.publishedServices.some((service) => service.key === serviceKey)) {
          issues.push(`El paso “${step.name}” necesita un servicio activo y publicado.`);
        }
      }
      if (step.type === 'parallel') {
        const branches = Array.isArray((step.config ?? {})['branches'])
          ? ((step.config ?? {})['branches'] as unknown[])
          : [];
        if (branches.length < 2) {
          issues.push(`El paso paralelo “${step.name}” necesita al menos dos servicios.`);
        } else {
          const unavailable = branches
            .map((branch) => this.asString(this.asRecord(branch)['serviceKey']))
            .find((key) => !this.publishedServices.some((service) => service.key === key));
          if (unavailable !== undefined) {
            issues.push(`El paso paralelo “${step.name}” contiene un servicio sin publicar.`);
          }
        }
      }
      if (step.type === 'foreach') {
        const config = step.config ?? {};
        const serviceKey = this.asString(config['serviceKey']);
        if (!this.asString(config['itemsPath'])) {
          issues.push(`El paso “${step.name}” necesita la ruta de la lista que va a recorrer.`);
        }
        if (!this.publishedServices.some((service) => service.key === serviceKey)) {
          issues.push(`El paso “${step.name}” necesita un servicio publicado para cada elemento.`);
        }
      }
      if (step.type === 'subflow') {
        const flowKey = this.asString((step.config ?? {})['flowKey']);
        if (!this.publishedSubflows.some((candidate) => candidate.key === flowKey)) {
          issues.push(`El paso “${step.name}” necesita otro flow activo y publicado.`);
        }
      }
      if (step.type === 'emit_event' && !this.asString((step.config ?? {})['eventKey'])) {
        issues.push(`El paso “${step.name}” necesita el nombre del evento que va a emitir.`);
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
    const baseValid = this.flowDraft.name.trim().length >= 3 && /^[a-z][a-z0-9_]{2,119}$/.test(this.flowDraft.key);
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
      key ? (this.availableTargetSteps.find((step) => step.key === key)?.name ?? key) : fallback;
    if (this.stepDraft.type === 'decision') {
      return `Sí → ${targetName(this.stepDraft.onTrueStepKey, 'elige un destino')} · No → ${targetName(this.stepDraft.onFalseStepKey, 'elige otro destino')}`;
    }
    const success = targetName(this.stepDraft.nextStepKey, 'siguiente paso de la lista');
    if (this.stepDraft.type === 'dynamic_service') {
      const error = targetName(this.stepDraft.onErrorStepKey, 'detener con error');
      const timeout = targetName(
        this.stepDraft.onTimeoutStepKey,
        this.stepDraft.onErrorStepKey ? error : 'detener por timeout'
      );
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

  get canAudit() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasPermission('flows.audit');
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

  private flowStageSummary(stage: FlowStage) {
    const flow = this.selectedFlow;
    switch (stage) {
      case 'describe':
        return this.isStageDone(stage) ? `${this.flowInputs.length} datos de entrada` : 'Propósito y entradas';
      case 'build':
        return this.isStageDone(stage) ? `${flow?.steps.length ?? 0} pasos` : 'Agrega el recorrido';
      case 'test':
        return this.lastPreview?.status === 'success'
          ? 'Borrador verificado'
          : this.lastPreview?.status === 'failed'
            ? 'Necesita corrección'
            : 'Ejecuta con ejemplos';
      case 'publish':
        return flow?.publishedVersion ? `v${flow.publishedVersion.version} activa` : 'Crea y publica versión';
    }
  }

  private stepEditorState(phase: StepEditorPhase, complete: boolean): ProcessStepItem['state'] {
    if (phase === this.stepEditorPhase) {
      return 'active';
    }
    return complete ? 'complete' : 'pending';
  }

  ngOnInit() {
    this.flowLive.connect();
    this.liveSubscription = this.flowLive.events$.subscribe((event) => {
      this.lastLiveEvent = event;
      if (!event.flowId || event.flowId === this.selectedFlowId) {
        this.loadJobs();
        if (event.runId || event.type.startsWith('flow.run.') || event.type.startsWith('flow.step.')) {
          this.loadRuns();
        }
      }
    });
    this.loadServices();
    this.loadTemplates();
    this.load();
  }

  ngOnDestroy() {
    this.unregisterAssistantState();
    this.liveSubscription?.unsubscribe();
    this.flowLive.disconnect();
  }

  runtimeField(
    name: string,
    type: string,
    label: string,
    placeholder = '',
    options: Array<{ label: string; value: unknown }> = [],
    required = false
  ): RuntimeField {
    return {
      name,
      type,
      label,
      placeholder,
      options,
      required
    };
  }

  controlString(value: unknown) {
    return value === null || value === undefined ? '' : String(value);
  }

  controlBoolean(value: unknown) {
    return value === true || value === 'true' || value === '1' || value === 1;
  }

  toFlowEntryMode(value: unknown) {
    return this.flowEntryMode(value);
  }

  setStepTypeFromControl(value: unknown) {
    this.setStepType(this.controlString(value) as FlowStepType);
  }

  setTriggerTypeFromControl(value: unknown) {
    this.triggerDraft.type = this.controlString(value) as FlowTriggerType;
    this.onTriggerTypeChanged();
  }

  setObjectValue(target: object, key: string, value: unknown) {
    (target as Record<string, unknown>)[key] = value;
  }

  setObjectString(target: object, key: string, value: unknown) {
    this.setObjectValue(target, key, this.controlString(value));
  }

  setObjectBoolean(target: object, key: string, value: unknown) {
    this.setObjectValue(target, key, this.controlBoolean(value));
  }

  setObjectNumber(target: object, key: string, value: unknown, fallback = 0) {
    this.setObjectValue(target, key, this.asNumber(value, fallback));
  }

  get templateOptions() {
    return [
      { label: 'Usar el asistente desde cero', value: '' },
      ...this.flowTemplates.map((template) => ({
        label: `${template.name} · ${template.scope === 'system' ? 'Sistema' : 'Organización'}`,
        value: template.id
      }))
    ];
  }

  get entryModeSelectOptions() {
    return this.entryModeOptions.map((option) => ({
      label: option.label,
      value: option.value
    }));
  }

  get publishedServiceOptions() {
    return [
      { label: 'Selecciona un servicio', value: '' },
      ...this.publishedServices.map((service) => ({
        label: `${service.name} · ${service.key}`,
        value: service.key
      }))
    ];
  }

  get compensationServiceOptions() {
    return [
      { label: 'No ejecutar compensación', value: '' },
      ...this.publishedServices.map((service) => ({
        label: `${service.name} · ${service.key}`,
        value: service.key
      }))
    ];
  }

  get publishedSubflowOptions() {
    return [
      { label: 'Selecciona un flow', value: '' },
      ...this.publishedSubflows.map((flow) => ({
        label: `${flow.name} · ${flow.key}`,
        value: flow.key
      }))
    ];
  }

  get targetStepOptions() {
    return [
      { label: 'Siguiente paso de la lista', value: '' },
      ...this.availableTargetSteps.map((step) => ({
        label: step.name,
        value: step.key
      }))
    ];
  }

  get errorTargetStepOptions() {
    return [
      { label: 'Detener y mostrar el error', value: '' },
      ...this.availableTargetSteps.map((step) => ({
        label: step.name,
        value: step.key
      }))
    ];
  }

  get timeoutTargetStepOptions() {
    return [
      { label: 'Usar la ruta de error o detener', value: '' },
      ...this.availableTargetSteps.map((step) => ({
        label: step.name,
        value: step.key
      }))
    ];
  }

  get previewStepOptions() {
    return [
      { label: 'Todo el borrador', value: '' },
      ...(this.selectedFlow?.steps ?? []).map((step) => ({
        label: step.name,
        value: step.key
      }))
    ];
  }

  get testCaseStepOptions() {
    return [
      { label: 'Todo el proceso', value: '' },
      ...(this.selectedFlow?.steps ?? []).map((step) => ({
        label: step.name,
        value: step.key
      }))
    ];
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

  loadTemplates() {
    this.api.get<FlowTemplateItem[]>('flows/templates').subscribe({
      next: (templates) => {
        this.flowTemplates = templates;
      },
      error: () => {
        this.flowTemplates = [];
      }
    });
  }

  load(selectId = this.selectedFlowId) {
    this.loading = true;
    this.message = 'Cargando Flow Designer...';
    const endpoint = this.viewingTrash ? 'flows/trash' : 'flows';
    this.api.get<FlowItem[]>(endpoint).subscribe({
      next: (flows) => {
        this.loading = false;
        this.flows = flows;
        if (this.auth.state.isOwnerOrAdmin && !this.auth.state.hasPermission('flows.read')) {
          this.message =
            'Flow Designer listo. Ejecuta Seguridad -> Sincronizar seguridad para instalar permisos flows.* en este tenant.';
        } else {
          this.message = '';
        }
        const selected = flows.find((flow) => flow.id === selectId) ?? flows[0];
        if (selected) {
          this.selectFlow(selected, !selectId);
        } else if (this.viewingTrash) {
          this.selectedFlowId = '';
          this.message = '';
        } else {
          this.startNewFlow();
        }
      },
      error: () => {
        this.loading = false;
        this.flows = [];
        this.startNewFlow();
        this.message =
          'No se pudieron cargar los flows. Verifica que la API esté arriba, que la sesión siga activa y que Seguridad -> Sincronizar seguridad haya instalado flows.*.';
      }
    });
  }

  startNewFlow() {
    this.viewingTrash = false;
    this.selectedFlowId = '';
    this.activeStage = 'describe';
    this.stepEditorPhase = 'purpose';
    this.entryMode = 'direct';
    this.entryKey = 'direct';
    this.authoringDefinitionError = '';
    this.selectedTemplateId = '';
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
    this.triggers = [];
    this.flowJobs = [];
    this.flowVersions = [];
    this.compareVersionIds = ['', ''];
    this.versionComparison = undefined;
    this.observability = undefined;
    this.triggerDraft = this.emptyTriggerDraft();
    this.lastLiveEvent = undefined;
    this.refreshAuthoringDefinition();
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
    this.selectedTemplateId = '';
    this.duplicateDraft = {
      name: `${flow.name} copia`,
      key: `${flow.key}_copy`
    };
    this.templateDraft = {
      name: `${flow.name} reutilizable`,
      key: `${flow.key}_template`
    };
    this.compareVersionIds = ['', ''];
    this.versionComparison = undefined;
    this.observability = undefined;
    this.flowInputs = this.flowInputsFromMetadata(flow.metadata);
    const authoringEntry = this.asRecord(flow.metadata?.['authoringEntry']);
    this.entryMode = this.flowEntryMode(authoringEntry['mode']);
    this.entryKey = this.asString(authoringEntry['key']) || (this.entryMode === 'direct' ? 'direct' : flow.key);
    if (resetStage) {
      this.syncTestInputFromFields();
    }
    this.stepDraft = this.emptyStepDraft(
      flow.steps.length ? Math.max(...flow.steps.map((step) => step.position)) + 10 : 10
    );
    this.stepEditorPhase = 'purpose';
    this.captureStepBaseline();
    this.lastRun = undefined;
    this.lastPreview = undefined;
    this.previewThroughStepKey = '';
    this.loadRuns(flow.id);
    this.loadVersions(flow.id);
    this.loadObservability(flow.id);
    this.loadTestCases(flow.id);
    this.loadTriggers(flow.id);
    this.loadJobs(flow.id);
    this.refreshAuthoringDefinition();
  }

  onTemplateSelected() {
    const template = this.selectedTemplate;
    if (!template) {
      this.chooseStarter('validate');
      return;
    }
    const definition = this.asRecord(template.definition);
    const templateFlow = this.asRecord(definition['flow']);
    const entry = this.asRecord(definition['entry']);
    this.selectedStarter = 'blank';
    this.flowDraft = {
      key: this.slugify(template.name),
      name: template.name,
      description:
        this.asString(templateFlow['description']) || template.description || 'Proceso creado desde plantilla',
      category: this.asString(templateFlow['category']) || template.category || 'operaciones'
    };
    this.entryMode = this.flowEntryMode(entry['mode']);
    this.entryKey = this.asString(entry['key']) || (this.entryMode === 'direct' ? 'direct' : this.flowDraft.key);
    this.flowInputs = this.asArray(definition['inputFields']).map((rawField) => {
      const field = this.asRecord(rawField);
      const type = this.asString(field['type']);
      return {
        key: this.asString(field['key']),
        label: this.asString(field['label']),
        type: ['text', 'number', 'boolean', 'email', 'date'].includes(type) ? (type as FlowInputType) : 'text',
        required: field['required'] === true,
        example: field['example'] === undefined || field['example'] === null ? '' : String(field['example'])
      };
    });
    this.syncTestInputFromFields();
    this.authoringDefinitionText = JSON.stringify(
      {
        ...definition,
        flow: {
          ...templateFlow,
          ...this.flowDraft
        }
      },
      null,
      2
    );
  }

  createFromTemplate() {
    const template = this.selectedTemplate;
    if (!template) {
      this.createFlow();
      return;
    }
    this.creatingFlow = true;
    this.api
      .post<FlowItem>(`flows/templates/${template.id}/instantiate`, {
        key: this.flowDraft.key,
        name: this.flowDraft.name,
        description: this.flowDraft.description,
        category: this.flowDraft.category
      })
      .subscribe({
        next: (created) => {
          this.creatingFlow = false;
          this.message = `Flow creado desde la plantilla “${template.name}”.`;
          this.loadTemplates();
          this.load(created.id);
        },
        error: (error) => {
          this.creatingFlow = false;
          this.message =
            typeof error?.error?.message === 'string'
              ? error.error.message
              : 'No se pudo crear el flow desde la plantilla.';
        }
      });
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
        {
          key: 'email',
          label: 'Correo',
          type: 'email',
          required: true,
          example: 'persona@example.com'
        }
      ],
      service: [
        {
          key: 'email',
          label: 'Correo',
          type: 'email',
          required: true,
          example: 'persona@example.com'
        }
      ],
      multi_service: [
        {
          key: 'email',
          label: 'Correo',
          type: 'email',
          required: true,
          example: 'persona@example.com'
        }
      ],
      calculate: [
        {
          key: 'subtotal',
          label: 'Subtotal',
          type: 'number',
          required: true,
          example: '100'
        }
      ],
      blank: []
    };
    this.flowInputs = starterInputs[starter].map((field) => ({ ...field }));
    this.syncFlowKey(true);
    this.syncTestInputFromFields();
    this.refreshAuthoringDefinition();
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
    this.refreshAuthoringDefinition();
  }

  addStarterService() {
    this.starterServiceKeys = [...this.starterServiceKeys, ''];
    this.refreshAuthoringDefinition();
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
    this.refreshAuthoringDefinition();
  }

  removeFlowInput(index: number) {
    this.flowInputs = this.flowInputs.filter((_, fieldIndex) => fieldIndex !== index);
    this.syncTestInputFromFields();
    this.refreshAuthoringDefinition();
  }

  onFlowInputsChanged() {
    this.syncTestInputFromFields();
    this.refreshAuthoringDefinition();
  }

  onFlowIdentityChanged(syncKey = false) {
    if (syncKey) {
      this.syncFlowKey(true);
    }
    this.refreshAuthoringDefinition();
  }

  onEntryModeChanged() {
    const defaults: Record<FlowEntryMode, string> = {
      direct: 'direct',
      manual: 'ejecutar_manual',
      http: 'webhook_entrada',
      record_event: 'record.created',
      form_submit: 'form.submitted',
      schedule: 'ejecucion_programada'
    };
    this.entryKey = defaults[this.entryMode];
    this.refreshAuthoringDefinition();
  }

  refreshAuthoringDefinition() {
    this.authoringDefinitionError = '';
    this.authoringDefinitionText = JSON.stringify(this.authoringDocument(), null, 2);
  }

  applyAuthoringDefinition(save = false) {
    let document: FlowAuthoringDocument;
    try {
      document = this.readAuthoringDocument();
    } catch (error) {
      this.authoringDefinitionError = error instanceof Error ? error.message : 'El JSON del flow no es válido.';
      return;
    }
    this.flowDraft = { ...document.flow };
    this.entryMode = document.entry.mode;
    this.entryKey = document.entry.key;
    this.flowInputs = document.inputFields.map((field) => ({ ...field }));
    this.syncTestInputFromFields();
    this.authoringDefinitionError = '';

    if (!save || !this.selectedFlow) {
      this.message = 'JSON aplicado al asistente. Revisa el resumen y crea el flow.';
      this.authoringDefinitionText = JSON.stringify(document, null, 2);
      return;
    }

    this.applyingDefinition = true;
    this.api.put<FlowItem>(`flows/${this.selectedFlow.id}/definition`, document).subscribe({
      next: (updated) => {
        this.applyingDefinition = false;
        this.message = 'Definición JSON aplicada al borrador de forma atómica.';
        this.replaceFlow(updated);
        this.activeStage = 'build';
      },
      error: () => {
        this.applyingDefinition = false;
        this.authoringDefinitionError =
          'No se pudo aplicar la definición. Revisa claves, rutas y que la salida apunte a un paso response.';
      }
    });
  }

  saveFlowJsonOnly(publish: boolean) {
    let document: FlowAuthoringDocument;
    try {
      document = this.readAuthoringDocument();
    } catch (error) {
      this.authoringDefinitionError = error instanceof Error ? error.message : 'El JSON del flow no es válido.';
      return;
    }
    if (publish && !this.canPublish) {
      this.authoringDefinitionError = 'No tienes permisos para publicar flows.';
      return;
    }
    if (!publish && !this.canCreate && !this.canUpdate) {
      this.authoringDefinitionError = 'No tienes permisos para guardar flows.';
      return;
    }

    this.applyingDefinition = true;
    this.message = publish ? 'Guardando y publicando flow desde JSON...' : 'Guardando draft del flow desde JSON...';
    this.api
      .post<FlowAuthoringResponse>('flows/authoring/json', {
        document,
        publish
      })
      .subscribe({
        next: (response) => {
          const flow: FlowItem = {
            ...response.flow,
            latestVersion: response.version ?? response.flow.latestVersion ?? null,
            publishedVersion: response.published ? response.version ?? null : response.flow.publishedVersion ?? null
          };
          this.applyingDefinition = false;
          this.flows = this.flows.some((item) => item.id === flow.id)
            ? this.flows.map((item) => (item.id === flow.id ? flow : item))
            : [flow, ...this.flows];
          this.selectFlow(flow, false);
          this.authoringDefinitionText = JSON.stringify(document, null, 2);
          this.authoringDefinitionError = '';
          this.activeStage = publish ? 'test' : 'build';
          this.message = publish ? `Flow ${response.key} guardado y publicado.` : `Flow ${response.key} guardado como draft.`;
          this.loadVersions(flow.id);
        },
        error: () => {
          this.applyingDefinition = false;
          this.authoringDefinitionError =
            publish
              ? 'No se pudo guardar y publicar desde JSON. Revisa pasos, rutas y salida.'
              : 'No se pudo guardar el draft desde JSON. Revisa pasos, rutas y salida.';
        }
      });
  }

  get selectedEntrySummary() {
    return this.entryModeOptions.find((option) => option.value === this.entryMode)?.summary ?? '';
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
    let definition: FlowAuthoringDocument;
    try {
      definition = this.readAuthoringDocument();
    } catch (error) {
      this.authoringDefinitionError = error instanceof Error ? error.message : 'El JSON del flow no es válido.';
      return;
    }
    this.creatingFlow = true;
    this.message = 'Creando el proceso y sus pasos iniciales...';
    let flow: FlowItem | undefined;
    try {
      flow = await firstValueFrom(
        this.api.post<FlowItem>('flows', {
          ...definition.flow,
          metadata: {
            inputFields: definition.inputFields,
            authoringEntry: definition.entry,
            authoringOutput: definition.output
          }
        })
      );
      const updated = await firstValueFrom(this.api.put<FlowItem>(`flows/${flow.id}/definition`, definition));
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

  goToStage(value: FlowStage | string) {
    if (!this.stages.some((stage) => stage.key === value)) {
      return;
    }
    const stage = value as FlowStage;
    if (this.activeStage === 'describe' && stage !== 'describe') {
      this.saveFlow(stage);
      return;
    }
    this.activeStage = stage;
    if (stage === 'build' && !this.stepDraft.id && this.selectedFlow?.steps.length) {
      this.selectStep(this.selectedFlow.steps[0]);
    }
  }

  setBuildView(value: string) {
    if (value === 'graph' || value === 'list') {
      this.buildView = value;
    }
  }

  goToStepEditorPhase(value: StepEditorPhase | string) {
    if (!['purpose', 'configure', 'data', 'route', 'save'].includes(value)) {
      return;
    }
    if (value === 'data' && !this.stepUsesDataMap) {
      value = 'route';
    }
    this.stepEditorPhase = value as StepEditorPhase;
    queueMicrotask(() => {
      document.getElementById(`flow-step-${this.stepEditorPhase}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  advanceStepEditor() {
    switch (this.stepEditorPhase) {
      case 'purpose':
        this.goToStepEditorPhase('configure');
        break;
      case 'configure':
        this.goToStepEditorPhase(this.stepUsesDataMap ? 'data' : 'route');
        break;
      case 'data':
        this.goToStepEditorPhase('route');
        break;
      case 'route':
        this.goToStepEditorPhase('save');
        break;
      case 'save':
        if (this.stepDraft.id && !this.stepHasChanges) {
          this.previewThroughStepKey = this.stepDraft.key;
          this.activeStage = 'test';
          this.previewFlow();
        } else {
          this.saveStep('stay');
        }
        break;
    }
  }

  runGuideAction() {
    switch (this.activeStage) {
      case 'describe':
        this.saveFlow('build');
        break;
      case 'build':
        this.goToStage('test');
        break;
      case 'test':
        if (this.lastPreview?.status === 'success') {
          this.goToStage('publish');
        } else if (this.lastPreview?.status === 'failed') {
          this.editFailedPreviewStep();
        } else {
          this.previewFlow();
        }
        break;
      case 'publish':
        if (this.selectedFlow?.latestVersion) {
          this.publishLatest();
        } else {
          this.createVersion();
        }
        break;
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
        this.selectedFlowId = '';
        this.load('');
      },
      error: () => {
        this.message = 'No se pudo enviar a papelera.';
      }
    });
  }

  toggleTrash() {
    this.viewingTrash = !this.viewingTrash;
    this.selectedFlowId = '';
    this.message = '';
    this.load('');
  }

  restoreFlow(overwrite = false) {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api.post<FlowItem>(`flows/${flow.id}/restore`, { overwrite }).subscribe({
      next: (restored) => {
        this.viewingTrash = false;
        this.message = 'Flow restaurado.';
        this.load(restored.id);
      },
      error: (error) => {
        if (!overwrite && this.isRestoreConflict(error)) {
          const accepted = window.confirm(
            'Ya existe un flow activo con esa key. ¿Quieres enviar el activo a papelera y restaurar este flow?'
          );
          if (accepted) {
            this.restoreFlow(true);
            return;
          }
        }
        this.message = this.restoreErrorMessage(error);
      }
    });
  }

  private isRestoreConflict(error: unknown) {
    const response = error as { status?: number; error?: { message?: string | string[] }; message?: string };
    const message = response.error?.message ?? response.message ?? '';
    const text = Array.isArray(message) ? message.join(', ') : message;
    return response.status === 409 || text.includes('Confirm overwrite');
  }

  private restoreErrorMessage(error: unknown) {
    const response = error as { error?: { message?: string | string[] }; message?: string };
    const message = response.error?.message ?? response.message;
    const text = Array.isArray(message) ? message.join(', ') : message;
    return text || 'No se pudo restaurar el flow.';
  }

  startNewStep() {
    const flow = this.selectedFlow;
    this.stepDraft = this.emptyStepDraft(
      flow?.steps.length ? Math.max(...flow.steps.map((step) => step.position)) + 10 : 10
    );
    this.stepEditorPhase = 'purpose';
    this.captureStepBaseline();
  }

  startNewStepAfter(step: FlowTimelineStep | null) {
    const steps = this.selectedFlow?.steps ?? [];
    if (!step) {
      const firstPosition = steps[0]?.position ?? 10;
      this.stepDraft = this.emptyStepDraft(Math.max(0, Math.floor(firstPosition / 2)));
      this.stepEditorPhase = 'purpose';
      this.captureStepBaseline();
      return;
    }
    const currentIndex = steps.findIndex((item) => item.id === step.id);
    const nextPosition = steps[currentIndex + 1]?.position;
    const position =
      nextPosition && nextPosition - step.position > 1 ? Math.floor((step.position + nextPosition) / 2) : step.position;
    this.stepDraft = this.emptyStepDraft(position);
    this.stepEditorPhase = 'purpose';
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
    this.stepEditorPhase = 'purpose';
    this.captureStepBaseline();
  }

  setStepType(type: FlowStepType) {
    this.stepDraft.type = type;
    this.onStepTypeChange();
    this.stepEditorPhase = 'configure';
  }

  onStepTypeChange() {
    const labels: Record<FlowStepType, string> = {
      start: 'Inicio',
      dynamic_service: 'Ejecutar servicio',
      parallel: 'Ejecutar en paralelo',
      foreach: 'Procesar cada elemento',
      subflow: 'Ejecutar otro flow',
      delay: 'Esperar',
      emit_event: 'Emitir evento',
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

  addParallelBranch() {
    const index = this.stepDraft.parallelBranches.length + 1;
    this.stepDraft.parallelBranches = [...this.stepDraft.parallelBranches, { key: `rama_${index}`, serviceKey: '' }];
    this.syncGuidedStepJson();
  }

  removeParallelBranch(index: number) {
    if (this.stepDraft.parallelBranches.length <= 2) {
      return;
    }
    this.stepDraft.parallelBranches = this.stepDraft.parallelBranches.filter((_, branchIndex) => branchIndex !== index);
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
      return (
        current ?? {
          key,
          value: this.suggestSourceForInput(key)
        }
      );
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
      parallel: 'En paralelo',
      foreach: 'Por cada elemento',
      subflow: 'Otro flow',
      delay: 'Espera',
      emit_event: 'Evento',
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
      parallel: 'Ejecuta varios servicios simultáneamente.',
      foreach: 'Repite un servicio para todos los elementos de una lista.',
      subflow: 'Reutiliza un flow publicado dentro del actual.',
      delay: 'Pausa brevemente antes de continuar.',
      emit_event: 'Publica un hecho durable para otros procesos.',
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

  loadVersions(flowId = this.selectedFlowId) {
    if (!flowId) {
      this.flowVersions = [];
      return;
    }
    this.api.get<FlowVersion[]>(`flows/${flowId}/versions`).subscribe({
      next: (versions) => {
        this.flowVersions = versions;
      },
      error: () => {
        this.flowVersions = [];
      }
    });
  }

  selectVersionForComparison(versionId: string) {
    if (!this.compareVersionIds[0] || this.compareVersionIds[1]) {
      this.compareVersionIds = [versionId, ''];
      this.versionComparison = undefined;
      return;
    }
    if (this.compareVersionIds[0] === versionId) {
      return;
    }
    this.compareVersionIds = [this.compareVersionIds[0], versionId];
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api
      .get<FlowVersionComparison>(
        `flows/${flow.id}/versions/${this.compareVersionIds[0]}/compare/${this.compareVersionIds[1]}`
      )
      .subscribe({
        next: (comparison) => {
          this.versionComparison = comparison;
        },
        error: () => {
          this.message = 'No se pudieron comparar las versiones seleccionadas.';
        }
      });
  }

  versionLabel(versionId: string) {
    if (!versionId) {
      return 'pendiente';
    }
    const version = this.flowVersions.find((item) => item.id === versionId);
    return version ? `v${version.version}` : 'versión';
  }

  restoreVersionDraft(version: FlowVersion) {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api.post<FlowItem>(`flows/${flow.id}/versions/${version.id}/restore-draft`, {}).subscribe({
      next: () => {
        this.message = `Versión ${version.version} restaurada como borrador. La versión publicada sigue activa.`;
        this.load(flow.id);
      },
      error: () => {
        this.message = 'No se pudo restaurar la versión como borrador.';
      }
    });
  }

  duplicateFlow() {
    const flow = this.selectedFlow;
    if (!flow || !this.duplicateDraft.key.trim() || !this.duplicateDraft.name.trim()) {
      this.message = 'Escribe nombre y key para la copia.';
      return;
    }
    this.api
      .post<FlowItem>(`flows/${flow.id}/duplicate`, {
        key: this.duplicateDraft.key,
        name: this.duplicateDraft.name
      })
      .subscribe({
        next: (created) => {
          this.message = 'Flow duplicado como un borrador independiente.';
          this.load(created.id);
        },
        error: () => {
          this.message = 'No se pudo duplicar. Revisa que la key no exista.';
        }
      });
  }

  saveFlowTemplate() {
    const flow = this.selectedFlow;
    if (!flow || !this.templateDraft.key.trim() || !this.templateDraft.name.trim()) {
      this.message = 'Escribe nombre y key para la plantilla.';
      return;
    }
    this.api
      .post<FlowTemplateItem>(`flows/${flow.id}/templates`, {
        key: this.templateDraft.key,
        name: this.templateDraft.name,
        description: flow.description,
        category: flow.category
      })
      .subscribe({
        next: () => {
          this.message = 'Plantilla guardada para reutilizarla en nuevos flows.';
          this.loadTemplates();
        },
        error: () => {
          this.message = 'No se pudo guardar la plantilla. Revisa que la key no exista.';
        }
      });
  }

  loadObservability(flowId = this.selectedFlowId) {
    if (!flowId || !this.canAudit) {
      this.observability = undefined;
      return;
    }
    const query = this.observabilityStatus ? `?status=${encodeURIComponent(this.observabilityStatus)}` : '';
    this.api.get<FlowObservability>(`flows/${flowId}/observability${query}`).subscribe({
      next: (observability) => {
        this.observability = observability;
      },
      error: () => {
        this.observability = undefined;
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
      ? this.api.patch<FlowTestCaseItem>(`flows/${flow.id}/test-cases/${this.testCaseDraft.id}`, payload)
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
    this.api.post<FlowTestResult>(`flows/${flow.id}/test-cases/${this.testCaseDraft.id}/run`, {}).subscribe({
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
      .delete<{
        ok: true;
      }>(`flows/${flow.id}/test-cases/${this.testCaseDraft.id}`)
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

  loadTriggers(flowId = this.selectedFlowId, selectId = this.triggerDraft.id) {
    if (!flowId) {
      this.triggers = [];
      return;
    }
    this.api.get<FlowTriggerItem[]>(`flows/${flowId}/triggers`).subscribe({
      next: (triggers) => {
        this.triggers = triggers;
        if (triggers[0]) {
          this.entryMode = triggers[0].type;
          this.entryKey = triggers[0].key;
          this.refreshAuthoringDefinition();
        }
        const selected = triggers.find((trigger) => trigger.id === selectId);
        if (selected) {
          this.selectTrigger(selected);
        }
      },
      error: () => {
        this.triggers = [];
      }
    });
  }

  startNewTrigger() {
    this.triggerDraft = this.emptyTriggerDraft();
  }

  selectTrigger(trigger: FlowTriggerItem) {
    const config = trigger.config ?? {};
    this.triggerDraft = {
      id: trigger.id,
      type: trigger.type,
      key: trigger.key,
      secret: '',
      intervalSeconds: this.asNumber(config['intervalSeconds'], 60),
      inputMode: config['inputMode'] === 'envelope' ? 'envelope' : 'payload',
      inputText: JSON.stringify(config['input'] ?? {}, null, 2),
      active: trigger.active
    };
  }

  onTriggerTypeChanged() {
    if (!this.triggerDraft.id) {
      const defaults: Record<FlowTriggerType, string> = {
        manual: 'ejecutar_manual',
        http: 'webhook_entrada',
        record_event: 'record.created',
        form_submit: 'form.submitted',
        schedule: 'ejecucion_programada'
      };
      this.triggerDraft.key = defaults[this.triggerDraft.type];
    }
  }

  saveTrigger() {
    const flow = this.selectedFlow;
    if (!flow || this.triggerDraft.key.trim().length < 3) {
      this.message = 'Escribe una clave válida para el activador.';
      return;
    }
    if (
      this.triggerDraft.type === 'http' &&
      ((!this.triggerDraft.id && !this.triggerDraft.secret) ||
        Boolean(this.triggerDraft.secret && this.triggerDraft.secret.length < 16))
    ) {
      this.message = 'Define un secreto de al menos 16 caracteres para proteger el webhook.';
      return;
    }
    let input: Record<string, unknown> = {};
    if (this.triggerDraft.type === 'schedule') {
      try {
        input = this.parseJson(this.triggerDraft.inputText);
      } catch {
        this.message = 'La entrada programada debe ser un JSON válido.';
        return;
      }
    }
    const config: Record<string, unknown> = {
      inputMode: this.triggerDraft.inputMode
    };
    if (this.triggerDraft.type === 'http' && this.triggerDraft.secret) {
      config['secret'] = this.triggerDraft.secret;
    }
    if (this.triggerDraft.type === 'schedule') {
      config['intervalSeconds'] = Number(this.triggerDraft.intervalSeconds);
      config['input'] = input;
    }
    this.savingTrigger = true;
    const payload = {
      type: this.triggerDraft.type,
      key: this.triggerDraft.key,
      config,
      active: this.triggerDraft.active
    };
    const request = this.triggerDraft.id
      ? this.api.patch<FlowTriggerItem>(`flows/${flow.id}/triggers/${this.triggerDraft.id}`, payload)
      : this.api.post<FlowTriggerItem>(`flows/${flow.id}/triggers`, payload);
    request.subscribe({
      next: (trigger) => {
        this.savingTrigger = false;
        this.message = this.triggerDraft.id ? 'Activador actualizado.' : 'Activador creado.';
        this.loadTriggers(flow.id, trigger.id);
      },
      error: () => {
        this.savingTrigger = false;
        this.message = 'No se pudo guardar el activador.';
      }
    });
  }

  deleteTrigger() {
    const flow = this.selectedFlow;
    if (!flow || !this.triggerDraft.id) {
      return;
    }
    this.savingTrigger = true;
    this.api.delete<{ ok: true }>(`flows/${flow.id}/triggers/${this.triggerDraft.id}`).subscribe({
      next: () => {
        this.savingTrigger = false;
        this.message = 'Activador eliminado.';
        this.startNewTrigger();
        this.loadTriggers(flow.id, '');
      },
      error: () => {
        this.savingTrigger = false;
        this.message = 'No se pudo eliminar el activador.';
      }
    });
  }

  fireManualTrigger() {
    if (!this.triggerDraft.id || this.triggerDraft.type !== 'manual') {
      return;
    }
    let input: Record<string, unknown>;
    try {
      input = this.parseJson(this.testInputText);
    } catch {
      this.message = 'Los datos de prueba no son un JSON válido.';
      return;
    }
    this.savingTrigger = true;
    this.api
      .post<FlowJobItem>(`flows/triggers/manual/${this.triggerDraft.key}/fire`, {
        input,
        idempotencyKey: `ui:${Date.now()}`
      })
      .subscribe({
        next: (job) => {
          this.savingTrigger = false;
          this.message = 'Activador disparado. El job ya está en la cola.';
          this.flowJobs = [job, ...this.flowJobs.filter((item) => item.id !== job.id)];
        },
        error: () => {
          this.savingTrigger = false;
          this.message = 'No se pudo disparar el activador.';
        }
      });
  }

  loadJobs(flowId = this.selectedFlowId) {
    if (!flowId) {
      this.flowJobs = [];
      return;
    }
    this.api.get<FlowJobItem[]>(`flows/${flowId}/jobs`).subscribe({
      next: (jobs) => {
        this.flowJobs = jobs;
      },
      error: () => {
        this.flowJobs = [];
      }
    });
  }

  enqueueFlow() {
    const flow = this.selectedFlow;
    if (!flow?.publishedVersion) {
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
    this.api
      .post<FlowJobItem>(`flows/${flow.id}/enqueue`, {
        input,
        triggerType: 'manual',
        triggerKey: 'designer',
        idempotencyKey: `designer:${Date.now()}`
      })
      .subscribe({
        next: (job) => {
          this.executing = false;
          this.message = 'Ejecución encolada. El estado se actualizará en vivo.';
          this.flowJobs = [job, ...this.flowJobs.filter((item) => item.id !== job.id)];
        },
        error: () => {
          this.executing = false;
          this.message = 'No se pudo encolar el flow.';
        }
      });
  }

  cancelJob(job: FlowJobItem) {
    this.api.post<FlowJobItem>(`flows/jobs/${job.id}/cancel`, {}).subscribe({
      next: () => this.loadJobs(),
      error: () => {
        this.message = 'El job ya no puede cancelarse.';
      }
    });
  }

  retryJob(job: FlowJobItem) {
    this.api.post<FlowJobItem>(`flows/jobs/${job.id}/retry`, {}).subscribe({
      next: () => this.loadJobs(),
      error: () => {
        this.message = 'El job no puede reintentarse en su estado actual.';
      }
    });
  }

  triggerTypeLabel(type: FlowTriggerType) {
    const labels: Record<FlowTriggerType, string> = {
      manual: 'Manual',
      http: 'Webhook HTTP',
      record_event: 'Evento de record',
      form_submit: 'Envío de formulario',
      schedule: 'Programado'
    };
    return labels[type];
  }

  webhookUrl(triggerKey: string) {
    const tenantSlug = this.auth.state.session()?.tenant.slug ?? 'tenant';
    const apiUrl = new URL(environment.apiUrl, window.location.origin);
    const apiPath = apiUrl.pathname.replace(/\/+$/, '');
    return `${apiUrl.origin}${apiPath}/flow-hooks/${tenantSlug}/${triggerKey}`;
  }

  liveEventLabel(event: FlowLiveEvent) {
    const labels: Record<string, string> = {
      'flow.job.queued': 'Job agregado a la cola.',
      'flow.job.running': 'El worker inició la ejecución.',
      'flow.job.retrying': 'La ejecución falló y será reintentada.',
      'flow.job.success': 'La ejecución terminó correctamente.',
      'flow.job.failed': 'La ejecución agotó sus reintentos.',
      'flow.job.cancelled': 'El job fue cancelado.',
      'flow.event.published': 'El outbox publicó un evento a sus activadores.'
    };
    if (event.type.startsWith('flow.step.')) {
      const stepName = typeof event.data?.['stepName'] === 'string' ? event.data['stepName'] : 'Paso';
      const status = event.type.slice('flow.step.'.length);
      return `${stepName}: ${status}.`;
    }
    if (event.type.startsWith('flow.run.')) {
      return `Ejecución: ${event.type.slice('flow.run.'.length)}.`;
    }
    return labels[event.type] ?? event.type;
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
    this.api
      .post<FlowRunItem>(`flows/${flow.id}/execute`, {
        input,
        triggerType: 'test'
      })
      .subscribe({
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
      this.message =
        'Resultado conservado. El siguiente paso puede elegir sus campos desde “Resultados de pasos anteriores”.';
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

  private applyAssistantFlowProposal(action: ApplyFlowJsonAction) {
    this.selectedFlowId = '';
    this.selectedTemplateId = '';
    this.flowRuns = [];
    this.flowVersions = [];
    this.lastRun = undefined;
    this.lastPreview = undefined;
    this.authoringDefinitionText = JSON.stringify(action.document, null, 2);
    this.applyAuthoringDefinition(false);
    this.activeStage = 'describe';
    this.authoringDefinitionError = '';
    this.message =
      'Chicle AI aplicó una propuesta al diseñador de Flow. Revisa el resumen y el JSON; luego usa Guardar draft o Guardar y publicar.';
  }

  private assistantScreenState() {
    return {
      mode: this.selectedFlow ? 'editing_existing_flow' : 'new_flow',
      selected: this.selectedFlow
        ? {
            key: this.selectedFlow.key,
            name: this.selectedFlow.name,
            hasPublishedVersion: Boolean(this.selectedFlow.publishedVersion)
          }
        : null,
      draft: {
        ...this.flowDraft
      },
      entry: {
        mode: this.entryMode,
        key: this.entryKey
      },
      inputFields: this.flowInputs.map((field) => ({ ...field })),
      currentDocument: this.safeAuthoringDocument(),
      availableServices: this.services.map((service) => ({
        key: service.key,
        name: service.name,
        hasPublishedVersion: Boolean(service.publishedVersion)
      })),
      availableFlows: this.flows.map((flow) => ({
        key: flow.key,
        name: flow.name,
        hasPublishedVersion: Boolean(flow.publishedVersion)
      }))
    };
  }

  private safeAuthoringDocument() {
    try {
      return this.readAuthoringDocument();
    } catch {
      return this.authoringDocument();
    }
  }

  private authoringDocument(): FlowAuthoringDocument {
    const metadataEntry = this.asRecord(this.selectedFlow?.metadata?.['authoringEntry']);
    const steps = this.selectedFlow
      ? this.selectedFlow.steps.map((step) => ({
          key: step.key,
          name: step.name,
          type: step.type,
          position: step.position,
          config: step.config ?? {},
          inputMap: step.inputMap ?? {},
          outputKey: step.outputKey ?? null,
          nextStepKey: step.nextStepKey ?? null,
          onTrueStepKey: step.onTrueStepKey ?? null,
          onFalseStepKey: step.onFalseStepKey ?? null,
          onErrorStepKey: step.onErrorStepKey ?? null,
          onTimeoutStepKey: step.onTimeoutStepKey ?? null
        }))
      : this.starterSteps();
    const responseStep = [...steps].reverse().find((step) => step['type'] === 'response');
    return {
      schemaVersion: 1,
      flow: { ...this.flowDraft },
      entry: {
        mode: this.entryMode,
        key: this.entryKey || (this.entryMode === 'direct' ? 'direct' : this.flowDraft.key),
        config: this.asRecord(metadataEntry['config'])
      },
      inputFields: this.flowInputs.map((field) => ({ ...field })),
      steps,
      output: {
        stepKey: typeof responseStep?.['key'] === 'string' ? responseStep['key'] : null,
        responseTo: 'caller'
      }
    };
  }

  private readAuthoringDocument(): FlowAuthoringDocument {
    const parsed = JSON.parse(this.authoringDefinitionText) as unknown;
    const document = this.asRecord(parsed);
    if (document['schemaVersion'] !== 1) {
      throw new Error('schemaVersion debe ser 1.');
    }
    const flow = this.asRecord(document['flow']);
    const key = this.asString(flow['key']).trim();
    const name = this.asString(flow['name']).trim();
    if (!/^[a-z][a-z0-9_]{2,119}$/.test(key) || name.length < 3) {
      throw new Error('El flow necesita key snake_case y un nombre de al menos 3 caracteres.');
    }
    const entry = this.asRecord(document['entry']);
    const mode = this.flowEntryMode(entry['mode'], true);
    const entryKey = this.asString(entry['key']).trim() || (mode === 'direct' ? 'direct' : key);
    const rawFields = Array.isArray(document['inputFields']) ? document['inputFields'] : [];
    const inputFields = rawFields.map((value) => {
      const field = this.asRecord(value);
      return {
        key: this.asString(field['key']).trim(),
        label: this.asString(field['label']).trim(),
        type: this.flowInputType(field['type']),
        required: field['required'] === true,
        example: field['example'] === undefined || field['example'] === null ? '' : String(field['example'])
      };
    });
    const steps = Array.isArray(document['steps']) ? document['steps'].map((step) => ({ ...this.asRecord(step) })) : [];
    const output = this.asRecord(document['output']);
    return {
      schemaVersion: 1,
      flow: {
        key,
        name,
        description: this.asString(flow['description']),
        category: this.asString(flow['category']) || 'operaciones'
      },
      entry: {
        mode,
        key: entryKey,
        config: this.asRecord(entry['config'])
      },
      inputFields,
      steps,
      output: {
        stepKey: this.asString(output['stepKey']) || null,
        responseTo: 'caller'
      }
    };
  }

  private flowEntryMode(value: unknown, strict = false): FlowEntryMode {
    const modes: FlowEntryMode[] = ['direct', 'manual', 'http', 'record_event', 'form_submit', 'schedule'];
    const mode = String(value || 'direct') as FlowEntryMode;
    if (modes.includes(mode)) {
      return mode;
    }
    if (strict) {
      throw new Error('El modo de entrada no es válido.');
    }
    return 'direct';
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
    return ['text', 'number', 'boolean', 'email', 'date'].includes(String(value)) ? (value as FlowInputType) : 'text';
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
          {
            group: 'steps',
            label: `${step.name}: es válido`,
            value: `{{steps.${outputKey}.valid}}`
          },
          {
            group: 'steps',
            label: `${step.name}: valor`,
            value: `{{steps.${outputKey}.value}}`
          }
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
    if (
      this.stepDraft.type === 'parallel' &&
      (this.stepDraft.parallelBranches.length < 2 ||
        this.stepDraft.parallelBranches.some((branch) => !branch.key.trim() || !branch.serviceKey))
    ) {
      return 'El paso paralelo necesita al menos dos ramas, cada una con nombre y servicio.';
    }
    if (
      this.stepDraft.type === 'foreach' &&
      (!this.stepDraft.foreachItemsPath.trim() || !this.stepDraft.foreachServiceKey)
    ) {
      return 'Indica la ruta de la lista y el servicio que debe ejecutarse por cada elemento.';
    }
    if (this.stepDraft.type === 'subflow' && !this.stepDraft.subflowKey) {
      return 'Selecciona el flow publicado que debe ejecutarse.';
    }
    if (this.stepDraft.type === 'delay' && Number(this.stepDraft.delayMs) < 0) {
      return 'La espera no puede ser negativa.';
    }
    if (this.stepDraft.type === 'emit_event' && !/^[a-z0-9_.-]{3,120}$/.test(this.stepDraft.eventKey.trim())) {
      return 'El evento necesita un nombre de al menos 3 caracteres usando letras, números, punto, guion o guion bajo.';
    }
    if (
      this.stepDraft.type === 'decision' &&
      (!this.stepDraft.decisionLeft.trim() || !this.stepDraft.decisionRight.trim())
    ) {
      return 'Completa el dato, la comparación y el valor de la decisión.';
    }
    if (
      this.stepDraft.type === 'formula' &&
      (!this.stepDraft.formulaLeft.trim() || !this.stepDraft.formulaRight.trim())
    ) {
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
          compensationServiceKey: this.stepDraft.compensationServiceKey || null,
          timeoutMs,
          retry: {
            attempts: retryAttempts,
            backoffMs: retryBackoffMs
          }
        };
      case 'parallel':
        return {
          branches: this.stepDraft.parallelBranches.map((branch, index) => ({
            key: branch.key.trim() || `rama_${index + 1}`,
            serviceKey: branch.serviceKey
          }))
        };
      case 'foreach':
        return {
          itemsPath: this.stepDraft.foreachItemsPath.trim(),
          serviceKey: this.stepDraft.foreachServiceKey,
          itemInputKey: this.stepDraft.foreachItemInputKey.trim() || 'item',
          concurrency: Math.min(Math.max(Number(this.stepDraft.foreachConcurrency) || 1, 1), 10)
        };
      case 'subflow':
        return {
          flowKey: this.stepDraft.subflowKey
        };
      case 'delay':
        return {
          durationMs: Math.min(Math.max(Number(this.stepDraft.delayMs) || 0, 0), 30000)
        };
      case 'emit_event':
        return {
          eventKey: this.stepDraft.eventKey.trim().toLowerCase(),
          payload: this.parseJsonLenient(this.stepDraft.eventPayloadText)
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
    const parallelBranches = Array.isArray(config['branches'])
      ? config['branches'].map((value, index) => {
          const branch = this.asRecord(value);
          return {
            key: this.asString(branch['key']) || `rama_${index + 1}`,
            serviceKey: this.asString(branch['serviceKey'])
          };
        })
      : [];
    return {
      serviceKey: this.asString(config['serviceKey']),
      compensationServiceKey: this.asString(config['compensationServiceKey']),
      parallelBranches:
        parallelBranches.length >= 2
          ? parallelBranches
          : [
              { key: 'rama_1', serviceKey: '' },
              { key: 'rama_2', serviceKey: '' }
            ],
      foreachItemsPath: this.asString(config['itemsPath']) || 'input.items',
      foreachServiceKey: this.asString(config['serviceKey']),
      foreachItemInputKey: this.asString(config['itemInputKey']) || 'item',
      foreachConcurrency: this.asNumber(config['concurrency'], 4),
      subflowKey: this.asString(config['flowKey']),
      delayMs: this.asNumber(config['durationMs'], 1000),
      eventKey: this.asString(config['eventKey']) || 'proceso.completado',
      eventPayloadText: JSON.stringify(config['payload'] ?? { data: '{{steps}}' }, null, 2),
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
      inputRows: Object.entries(inputMap).map(([key, value]) => ({
        key,
        value: String(value)
      })),
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
      throughStepKey: this.testCaseDraft.target === 'draft' ? this.testCaseDraft.throughStepKey || null : null,
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
      compensationServiceKey: '',
      parallelBranches: [
        { key: 'rama_1', serviceKey: '' },
        { key: 'rama_2', serviceKey: '' }
      ],
      foreachItemsPath: 'input.items',
      foreachServiceKey: '',
      foreachItemInputKey: 'item',
      foreachConcurrency: 4,
      subflowKey: '',
      delayMs: 1000,
      eventKey: 'proceso.completado',
      eventPayloadText: '{\n  "data": "{{steps}}"\n}',
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

  private emptyTriggerDraft(): FlowTriggerDraft {
    return {
      id: '',
      type: 'manual',
      key: 'ejecutar_manual',
      secret: '',
      intervalSeconds: 60,
      inputMode: 'payload',
      inputText: this.testInputText ?? '{}',
      active: true
    };
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private asArray(value: unknown) {
    return Array.isArray(value) ? value : [];
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
    const text = value
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
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

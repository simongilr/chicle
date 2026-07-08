import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  FormlyFieldConfig,
  FormlyForm,
  FormlyFormOptions
} from '@ngx-formly/core';
import { UiPresentationConfig } from '../../core/ui/ui-presentation.types';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { DynamicServiceClientService } from '../../core/services/dynamic-service-client.service';
import { DynamicFlowClientService } from '../../core/services/dynamic-flow-client.service';
import {
  RuntimeForm,
  RuntimeFormStep
} from '../../engine/forms/form-runtime.service';
import { FormlySchemaAdapterService } from '../../engine/forms/formly/formly-schema-adapter.service';
import {
  ProcessStepItem,
  ProcessStepsComponent
} from '../process-steps/process-steps.component';
import { StatusNoticeComponent } from '../status-notice/status-notice.component';

interface RenderedRuntimeStep {
  step: RuntimeFormStep;
  fields: FormlyFieldConfig[];
}

@Component({
  selector: 'app-formly-runtime',
  standalone: true,
  imports: [FormlyForm, ProcessStepsComponent, ReactiveFormsModule, StatusNoticeComponent],
  styles: [
    `
      :host {
        display: grid;
        gap: 16px;
        min-width: 0;
      }

      form {
        display: grid;
        gap: 16px;
        min-width: 0;
      }

      .runtime-sections {
        display: grid;
        gap: 14px;
      }

      .runtime-sections.cards {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
        align-items: start;
      }

      .runtime-section {
        display: grid;
        gap: 14px;
        min-width: 0;
      }

      .runtime-section.card {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 16px;
      }

      .runtime-section.card:only-child {
        max-width: 760px;
      }

      .runtime-layout-compact .runtime-section.card:only-child {
        max-width: none;
      }

      .runtime-layout-compact .ch-formly-grid,
      .runtime-layout-tablet .ch-formly-grid {
        grid-template-columns: 1fr;
      }

      .runtime-layout-compact .ch-formly-field,
      .runtime-layout-compact .ch-formly-field--full,
      .runtime-layout-compact .ch-formly-field--half,
      .runtime-layout-compact .ch-formly-field--third,
      .runtime-layout-tablet .ch-formly-field,
      .runtime-layout-tablet .ch-formly-field--full,
      .runtime-layout-tablet .ch-formly-field--half,
      .runtime-layout-tablet .ch-formly-field--third {
        grid-column: 1 / -1;
      }

      .step-heading {
        display: grid;
        gap: 4px;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.05rem;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .actions {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }

      .actions-end {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-left: auto;
      }

      .command-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-start;
      }

      button {
        min-height: 40px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 8px 14px;
        font: inherit;
        font-weight: 800;
      }

      button.primary {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
      }

      button.secondary {
        background: #f7fbff;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      @media (max-width: 520px) {
        .runtime-sections.cards {
          grid-template-columns: 1fr;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr;
        }

        .actions-end {
          display: grid;
          grid-template-columns: 1fr;
          margin-left: 0;
        }

        .command-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    @if (showStepper) {
      <app-process-steps
        [items]="processSteps"
        [activeKey]="currentStep.key"
        [interactive]="false"
      ></app-process-steps>
    }

    <form
      [formGroup]="form"
      [class.runtime-layout-compact]="isCompactViewport"
      [class.runtime-layout-tablet]="isTabletViewport"
      (ngSubmit)="continue()"
    >
      @if (isContinuousLayout) {
        <div class="runtime-sections" [class.cards]="isCardLayout">
          @for (section of renderedSteps; track section.step.key) {
            <section class="runtime-section" [class.card]="isCardLayout">
              <div class="step-heading">
                <h2>{{ section.step.title }}</h2>
                @if (section.step.description) {
                  <p>{{ section.step.description }}</p>
                }
              </div>
              <formly-form
                class="ch-formly-grid"
                [class.ch-formly-grid--compact]="isNarrowGrid"
                [form]="form"
                [fields]="section.fields"
                [model]="runtimeModel"
                [options]="options"
                (modelChange)="handleModelChange($event)"
              ></formly-form>
            </section>
          }
        </div>
      } @else {
        <div class="step-heading">
          <h2>{{ currentStep.title }}</h2>
          @if (currentStep.description) {
            <p>{{ currentStep.description }}</p>
          }
        </div>

        <formly-form
          class="ch-formly-grid"
          [class.ch-formly-grid--compact]="isNarrowGrid"
          [form]="form"
          [fields]="fields"
          [model]="runtimeModel"
          [options]="options"
          (modelChange)="handleModelChange($event)"
        ></formly-form>
      }

      @if (!fields.length) {
        <app-status-notice tone="warning">
          Este paso todavía no contiene campos.
        </app-status-notice>
      }

      @if (validationMessage) {
        <app-status-notice tone="warning">{{ validationMessage }}</app-status-notice>
      }

      @if (commandMessage) {
        <app-status-notice tone="success">{{ commandMessage }}</app-status-notice>
      }

      @if (runtimeCommands.length) {
        <div class="command-actions" aria-label="Acciones del formulario">
          @for (command of runtimeCommands; track command['key'] || command['label']) {
            <button class="secondary" type="button" [disabled]="commandRunning" (click)="runCommand(command)">
              {{ command['label'] || command['key'] || 'Acción' }}
            </button>
          }
        </div>
      }

      @if (showActions) {
        <div class="actions">
          <button type="button" (click)="previous()" [disabled]="currentStepIndex === 0">
            Anterior
          </button>
          <div class="actions-end">
            @if (currentStepIndex < steps.length - 1) {
              <button class="primary" type="submit">Continuar</button>
            } @else {
              <button class="primary" type="submit">{{ submitLabel }}</button>
            }
          </div>
        </div>
      }
    </form>
  `
})
export class FormlyRuntimeComponent implements OnChanges {
  private readonly adapter = inject(FormlySchemaAdapterService);
  private readonly authState = inject(AuthStateService);
  private readonly services = inject(DynamicServiceClientService);
  private readonly flows = inject(DynamicFlowClientService);
  private readonly loadedOptionKeys = new Set<string>();

  @Input({ required: true }) definition!: RuntimeForm;
  @Input() model: Record<string, unknown> = {};
  @Input() presentation?: UiPresentationConfig;
  @Input() viewportWidth?: number;
  @Input() readonly = false;
  @Input() showActions = true;
  @Input() submitLabel = 'Validar formulario';
  @Output() readonly modelChange = new EventEmitter<Record<string, unknown>>();
  @Output() readonly validChange = new EventEmitter<boolean>();
  @Output() readonly submitted = new EventEmitter<Record<string, unknown>>();

  form = new FormGroup({});
  fields: FormlyFieldConfig[] = [];
  renderedSteps: RenderedRuntimeStep[] = [];
  options: FormlyFormOptions = {};
  runtimeModel: Record<string, unknown> = {};
  currentStepIndex = 0;
  validationMessage = '';
  commandMessage = '';
  commandRunning = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['definition']) {
      this.currentStepIndex = 0;
      this.loadedOptionKeys.clear();
    }
    if (changes['definition'] || changes['model']?.firstChange) {
      this.runtimeModel = { ...(this.model ?? {}) };
    }
    if (
      changes['definition'] ||
      changes['presentation'] ||
      changes['viewportWidth'] ||
      changes['readonly'] ||
      changes['model']?.firstChange
    ) {
      this.rebuild();
    }
  }

  get steps(): RuntimeFormStep[] {
    if (this.definition?.steps?.length) {
      return this.definition.steps;
    }
    return [
      {
        key: 'form',
        title: this.definition?.title || 'Formulario',
        fields: this.definition?.fields ?? []
      }
    ];
  }

  get currentStep() {
    return this.steps[this.currentStepIndex] ?? this.steps[0];
  }

  get layoutMode() {
    const layout = this.asObject(this.definition?.layout);
    const desktop = this.asObject(layout?.['desktop']);
    const mobile = this.asObject(layout?.['mobile']);
    const isMobile = (this.viewportWidth ?? 1280) <= 767;
    const configured = isMobile ? mobile?.['mode'] : desktop?.['mode'];
    if (configured === 'auto') {
      return isMobile ? 'step_screens' : this.steps.length > 2 ? 'step_cards' : 'single_form';
    }
    return typeof configured === 'string' ? configured : isMobile ? 'step_screens' : 'step_cards';
  }

  get isCompactViewport() {
    return (this.viewportWidth ?? 1280) <= 520;
  }

  get isTabletViewport() {
    const width = this.viewportWidth ?? 1280;
    return width > 520 && width <= 820;
  }

  get isNarrowGrid() {
    return (this.viewportWidth ?? 1280) <= 820;
  }

  get isContinuousLayout() {
    return ['single_form', 'single_scroll', 'step_cards'].includes(this.layoutMode);
  }

  get isCardLayout() {
    return this.layoutMode === 'step_cards' && (this.viewportWidth ?? 1280) > 767;
  }

  get showStepper() {
    return this.steps.length > 1 && !this.isContinuousLayout;
  }

  get processSteps(): ProcessStepItem[] {
    return this.steps.map((step, index) => ({
      key: step.key,
      label: step.title,
      summary: `${step.fields.length} campos`,
      state:
        index < this.currentStepIndex
          ? 'complete'
          : index === this.currentStepIndex
            ? 'active'
            : 'pending'
    }));
  }

  continue() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.validationMessage = 'Completa los campos obligatorios y corrige los valores indicados.';
      this.validChange.emit(false);
      return;
    }

    this.validationMessage = '';
    this.validChange.emit(true);
    if (!this.isContinuousLayout && this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex += 1;
      this.rebuild();
      return;
    }

    this.submitted.emit({ ...this.runtimeModel });
  }

  previous() {
    if (this.isContinuousLayout || this.currentStepIndex === 0) {
      return;
    }
    this.currentStepIndex -= 1;
    this.validationMessage = '';
    this.rebuild();
  }

  handleModelChange(model: Record<string, unknown>) {
    this.runtimeModel = model;
    this.modelChange.emit({ ...model });
    this.validChange.emit(this.form.valid);
  }

  get runtimeCommands() {
    return Array.isArray(this.definition?.commands)
      ? this.definition.commands.filter((command) => {
          const object = this.asObject(command);
          return object?.['event'] === 'onClick' && this.canUseItem(object);
        })
      : [];
  }

  runCommand(command: Record<string, unknown>) {
    const requiresValidForm = command['requiresValidForm'] !== false;
    if (requiresValidForm) {
      this.form.markAllAsTouched();
    }
    if (requiresValidForm && this.form.invalid) {
      this.validationMessage = 'Completa los campos obligatorios antes de ejecutar esta acción.';
      this.validChange.emit(false);
      return;
    }
    const confirmConfig = this.asObject(command['confirm']);
    const confirmMessage = typeof confirmConfig?.['message'] === 'string' ? confirmConfig['message'] : '';
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    const type = String(command['type'] ?? '');
    const responseMode = String(command['responseMode'] ?? 'show_response');
    this.validationMessage = '';
    this.commandMessage = '';

    if (type === 'show_message') {
      this.commandMessage = `${String(command['label'] ?? 'Acción')} ejecutada.`;
      return;
    }

    const payload = { input: { ...this.runtimeModel } };
    this.commandRunning = true;
    if (type === 'execute_flow') {
      const flowKey = String(command['flowKey'] ?? '');
      this.flows.execute(flowKey, payload.input).subscribe({
        next: () => {
          this.commandMessage = responseMode === 'silent' ? 'Acción ejecutada.' : 'Flow ejecutado correctamente.';
          this.commandRunning = false;
        },
        error: () => {
          this.validationMessage = 'No se pudo ejecutar el flow configurado.';
          this.commandRunning = false;
        }
      });
      return;
    }

    const serviceKey = String(command['serviceKey'] ?? '');
    this.services.execute(serviceKey, payload).subscribe({
      next: () => {
        this.commandMessage = responseMode === 'silent' ? 'Acción ejecutada.' : 'Servicio ejecutado correctamente.';
        this.commandRunning = false;
      },
      error: () => {
        this.validationMessage = 'No se pudo ejecutar el servicio configurado.';
        this.commandRunning = false;
      }
    });
  }

  private rebuild() {
    if (!this.definition || !this.currentStep) {
      return;
    }
    this.form = new FormGroup({});
    this.options = { formState: { stepKey: this.isContinuousLayout ? 'all' : this.currentStep.key } };
    const context = {
      presentation: this.presentation ?? this.definition.presentation,
      viewportWidth: this.viewportWidth,
      readonly: this.readonly
    };
    this.renderedSteps = this.steps.map((step) => ({
      step,
      fields: this.adapter.toFields(this.visibleFields(step.fields), context)
    }));
    this.fields = this.isContinuousLayout
      ? this.renderedSteps.flatMap((section) => section.fields)
      : this.adapter.toFields(this.visibleFields(this.currentStep.fields), context);
    this.loadDynamicOptions();
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private loadDynamicOptions() {
    for (const field of this.steps.flatMap((step) => this.visibleFields(step.fields))) {
      const dataSource = this.asObject(field.dataSource);
      const serviceKey = typeof dataSource?.['serviceKey'] === 'string' ? dataSource['serviceKey'] : '';
      const type = typeof dataSource?.['type'] === 'string' ? dataSource['type'] : '';
      if (!serviceKey || type !== 'dynamic_service') {
        continue;
      }
      const cacheKey = `${field.key || field.name}:${serviceKey}`;
      if (this.loadedOptionKeys.has(cacheKey)) {
        continue;
      }
      this.loadedOptionKeys.add(cacheKey);
      this.services.execute(serviceKey, { input: this.runtimeModel }).subscribe({
        next: (execution) => {
          const options = this.optionsFromServiceResult(execution.result ?? execution.response);
          if (!options.length) {
            return;
          }
          field.options = options;
          this.rebuildAfterOptionLoad();
        },
        error: () => {
          this.loadedOptionKeys.delete(cacheKey);
        }
      });
    }
  }

  private rebuildAfterOptionLoad() {
    const currentLoaded = new Set(this.loadedOptionKeys);
    this.rebuild();
    this.loadedOptionKeys.clear();
    for (const key of currentLoaded) {
      this.loadedOptionKeys.add(key);
    }
  }

  private optionsFromServiceResult(value: unknown): Array<{ label: string; value: unknown }> {
    const source = this.firstArray(value);
    return source
      .map((item) => this.optionFromUnknown(item))
      .filter((option): option is { label: string; value: unknown } => Boolean(option));
  }

  private firstArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }
    const object = this.asObject(value);
    if (!object) {
      return [];
    }
    for (const key of ['items', 'data', 'rows', 'result', 'options']) {
      const nested = object[key];
      if (Array.isArray(nested)) {
        return nested;
      }
    }
    return [];
  }

  private optionFromUnknown(item: unknown): { label: string; value: unknown } | null {
    const object = this.asObject(item);
    if (!object) {
      return { label: String(item), value: item };
    }
    const value = object['value'] ?? object['id'] ?? object['key'] ?? object['code'] ?? object['slug'];
    const label = object['label'] ?? object['name'] ?? object['title'] ?? value;
    if (label === undefined || value === undefined) {
      return null;
    }
    return { label: String(label), value };
  }

  private visibleFields(fields: RuntimeFormStep['fields']) {
    return fields
      .filter((field) => this.canUseItem(field))
      .map((field) => {
        if (this.shouldForceReadonly(field)) {
          field.readonly = true;
        }
        return field;
      });
  }

  private canUseItem(item: unknown) {
    const object = this.asObject(item);
    const access = this.asObject(object?.['access']);
    if (!access) {
      return true;
    }
    const permissions = Array.isArray(access['permissions'])
      ? access['permissions'].map(String).filter(Boolean)
      : [];
    const roles = Array.isArray(access['roles']) ? access['roles'].map(String).filter(Boolean) : [];
    const hasPermissions = !permissions.length || this.authState.hasAllPermissions(permissions);
    const hasRoles = !roles.length || this.authState.hasAnyRole(roles);
    if (hasPermissions && hasRoles) {
      return true;
    }
    return access['deniedMode'] === 'readonly';
  }

  private shouldForceReadonly(item: unknown) {
    const object = this.asObject(item);
    const access = this.asObject(object?.['access']);
    const permission = typeof access?.['readonlyUnlessPermission'] === 'string'
      ? access['readonlyUnlessPermission'].trim()
      : '';
    return Boolean(permission && !this.authState.hasPermission(permission));
  }
}

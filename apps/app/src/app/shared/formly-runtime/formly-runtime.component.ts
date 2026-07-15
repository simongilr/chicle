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
import { MobileActionBarComponent } from '../mobile-form/mobile-action-bar.component';
import { MobileStepProgressComponent } from '../mobile-form/mobile-step-progress.component';
import { StatusNoticeComponent } from '../status-notice/status-notice.component';

interface RenderedRuntimeStep {
  step: RuntimeFormStep;
  fields: FormlyFieldConfig[];
}

@Component({
  selector: 'app-formly-runtime',
  standalone: true,
  imports: [
    FormlyForm,
    MobileActionBarComponent,
    MobileStepProgressComponent,
    ProcessStepsComponent,
    ReactiveFormsModule,
    StatusNoticeComponent
  ],
  styles: [
    `
      :host {
        display: grid;
        gap: 14px;
        min-width: 0;
      }

      form {
        display: grid;
        gap: 14px;
        min-width: 0;
      }

      form[data-form-width='compact'] {
        width: min(100%, 560px);
      }

      form[data-form-width='standard'] {
        width: min(100%, 760px);
      }

      form[data-form-width='wide'] {
        width: min(100%, 980px);
      }

      form[data-form-width='full'] {
        width: 100%;
      }

      form[data-form-align='left'] {
        justify-self: start;
      }

      form[data-form-align='center'] {
        justify-self: center;
      }

      form[data-form-align='right'] {
        justify-self: end;
      }

      form[data-form-align='stretch'] {
        justify-self: stretch;
      }

      form.runtime-form-short .runtime-sections.short {
        width: 100%;
      }

      form.runtime-form-short .ch-formly-grid {
        grid-template-columns: 1fr;
      }

      form.runtime-form-short .ch-formly-field,
      form.runtime-form-short .ch-formly-field--full,
      form.runtime-form-short .ch-formly-field--half,
      form.runtime-form-short .ch-formly-field--third {
        grid-column: 1 / -1;
      }

      form.runtime-form-short[data-action-size='field'] .runtime-sections.short,
      form.runtime-form-short[data-action-size='field'] .step-heading,
      form.runtime-form-short[data-action-size='field'] .ch-formly-grid {
        width: min(100%, 420px);
        justify-self: center;
      }

      .runtime-sections {
        display: grid;
        gap: 14px;
      }

      .runtime-sections.short {
        width: min(100%, 560px);
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

      form[data-field-columns='1'] .ch-formly-grid {
        grid-template-columns: 1fr;
      }

      form[data-field-columns='2'] .ch-formly-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      form[data-field-columns='3'] .ch-formly-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
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

      form[data-action-position='footer'] .actions {
        border-top: 1px solid var(--ch-color-border);
        padding-top: 12px;
      }

      form[data-action-position='bottom_sticky'] .actions {
        position: sticky;
        bottom: 0;
        z-index: 2;
        margin-top: 2px;
        padding-top: 10px;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--ch-color-surface) 70%, transparent),
          var(--ch-color-surface) 38%
        );
      }

      .actions.no-secondary {
        justify-content: flex-end;
      }

      form[data-action-align='left'] .actions,
      form[data-action-align='left'] .actions.no-secondary {
        justify-content: flex-start;
      }

      form[data-action-align='center'] .actions,
      form[data-action-align='center'] .actions.no-secondary {
        justify-content: center;
      }

      form[data-action-align='right'] .actions,
      form[data-action-align='right'] .actions.no-secondary {
        justify-content: flex-end;
      }

      form[data-action-align='stretch'] .actions,
      form[data-action-align='stretch'] .actions.no-secondary {
        justify-content: stretch;
      }

      .actions-end {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-left: auto;
      }

      form[data-action-align='left'] .actions-end,
      form[data-action-align='center'] .actions-end,
      form[data-action-align='stretch'] .actions-end {
        margin-left: 0;
      }

      form[data-action-align='stretch'] .actions-end,
      form[data-action-size='full'] .actions-end {
        flex: 1;
      }

      form[data-action-size='field'] .actions {
        width: min(100%, 420px);
        justify-self: center;
      }

      form[data-action-size='field'] .actions-end {
        width: 100%;
        flex: 1;
        margin-left: 0;
      }

      form[data-action-size='sm'] button {
        min-height: 34px;
        padding: 6px 11px;
        font-size: 0.88rem;
      }

      form[data-action-size='lg'] button {
        min-height: 46px;
        padding: 10px 18px;
        font-size: 1rem;
      }

      form[data-action-align='stretch'] .actions-end button.primary,
      form[data-action-size='field'] .actions-end button.primary,
      form[data-action-size='full'] .actions-end button.primary {
        width: 100%;
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

      form[data-primary-tone='success'] button.primary {
        border-color: var(--ch-color-success);
        background: var(--ch-color-success);
        color: var(--ch-color-primary-contrast);
      }

      form[data-primary-tone='danger'] button.primary {
        border-color: var(--ch-color-danger);
        background: var(--ch-color-danger);
        color: var(--ch-color-primary-contrast);
      }

      form[data-primary-tone='secondary'] button.primary {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      form[data-primary-tone='neutral'] button.primary {
        border-color: var(--ch-color-border);
        background: var(--ch-color-text);
        color: var(--ch-color-surface);
      }

      button.secondary {
        background: var(--ch-color-surface-alt);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      @media (max-width: 520px) {
        :host,
        form {
          gap: 12px;
        }

        .step-heading {
          gap: 3px;
        }

        h2 {
          font-size: 1rem;
        }

        p {
          font-size: 0.88rem;
          line-height: 1.38;
        }

        .runtime-sections.cards {
          grid-template-columns: 1fr;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr;
        }

        .actions.no-secondary {
          justify-content: stretch;
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
    @if (showProcessStepper) {
      <app-process-steps
        [items]="processSteps"
        [activeKey]="currentStep.key"
        [interactive]="false"
      ></app-process-steps>
    }

    @if (showMobileStepper) {
      <app-mobile-step-progress
        [items]="processSteps"
        [activeKey]="currentStep.key"
        [interactive]="false"
      ></app-mobile-step-progress>
    }

    <form
      [formGroup]="form"
      [class.runtime-layout-compact]="isCompactViewport"
      [class.runtime-layout-tablet]="isTabletViewport"
      [class.runtime-form-short]="isShortForm"
      [attr.data-form-width]="formWidth"
      [attr.data-form-align]="formAlign"
      [attr.data-field-columns]="fieldColumns"
      [attr.data-action-position]="actionPosition"
      [attr.data-action-align]="actionAlign"
      [attr.data-action-size]="actionSize"
      [attr.data-primary-tone]="primaryTone"
      (ngSubmit)="continue()"
    >
      @if (isContinuousLayout) {
        <div class="runtime-sections" [class.cards]="isCardLayout" [class.short]="isShortForm">
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
        @if (isCompactViewport) {
          <app-mobile-action-bar
            [secondaryLabel]="showPreviousAction ? 'Anterior' : ''"
            [secondaryDisabled]="currentStepIndex === 0"
            [primaryLabel]="currentStepIndex < steps.length - 1 ? 'Continuar' : submitLabel"
            primaryType="submit"
            (secondary)="previous()"
          ></app-mobile-action-bar>
        } @else {
          <div class="actions" [class.no-secondary]="!showPreviousAction">
            @if (showPreviousAction) {
              <button type="button" (click)="previous()" [disabled]="currentStepIndex === 0">
                Anterior
              </button>
            }
            <div class="actions-end">
              @if (currentStepIndex < steps.length - 1) {
                <button class="primary" type="submit">Continuar</button>
              } @else {
                <button class="primary" type="submit">{{ submitLabel }}</button>
              }
            </div>
          </div>
        }
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

  get isShortForm() {
    return this.steps.length === 1 && (this.steps[0]?.fields?.length ?? 0) <= 4;
  }

  get deviceLayoutKey() {
    const width = this.viewportWidth ?? 1280;
    if (width <= 767) {
      return 'mobile';
    }
    if (width <= 1024) {
      return 'tablet';
    }
    return 'desktop';
  }

  get formWidth() {
    const form = this.asObject(this.layoutConfig?.['form']);
    return this.allowed(String(form?.['width'] ?? ''), ['compact', 'standard', 'wide', 'full'], this.isShortForm ? 'compact' : 'full');
  }

  get formAlign() {
    const form = this.asObject(this.layoutConfig?.['form']);
    return this.allowed(String(form?.['align'] ?? ''), ['left', 'center', 'right', 'stretch'], this.isShortForm ? 'left' : 'stretch');
  }

  get fieldColumns() {
    if (this.isCompactViewport || this.isShortForm) {
      return 1;
    }
    const columns = Number(this.deviceLayoutConfig?.['fieldColumns']);
    if (Number.isFinite(columns) && columns >= 1 && columns <= 3) {
      return Math.trunc(columns);
    }
    return this.isTabletViewport ? 1 : 2;
  }

  get actionPosition() {
    return this.allowed(
      String(this.actionLayoutConfig?.['position'] ?? ''),
      ['inline', 'footer', 'bottom_sticky'],
      this.isCompactViewport ? 'bottom_sticky' : 'inline'
    );
  }

  get actionAlign() {
    return this.allowed(
      String(this.actionLayoutConfig?.['align'] ?? ''),
      ['left', 'center', 'right', 'stretch'],
      this.isCompactViewport ? 'stretch' : 'right'
    );
  }

  get actionSize() {
    return this.allowed(
      String(this.actionLayoutConfig?.['size'] ?? ''),
      ['sm', 'md', 'lg', 'full', 'field'],
      this.isCompactViewport ? 'full' : 'md'
    );
  }

  get primaryTone() {
    const presentation = this.asObject(this.definition?.presentation);
    const tokens = this.asObject(presentation?.['tokens']);
    const buttonPrimary = this.asObject(tokens?.['buttonPrimary']);
    return this.allowed(String(buttonPrimary?.['background'] ?? ''), ['primary', 'secondary', 'success', 'danger', 'neutral'], 'primary');
  }

  get showPreviousAction() {
    return !this.isContinuousLayout && this.steps.length > 1;
  }

  get showStepper() {
    return this.steps.length > 1 && !this.isContinuousLayout;
  }

  get showProcessStepper() {
    return this.showStepper && !this.isCompactViewport;
  }

  get showMobileStepper() {
    return this.showStepper && this.isCompactViewport;
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

  private get layoutConfig() {
    return this.asObject(this.definition?.layout);
  }

  private get deviceLayoutConfig() {
    return this.asObject(this.layoutConfig?.[this.deviceLayoutKey]);
  }

  private get actionLayoutConfig() {
    return this.asObject(this.deviceLayoutConfig?.['actions']);
  }

  private allowed<T extends string>(value: string, values: readonly T[], fallback: T): T {
    return values.includes(value as T) ? (value as T) : fallback;
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

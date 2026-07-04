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

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      @media (max-width: 520px) {
        .actions {
          display: grid;
          grid-template-columns: 1fr;
        }

        .actions-end {
          display: grid;
          grid-template-columns: 1fr;
          margin-left: 0;
        }
      }
    `
  ],
  template: `
    @if (steps.length > 1) {
      <app-process-steps
        [items]="processSteps"
        [activeKey]="currentStep.key"
        [interactive]="false"
      ></app-process-steps>
    }

    <div class="step-heading">
      <h2>{{ currentStep.title }}</h2>
      @if (currentStep.description) {
        <p>{{ currentStep.description }}</p>
      }
    </div>

    <form [formGroup]="form" (ngSubmit)="continue()">
      <formly-form
        class="ch-formly-grid"
        [form]="form"
        [fields]="fields"
        [model]="runtimeModel"
        [options]="options"
        (modelChange)="handleModelChange($event)"
      ></formly-form>

      @if (!fields.length) {
        <app-status-notice tone="warning">
          Este paso todavía no contiene campos.
        </app-status-notice>
      }

      @if (validationMessage) {
        <app-status-notice tone="warning">{{ validationMessage }}</app-status-notice>
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
  options: FormlyFormOptions = {};
  runtimeModel: Record<string, unknown> = {};
  currentStepIndex = 0;
  validationMessage = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['definition']) {
      this.currentStepIndex = 0;
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
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex += 1;
      this.rebuild();
      return;
    }

    this.submitted.emit({ ...this.runtimeModel });
  }

  previous() {
    if (this.currentStepIndex === 0) {
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

  private rebuild() {
    if (!this.definition || !this.currentStep) {
      return;
    }
    this.form = new FormGroup({});
    this.options = { formState: { stepKey: this.currentStep.key } };
    this.fields = this.adapter.toFields(this.currentStep.fields, {
      presentation: this.presentation ?? this.definition.presentation,
      viewportWidth: this.viewportWidth,
      readonly: this.readonly
    });
  }
}

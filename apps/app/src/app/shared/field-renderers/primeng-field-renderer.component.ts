import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RuntimeField } from '../../engine/forms/form-runtime.service';

@Component({
  selector: 'app-primeng-field-renderer',
  standalone: true,
  imports: [
    CheckboxModule,
    FormsModule,
    InputTextModule,
    RadioButtonModule,
    SelectModule,
    TextareaModule,
    ToggleSwitchModule
  ],
  styles: [
    `
      :host,
      input,
      textarea,
      p-select {
        display: block;
        width: 100%;
        min-width: 0;
      }

      input,
      p-select {
        min-height: 44px;
      }

      input,
      textarea {
        border: 1px solid #c5d6e6;
        border-radius: var(--ch-radius);
        background: #ffffff;
        color: var(--ch-color-text);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.8) inset,
          0 1px 2px rgba(20, 50, 80, 0.04);
        padding: 10px 12px;
        font: inherit;
        line-height: 1.35;
        transition:
          border-color 140ms ease,
          box-shadow 140ms ease,
          background-color 140ms ease;
      }

      input:focus,
      textarea:focus {
        outline: 3px solid rgba(21, 84, 162, 0.16);
        border-color: var(--ch-color-primary);
        box-shadow:
          0 0 0 1px rgba(21, 84, 162, 0.08),
          0 8px 18px rgba(20, 50, 80, 0.08);
      }

      input::placeholder,
      textarea::placeholder {
        color: #7b8fa3;
      }

      textarea {
        min-height: 112px;
        resize: vertical;
      }

      :host ::ng-deep .p-select {
        width: 100%;
        min-height: 44px;
        border: 1px solid #c5d6e6;
        border-radius: var(--ch-radius);
        background: #ffffff;
        color: var(--ch-color-text);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.8) inset,
          0 1px 2px rgba(20, 50, 80, 0.04);
        transition:
          border-color 140ms ease,
          box-shadow 140ms ease,
          background-color 140ms ease;
      }

      :host ::ng-deep .p-select:not(.p-disabled).p-focus {
        border-color: var(--ch-color-primary);
        box-shadow:
          0 0 0 3px rgba(21, 84, 162, 0.16),
          0 8px 18px rgba(20, 50, 80, 0.08);
      }

      :host ::ng-deep .p-select-label {
        display: flex;
        align-items: center;
        min-height: 42px;
        padding: 9px 12px;
        color: var(--ch-color-text);
      }

      :host ::ng-deep .p-placeholder {
        color: #7b8fa3;
      }

      :host ::ng-deep .p-select-dropdown {
        color: #52677a;
      }

      .boolean-control {
        display: flex;
        align-items: center;
        min-height: 42px;
        gap: 9px;
        border: 1px solid #d9e2ec;
        border-radius: var(--ch-radius);
        background: #fbfcfe;
        color: var(--ch-color-text);
        padding: 10px 12px;
        font-weight: 750;
      }

      .option-list {
        display: grid;
        gap: 8px;
        min-height: 42px;
      }

      .option {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #d9e2ec;
        border-radius: var(--ch-radius);
        background: #fbfcfe;
        color: var(--ch-color-text);
        padding: 9px 11px;
      }

      .file-control,
      .geo-control {
        display: grid;
        gap: 8px;
      }

      .file-control input[type='file'] {
        width: 100%;
        min-height: 44px;
        border: 1px dashed #9fb7cf;
        border-radius: var(--ch-radius);
        background: #fbfcfe;
        color: var(--ch-color-text);
        padding: 10px 12px;
      }

      .geo-control button {
        min-height: 44px;
        border: 1px solid #c5d6e6;
        border-radius: var(--ch-radius);
        background: #ffffff;
        color: var(--ch-color-text);
        padding: 10px 12px;
        font: inherit;
        font-weight: 800;
        text-align: left;
      }

      .value-summary {
        color: var(--ch-color-muted);
        font-size: 0.8rem;
        line-height: 1.35;
      }
    `
  ],
  template: `
    @switch (controlType) {
      @case ('textarea') {
        <textarea
          pTextarea
          [id]="controlId"
          [name]="field.name"
          [placeholder]="field.placeholder || ''"
          [required]="field.required === true"
          [disabled]="disabled"
          [readOnly]="readonly"
          [ngModel]="value"
          (ngModelChange)="valueChange.emit($event)"
        ></textarea>
      }
      @case ('select') {
        <p-select
          [inputId]="controlId"
          [options]="field.options || []"
          optionLabel="label"
          optionValue="value"
          [placeholder]="field.placeholder || 'Selecciona una opción'"
          [disabled]="disabled || readonly"
          [ngModel]="value"
          (ngModelChange)="valueChange.emit($event)"
        ></p-select>
      }
      @case ('checkbox') {
        <label class="boolean-control" [attr.for]="controlId">
          <p-checkbox
            [inputId]="controlId"
            [name]="field.name"
            [binary]="true"
            [disabled]="disabled || readonly"
            [ngModel]="value === true"
            (ngModelChange)="valueChange.emit($event)"
          ></p-checkbox>
          <span>{{ field.placeholder || 'Sí' }}</span>
        </label>
      }
      @case ('toggle') {
        <label class="boolean-control" [attr.for]="controlId">
          <p-toggleswitch
            [inputId]="controlId"
            [disabled]="disabled || readonly"
            [ngModel]="value === true"
            (ngModelChange)="valueChange.emit($event)"
          ></p-toggleswitch>
          <span>{{ field.placeholder || 'Sí' }}</span>
        </label>
      }
      @case ('radio') {
        <div class="option-list" role="radiogroup">
          @for (option of field.options || []; track option.label; let index = $index) {
            <label class="option" [attr.for]="controlId + '-' + index">
              <p-radioButton
                [inputId]="controlId + '-' + index"
                [name]="field.name"
                [value]="option.value"
                [disabled]="disabled || readonly"
                [ngModel]="value"
                (ngModelChange)="valueChange.emit($event)"
              ></p-radioButton>
              <span>{{ option.label }}</span>
            </label>
          }
        </div>
      }
      @case ('file') {
        <div class="file-control">
          <input
            [id]="controlId"
            [name]="field.name"
            type="file"
            [attr.accept]="accept"
            [required]="field.required === true"
            [disabled]="disabled || readonly"
            (change)="updateFile($event)"
          />
          @if (valueSummary) {
            <span class="value-summary">{{ valueSummary }}</span>
          }
        </div>
      }
      @case ('image') {
        <div class="file-control">
          <input
            [id]="controlId"
            [name]="field.name"
            type="file"
            accept="image/*"
            [attr.capture]="capture"
            [required]="field.required === true"
            [disabled]="disabled || readonly"
            (change)="updateFile($event)"
          />
          @if (valueSummary) {
            <span class="value-summary">{{ valueSummary }}</span>
          }
        </div>
      }
      @case ('gps') {
        <div class="geo-control">
          <button type="button" [disabled]="disabled || readonly" (click)="captureLocation()">
            {{ valueSummary || field.placeholder || 'Capturar ubicación' }}
          </button>
        </div>
      }
      @default {
        <input
          pInputText
          [id]="controlId"
          [name]="field.name"
          [type]="inputType"
          [placeholder]="field.placeholder || ''"
          [required]="field.required === true"
          [disabled]="disabled"
          [readOnly]="readonly"
          [ngModel]="value"
          (ngModelChange)="valueChange.emit($event)"
        />
      }
    }
  `
})
export class PrimengFieldRendererComponent {
  @Input({ required: true }) field!: RuntimeField;
  @Input({ required: true }) controlId = '';
  @Input() value: unknown = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Output() readonly valueChange = new EventEmitter<unknown>();

  get controlType() {
    const type = this.field.type.toLowerCase();
    if (['textarea', 'select', 'boolean', 'checkbox', 'toggle', 'radio', 'file', 'image', 'gps'].includes(type)) {
      return type === 'boolean' ? 'checkbox' : type;
    }
    return 'input';
  }

  get inputType() {
    const type = this.field.type.toLowerCase();
    if (type === 'currency') {
      return 'number';
    }
    return ['email', 'number', 'date', 'time', 'datetime', 'datetime-local', 'password', 'tel', 'url'].includes(type)
      ? type === 'datetime'
        ? 'datetime-local'
        : type
      : 'text';
  }

  get accept() {
    const accept = this.field.config?.['accept'];
    return typeof accept === 'string' ? accept : undefined;
  }

  get capture() {
    const capture = this.field.config?.['capture'];
    return typeof capture === 'string' ? capture : undefined;
  }

  get valueSummary() {
    const value = this.value;
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      const object = value as Record<string, unknown>;
      if (typeof object['lat'] === 'number' && typeof object['lng'] === 'number') {
        return `${object['lat']}, ${object['lng']}`;
      }
      if (object['name']) {
        return String(object['name']);
      }
    }
    return 'Valor capturado';
  }

  updateFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.valueChange.emit(file ? { name: file.name, size: file.size, type: file.type } : null);
  }

  captureLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.valueChange.emit({ unavailable: true });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.valueChange.emit({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => this.valueChange.emit({ unavailable: true })
    );
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { MobileEvidenceControlComponent } from '../mobile-form/mobile-evidence-control.component';

@Component({
  selector: 'app-native-field-renderer',
  standalone: true,
  imports: [FormsModule, MobileEvidenceControlComponent],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      input:not([type='checkbox']),
      select,
      textarea {
        appearance: none;
        width: 100%;
        min-height: 44px;
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

      select {
        padding-right: 34px;
        background-image:
          linear-gradient(45deg, transparent 50%, #52677a 50%),
          linear-gradient(135deg, #52677a 50%, transparent 50%);
        background-position:
          calc(100% - 17px) 18px,
          calc(100% - 12px) 18px;
        background-size:
          5px 5px,
          5px 5px;
        background-repeat: no-repeat;
      }

      input::placeholder,
      textarea::placeholder {
        color: #7b8fa3;
      }

      textarea {
        min-height: 112px;
        resize: vertical;
      }

      input:focus,
      select:focus,
      textarea:focus {
        outline: 3px solid rgba(21, 84, 162, 0.16);
        border-color: var(--ch-color-primary);
        background: #ffffff;
        box-shadow:
          0 0 0 1px rgba(21, 84, 162, 0.08),
          0 8px 18px rgba(20, 50, 80, 0.08);
      }

      input:disabled,
      select:disabled,
      textarea:disabled {
        background: #eef3f8;
        cursor: not-allowed;
        opacity: 0.78;
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

      .boolean-control input {
        width: 18px;
        height: 18px;
        accent-color: var(--ch-color-primary);
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

    `
  ],
  template: `
    @switch (controlType) {
      @case ('textarea') {
        <textarea
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
        <select
          [id]="controlId"
          [name]="field.name"
          [required]="field.required === true"
          [disabled]="disabled || readonly"
          [ngModel]="value"
          (ngModelChange)="valueChange.emit($event)"
        >
          <option value="" disabled>{{ field.placeholder || 'Selecciona una opción' }}</option>
          @for (option of field.options || []; track option.label) {
            <option [ngValue]="option.value">{{ option.label }}</option>
          }
        </select>
      }
      @case ('checkbox') {
        <label class="boolean-control" [attr.for]="controlId">
          <input
            [id]="controlId"
            [name]="field.name"
            type="checkbox"
            [disabled]="disabled || readonly"
            [ngModel]="value === true"
            (ngModelChange)="valueChange.emit($event)"
          />
          <span>{{ field.placeholder || 'Sí' }}</span>
        </label>
      }
      @case ('toggle') {
        <label class="boolean-control" [attr.for]="controlId">
          <input
            [id]="controlId"
            [name]="field.name"
            type="checkbox"
            role="switch"
            [disabled]="disabled || readonly"
            [ngModel]="value === true"
            (ngModelChange)="valueChange.emit($event)"
          />
          <span>{{ field.placeholder || 'Sí' }}</span>
        </label>
      }
      @case ('radio') {
        <div class="option-list" role="radiogroup">
          @for (option of field.options || []; track option.label; let index = $index) {
            <label class="option" [attr.for]="controlId + '-' + index">
              <input
                [id]="controlId + '-' + index"
                [name]="field.name"
                type="radio"
                [value]="option.value"
                [disabled]="disabled || readonly"
                [ngModel]="value"
                (ngModelChange)="valueChange.emit($event)"
              />
              <span>{{ option.label }}</span>
            </label>
          }
        </div>
      }
      @case ('file') {
        <app-mobile-evidence-control
          mode="file"
          [controlId]="controlId"
          [name]="field.name"
          [value]="value"
          [placeholder]="field.placeholder || ''"
          [accept]="accept"
          [required]="field.required === true"
          [disabled]="disabled"
          [readonly]="readonly"
          (valueChange)="valueChange.emit($event)"
        ></app-mobile-evidence-control>
      }
      @case ('image') {
        <app-mobile-evidence-control
          mode="image"
          [controlId]="controlId"
          [name]="field.name"
          [value]="value"
          [placeholder]="field.placeholder || ''"
          [capture]="capture"
          [required]="field.required === true"
          [disabled]="disabled"
          [readonly]="readonly"
          (valueChange)="valueChange.emit($event)"
        ></app-mobile-evidence-control>
      }
      @case ('gps') {
        <app-mobile-evidence-control
          mode="gps"
          [controlId]="controlId"
          [name]="field.name"
          [value]="value"
          [placeholder]="field.placeholder || ''"
          [disabled]="disabled"
          [readonly]="readonly"
          (valueChange)="valueChange.emit($event)"
        ></app-mobile-evidence-control>
      }
      @default {
        <input
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
export class NativeFieldRendererComponent {
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

}

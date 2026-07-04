import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RuntimeField } from '../../engine/forms/form-runtime.service';

@Component({
  selector: 'app-native-field-renderer',
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      input:not([type='checkbox']),
      select,
      textarea {
        width: 100%;
        min-height: 42px;
        border: 1px solid #b9c9d8;
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 9px 11px;
        font: inherit;
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
        color: var(--ch-color-text);
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
        color: var(--ch-color-text);
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
    if (['textarea', 'select', 'boolean', 'checkbox', 'toggle', 'radio'].includes(type)) {
      return type === 'boolean' ? 'checkbox' : type;
    }
    return 'input';
  }

  get inputType() {
    const type = this.field.type.toLowerCase();
    return ['email', 'number', 'date', 'time', 'datetime', 'datetime-local', 'password', 'tel', 'url'].includes(type)
      ? type === 'datetime'
        ? 'datetime-local'
        : type
      : 'text';
  }
}

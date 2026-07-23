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
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        box-shadow:
          0 1px 0 color-mix(in srgb, var(--ch-color-surface) 80%, transparent) inset,
          0 1px 2px color-mix(in srgb, var(--ch-color-text) 5%, transparent);
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
          linear-gradient(45deg, transparent 50%, var(--ch-color-muted) 50%),
          linear-gradient(135deg, var(--ch-color-muted) 50%, transparent 50%);
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
        color: var(--ch-color-muted);
      }

      textarea {
        min-height: 112px;
        resize: vertical;
      }

      input:focus,
      select:focus,
      textarea:focus {
        outline: 3px solid color-mix(in srgb, var(--ch-color-primary) 18%, transparent);
        border-color: var(--ch-color-primary);
        background: var(--ch-color-surface);
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--ch-color-primary) 10%, transparent),
          0 8px 18px color-mix(in srgb, var(--ch-color-text) 8%, transparent);
      }

      input:disabled,
      select:disabled,
      textarea:disabled {
        background: var(--ch-color-surface-muted);
        cursor: not-allowed;
        opacity: 0.78;
      }

      .boolean-control {
        display: flex;
        align-items: center;
        min-height: 42px;
        gap: 9px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
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
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 9px 11px;
      }

      :host-context([data-ui-kit='material']) input:not([type='checkbox']),
      :host-context([data-ui-kit='material']) select,
      :host-context([data-ui-kit='material']) textarea {
        min-height: 46px;
        border-width: 0 0 2px;
        border-radius: 4px 4px 0 0;
        background: color-mix(in srgb, var(--ch-color-background) 72%, var(--ch-color-surface));
        box-shadow: none;
        padding: 12px 12px 8px;
      }

      :host-context([data-ui-kit='material']) input:focus,
      :host-context([data-ui-kit='material']) select:focus,
      :host-context([data-ui-kit='material']) textarea:focus {
        outline: 0;
        border-color: var(--ch-color-primary);
        background: var(--ch-color-surface);
        box-shadow: 0 2px 0 var(--ch-color-primary);
      }

      :host-context([data-ui-kit='material']) .boolean-control,
      :host-context([data-ui-kit='material']) .option {
        border-radius: 4px;
        background: color-mix(in srgb, var(--ch-color-background) 70%, var(--ch-color-surface));
        box-shadow: none;
      }

      :host-context([data-ui-kit='bootstrap']) input:not([type='checkbox']),
      :host-context([data-ui-kit='bootstrap']) select,
      :host-context([data-ui-kit='bootstrap']) textarea {
        min-height: 38px;
        border-color: var(--ch-color-border);
        border-radius: 6px;
        background: var(--ch-color-surface);
        box-shadow: none;
        padding: 7px 12px;
      }

      :host-context([data-ui-kit='bootstrap']) input:focus,
      :host-context([data-ui-kit='bootstrap']) select:focus,
      :host-context([data-ui-kit='bootstrap']) textarea:focus {
        outline: 0;
        border-color: color-mix(in srgb, var(--ch-color-primary) 78%, var(--ch-color-surface));
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--ch-color-primary) 22%, transparent);
      }

      :host-context([data-ui-kit='bootstrap']) .boolean-control,
      :host-context([data-ui-kit='bootstrap']) .option {
        border-color: var(--ch-color-border);
        border-radius: 6px;
        background: var(--ch-color-surface);
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
          <option value="" disabled>{{ field.placeholder || 'Select an option' }}</option>
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
          <span>{{ field.placeholder || 'Yes' }}</span>
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
          <span>{{ field.placeholder || 'Yes' }}</span>
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

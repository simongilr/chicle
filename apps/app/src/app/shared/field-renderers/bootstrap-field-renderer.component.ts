import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { MobileEvidenceControlComponent } from '../mobile-form/mobile-evidence-control.component';

@Component({
  selector: 'app-bootstrap-field-renderer',
  standalone: true,
  imports: [FormsModule, MobileEvidenceControlComponent],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .form-control,
      .form-select {
        min-height: 38px;
      }

      .form-control:focus,
      .form-select:focus,
      .form-check-input:focus {
        border-color: color-mix(in srgb, var(--ch-color-primary) 72%, var(--ch-color-surface));
        box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--ch-color-primary) 24%, transparent);
      }

      .form-check,
      .form-switch {
        min-height: 42px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 9px 12px 9px 2.25rem;
      }

      .option-list {
        display: grid;
        gap: 8px;
      }
    `
  ],
  template: `
    @switch (controlType) {
      @case ('textarea') {
        <textarea
          class="form-control"
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
          class="form-select"
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
        <div class="form-check">
          <input
            class="form-check-input"
            [id]="controlId"
            [name]="field.name"
            type="checkbox"
            [disabled]="disabled || readonly"
            [ngModel]="value === true"
            (ngModelChange)="valueChange.emit($event)"
          />
          <label class="form-check-label" [attr.for]="controlId">{{ field.placeholder || 'Sí' }}</label>
        </div>
      }
      @case ('toggle') {
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            [id]="controlId"
            [name]="field.name"
            type="checkbox"
            role="switch"
            [disabled]="disabled || readonly"
            [ngModel]="value === true"
            (ngModelChange)="valueChange.emit($event)"
          />
          <label class="form-check-label" [attr.for]="controlId">{{ field.placeholder || 'Sí' }}</label>
        </div>
      }
      @case ('radio') {
        <div class="option-list" role="radiogroup">
          @for (option of field.options || []; track option.label; let index = $index) {
            <div class="form-check">
              <input
                class="form-check-input"
                [id]="controlId + '-' + index"
                [name]="field.name"
                type="radio"
                [value]="option.value"
                [disabled]="disabled || readonly"
                [ngModel]="value"
                (ngModelChange)="valueChange.emit($event)"
              />
              <label class="form-check-label" [attr.for]="controlId + '-' + index">{{ option.label }}</label>
            </div>
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
          class="form-control"
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
export class BootstrapFieldRendererComponent {
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

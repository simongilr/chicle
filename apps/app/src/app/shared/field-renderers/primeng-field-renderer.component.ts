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
        min-height: 42px;
      }

      textarea {
        min-height: 112px;
        resize: vertical;
      }

      .boolean-control {
        display: flex;
        align-items: center;
        min-height: 42px;
        gap: 9px;
        color: var(--ch-color-text);
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

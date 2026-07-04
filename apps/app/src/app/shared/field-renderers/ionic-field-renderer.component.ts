import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonCheckbox,
  IonInput,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonToggle
} from '@ionic/angular/standalone';
import { RuntimeField } from '../../engine/forms/form-runtime.service';

@Component({
  selector: 'app-ionic-field-renderer',
  standalone: true,
  imports: [IonCheckbox, IonInput, IonRadio, IonRadioGroup, IonSelect, IonSelectOption, IonTextarea, IonToggle],
  styles: [
    `
      :host,
      ion-input,
      ion-select,
      ion-textarea {
        display: block;
        width: 100%;
        min-width: 0;
      }

      ion-input,
      ion-select {
        min-height: 48px;
      }

      ion-textarea {
        min-height: 112px;
      }

      ion-toggle {
        width: 100%;
        min-height: 48px;
        --track-background-checked: var(--ch-color-primary);
      }

      ion-checkbox,
      ion-radio {
        width: 100%;
        min-height: 44px;
      }
    `
  ],
  template: `
    @switch (controlType) {
      @case ('textarea') {
        <ion-textarea
          fill="outline"
          [id]="controlId"
          [attr.name]="field.name"
          [placeholder]="field.placeholder || ''"
          [required]="field.required === true"
          [disabled]="disabled"
          [readonly]="readonly"
          [value]="stringValue"
          [autoGrow]="true"
          (ionInput)="updateText($event)"
        ></ion-textarea>
      }
      @case ('select') {
        <ion-select
          fill="outline"
          interface="popover"
          [id]="controlId"
          [attr.name]="field.name"
          [placeholder]="field.placeholder || 'Selecciona una opción'"
          [disabled]="disabled || readonly"
          [value]="value"
          (ionChange)="updateSelection($event)"
        >
          @for (option of field.options || []; track option.label) {
            <ion-select-option [value]="option.value">{{ option.label }}</ion-select-option>
          }
        </ion-select>
      }
      @case ('checkbox') {
        <ion-checkbox
          [id]="controlId"
          [attr.name]="field.name"
          labelPlacement="end"
          justify="start"
          [disabled]="disabled || readonly"
          [checked]="value === true"
          (ionChange)="updateToggle($event)"
        >
          {{ field.placeholder || 'Sí' }}
        </ion-checkbox>
      }
      @case ('toggle') {
        <ion-toggle
          [id]="controlId"
          [attr.name]="field.name"
          [disabled]="disabled || readonly"
          [checked]="value === true"
          [enableOnOffLabels]="true"
          (ionChange)="updateToggle($event)"
        >
          {{ field.placeholder || 'Sí' }}
        </ion-toggle>
      }
      @case ('radio') {
        <ion-radio-group [value]="value" (ionChange)="updateSelection($event)">
          @for (option of field.options || []; track option.label) {
            <ion-radio
              labelPlacement="end"
              justify="start"
              [value]="option.value"
              [disabled]="disabled || readonly"
            >
              {{ option.label }}
            </ion-radio>
          }
        </ion-radio-group>
      }
      @default {
        <ion-input
          fill="outline"
          [id]="controlId"
          [attr.name]="field.name"
          [type]="inputType"
          [placeholder]="field.placeholder || ''"
          [required]="field.required === true"
          [disabled]="disabled"
          [readonly]="readonly"
          [value]="value"
          (ionInput)="updateText($event)"
        ></ion-input>
      }
    }
  `
})
export class IonicFieldRendererComponent {
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

  get inputType(): 'date' | 'datetime-local' | 'email' | 'number' | 'password' | 'tel' | 'text' | 'time' | 'url' {
    const type = this.field.type.toLowerCase();
    const normalized = type === 'datetime' ? 'datetime-local' : type;
    return ['email', 'number', 'date', 'time', 'datetime-local', 'password', 'tel', 'url'].includes(normalized)
      ? (normalized as 'date' | 'datetime-local' | 'email' | 'number' | 'password' | 'tel' | 'time' | 'url')
      : 'text';
  }

  get stringValue() {
    return this.value === null || this.value === undefined ? '' : String(this.value);
  }

  updateText(event: CustomEvent<{ value?: string | null }>) {
    const value = event.detail.value ?? '';
    this.valueChange.emit(this.field.type.toLowerCase() === 'number' && value !== '' ? Number(value) : value);
  }

  updateSelection(event: CustomEvent<{ value: unknown }>) {
    this.valueChange.emit(event.detail.value);
  }

  updateToggle(event: CustomEvent<{ checked: boolean }>) {
    this.valueChange.emit(event.detail.checked);
  }
}

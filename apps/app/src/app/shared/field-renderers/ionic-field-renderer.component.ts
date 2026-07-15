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
import { MobileEvidenceControlComponent } from '../mobile-form/mobile-evidence-control.component';

@Component({
  selector: 'app-ionic-field-renderer',
  standalone: true,
  imports: [
    IonCheckbox,
    IonInput,
    IonRadio,
    IonRadioGroup,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonToggle,
    MobileEvidenceControlComponent
  ],
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
        min-height: 46px;
        --background: #ffffff;
        --border-color: #c5d6e6;
        --border-radius: var(--ch-radius);
        --border-width: 1px;
        --color: var(--ch-color-text);
        --highlight-color-focused: var(--ch-color-primary);
        --padding-end: 12px;
        --padding-start: 12px;
        --placeholder-color: #7b8fa3;
      }

      ion-textarea {
        min-height: 112px;
        --background: #ffffff;
        --border-color: #c5d6e6;
        --border-radius: var(--ch-radius);
        --border-width: 1px;
        --color: var(--ch-color-text);
        --highlight-color-focused: var(--ch-color-primary);
        --padding-end: 12px;
        --padding-start: 12px;
        --placeholder-color: #7b8fa3;
      }

      ion-toggle {
        width: 100%;
        min-height: 48px;
        border: 1px solid #d9e2ec;
        border-radius: var(--ch-radius);
        background: #fbfcfe;
        color: var(--ch-color-text);
        padding: 10px 12px;
        --track-background-checked: var(--ch-color-primary);
      }

      ion-checkbox,
      ion-radio {
        width: 100%;
        min-height: 44px;
        border: 1px solid #d9e2ec;
        border-radius: var(--ch-radius);
        background: #fbfcfe;
        color: var(--ch-color-text);
        padding: 10px 12px;
        --checkbox-background-checked: var(--ch-color-primary);
        --border-color-checked: var(--ch-color-primary);
        --color-checked: var(--ch-color-primary);
      }

      ion-radio-group {
        display: grid;
        gap: 8px;
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
    if (['textarea', 'select', 'boolean', 'checkbox', 'toggle', 'radio', 'file', 'image', 'gps'].includes(type)) {
      return type === 'boolean' ? 'checkbox' : type;
    }
    return 'input';
  }

  get inputType(): 'date' | 'datetime-local' | 'email' | 'number' | 'password' | 'tel' | 'text' | 'time' | 'url' {
    const type = this.field.type.toLowerCase();
    if (type === 'currency') {
      return 'number';
    }
    const normalized = type === 'datetime' ? 'datetime-local' : type;
    return ['email', 'number', 'date', 'time', 'datetime-local', 'password', 'tel', 'url'].includes(normalized)
      ? (normalized as 'date' | 'datetime-local' | 'email' | 'number' | 'password' | 'tel' | 'time' | 'url')
      : 'text';
  }

  get stringValue() {
    return this.value === null || this.value === undefined ? '' : String(this.value);
  }

  get accept() {
    const accept = this.field.config?.['accept'];
    return typeof accept === 'string' ? accept : undefined;
  }

  get capture() {
    const capture = this.field.config?.['capture'];
    return typeof capture === 'string' ? capture : undefined;
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

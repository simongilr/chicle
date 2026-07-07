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

      .file-control,
      .geo-control {
        display: grid;
        gap: 8px;
      }

      .file-control input[type='file'],
      .geo-control button {
        width: 100%;
        min-height: 46px;
        border: 1px solid #c5d6e6;
        border-radius: var(--ch-radius);
        background: #ffffff;
        color: var(--ch-color-text);
        padding: 10px 12px;
        font: inherit;
        text-align: left;
      }

      .file-control input[type='file'] {
        border-style: dashed;
        background: #fbfcfe;
      }

      .geo-control button {
        font-weight: 800;
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
        <div class="file-control">
          <input
            [id]="controlId"
            [attr.name]="field.name"
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
            [attr.name]="field.name"
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

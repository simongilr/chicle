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
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }

      .ionic-stack {
        display: grid;
        gap: 5px;
        width: 100%;
        min-width: 0;
      }

      .ionic-control {
        width: 100%;
        min-width: 0;
        --background: transparent;
        --border-color: var(--ch-color-border);
        --border-width: 0;
        --color: var(--ch-color-text);
        --highlight-height: 0;
        --highlight-color-focused: var(--ch-color-primary);
        --inner-border-width: 0;
        --inner-padding-bottom: 0;
        --inner-padding-end: 0;
        --inner-padding-top: 0;
        --min-height: var(--ch-control-height);
        --padding-end: 0;
        --padding-start: 0;
        --ripple-color: color-mix(in srgb, var(--ch-color-primary) 18%, transparent);
        border: 0;
        border-bottom: 1px solid var(--ch-color-border);
        border-radius: 0;
        background: transparent;
        transition:
          border-color 140ms ease,
          background-color 140ms ease;
      }

      .ionic-control:hover,
      .ionic-control:focus-within {
        border-color: var(--ch-color-primary);
      }

      .ionic-control--invalid {
        --border-color: var(--ch-color-danger);
        border-color: var(--ch-color-danger);
      }

      ion-input,
      ion-select,
      ion-textarea {
        display: block;
        width: 100%;
        min-width: 0;
        --color: var(--ch-color-text);
        --highlight-color-focused: var(--ch-color-primary);
        --padding-bottom: 0;
        --padding-end: 0;
        --padding-start: 0;
        --padding-top: 0;
        --placeholder-color: var(--ch-color-muted);
        color: var(--ch-color-text);
        font: inherit;
      }

      ion-input::part(label),
      ion-select::part(label),
      ion-textarea::part(label) {
        color: var(--ch-color-text);
      }

      ion-input::part(label),
      ion-select::part(label),
      ion-textarea::part(label) {
        font-size: 0.82rem;
        font-weight: 800;
      }

      ion-input::part(native),
      ion-textarea::part(native) {
        width: 100%;
        min-width: 0;
        min-height: calc(var(--ch-control-height) - 10px);
        border: 0 !important;
        outline: 0 !important;
        appearance: none;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--ch-color-text);
        font: inherit;
        padding: 0 !important;
      }

      :host ::ng-deep ion-input input,
      :host ::ng-deep ion-textarea textarea {
        min-height: calc(var(--ch-control-height) - 10px) !important;
        border: 0 !important;
        outline: 0 !important;
        appearance: none !important;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--ch-color-text) !important;
        font: inherit !important;
        padding: 0 !important;
      }

      ion-textarea {
        min-height: 104px;
      }

      ion-select::part(container) {
        width: 100%;
        min-height: calc(var(--ch-control-height) - 10px);
        padding: 0 !important;
      }

      ion-select::part(text),
      ion-select::part(placeholder) {
        color: var(--ch-color-text);
        font: inherit;
      }

      ion-select::part(placeholder) {
        color: var(--ch-color-muted);
        opacity: 1;
      }

      ion-select::part(icon) {
        color: var(--ch-color-text);
        opacity: 0.78;
      }

      .ionic-note {
        display: block;
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        line-height: 1.35;
      }

      .ionic-note--error {
        color: var(--ch-color-danger);
        font-weight: 750;
      }

      .toggle-shell,
      .choice-shell {
        width: 100%;
        min-height: 48px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 10px 12px;
      }

      ion-toggle {
        width: 100%;
        --track-background-checked: var(--ch-color-primary);
      }

      ion-checkbox,
      ion-radio {
        width: 100%;
        min-height: 44px;
        color: var(--ch-color-text);
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
        <div class="ionic-stack">
          <ion-textarea
            class="ionic-control"
            [class.ionic-control--invalid]="!!error"
            [labelPlacement]="ionicLabelPlacement"
            [label]="labelText"
            [id]="controlId"
            [attr.name]="field.name"
            [placeholder]="field.placeholder || ''"
            [required]="field.required === true"
            [disabled]="disabled"
            [readonly]="readonly"
            [value]="stringValue"
            [autoGrow]="true"
            (input)="updateNativeText($event)"
            (ionInput)="updateText($event)"
          ></ion-textarea>
          @if (error) {
            <span class="ionic-note ionic-note--error" role="alert">{{ error }}</span>
          } @else if (help) {
            <span class="ionic-note">{{ help }}</span>
          }
        </div>
      }
      @case ('select') {
        <div class="ionic-stack">
          <ion-select
            class="ionic-control"
            [class.ionic-control--invalid]="!!error"
            interface="popover"
            [labelPlacement]="ionicLabelPlacement"
            [label]="labelText"
            [id]="controlId"
            [attr.name]="field.name"
            [placeholder]="field.placeholder || 'Select an option'"
            [disabled]="disabled || readonly"
            [value]="value"
            (ionChange)="updateSelection($event)"
          >
            @for (option of field.options || []; track option.value) {
              <ion-select-option [value]="option.value">{{ option.label }}</ion-select-option>
            }
          </ion-select>
          @if (error) {
            <span class="ionic-note ionic-note--error" role="alert">{{ error }}</span>
          } @else if (help) {
            <span class="ionic-note">{{ help }}</span>
          }
        </div>
      }
      @case ('checkbox') {
        <div class="choice-shell">
          <ion-checkbox
            [id]="controlId"
            [attr.name]="field.name"
            labelPlacement="end"
            justify="start"
            [disabled]="disabled || readonly"
            [checked]="value === true"
            (ionChange)="updateToggle($event)"
          >
            {{ field.placeholder || 'Yes' }}
          </ion-checkbox>
        </div>
      }
      @case ('toggle') {
        <div class="toggle-shell">
          <ion-toggle
            [id]="controlId"
            [attr.name]="field.name"
            [disabled]="disabled || readonly"
            [checked]="value === true"
            [enableOnOffLabels]="true"
            (ionChange)="updateToggle($event)"
          >
            {{ field.placeholder || 'Yes' }}
          </ion-toggle>
        </div>
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
        <div class="ionic-stack">
          <ion-input
            class="ionic-control"
            [class.ionic-control--invalid]="!!error"
            [labelPlacement]="ionicLabelPlacement"
            [label]="labelText"
            [id]="controlId"
            [attr.name]="field.name"
            [type]="inputType"
            [placeholder]="field.placeholder || ''"
            [required]="field.required === true"
            [disabled]="disabled"
            [readonly]="readonly"
            [value]="stringValue"
            (input)="updateNativeText($event)"
            (ionInput)="updateText($event)"
          ></ion-input>
          @if (error) {
            <span class="ionic-note ionic-note--error" role="alert">{{ error }}</span>
          } @else if (help) {
            <span class="ionic-note">{{ help }}</span>
          }
        </div>
      }
    }
  `
})
export class IonicFieldRendererComponent {
  @Input({ required: true }) field!: RuntimeField;
  @Input({ required: true }) controlId = '';
  @Input() value: unknown = '';
  @Input() help = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() showLabel = true;
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

  get plainLabel() {
    return this.field.label || this.field.name;
  }

  get labelText() {
    if (!this.showLabel) {
      return undefined;
    }
    const label = this.plainLabel;
    return this.field.required === true ? `${label} *` : label;
  }

  get ionicLabelPlacement(): 'stacked' | undefined {
    return this.showLabel ? 'stacked' : undefined;
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

  updateNativeText(event: Event) {
    const target = event.target as { value?: unknown } | null;
    const value = typeof target?.value === 'string' ? target.value : '';
    this.valueChange.emit(this.field.type.toLowerCase() === 'number' && value !== '' ? Number(value) : value);
  }

  updateSelection(event: CustomEvent<{ value: unknown }>) {
    this.valueChange.emit(event.detail.value);
  }

  updateToggle(event: CustomEvent<{ checked: boolean }>) {
    this.valueChange.emit(event.detail.checked);
  }

}

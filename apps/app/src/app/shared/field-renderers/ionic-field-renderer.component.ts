import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import {
  IonCheckbox,
  IonInput,
  IonItem,
  IonRadio,
  IonRadioGroup,
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
    IonItem,
    IonRadio,
    IonRadioGroup,
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

      .ionic-select-shell {
        position: relative;
      }

      .ionic-line-control {
        position: relative;
        display: grid;
        gap: 3px;
        width: 100%;
        min-width: 0;
        min-height: 54px;
        border: 0;
        border-bottom: 1px solid var(--ch-color-border);
        background: transparent;
        color: var(--ch-color-text);
        padding: 0 0 7px;
        text-align: left;
        transition: border-color 140ms ease;
      }

      .ionic-line-control:focus-within,
      .ionic-line-control:hover {
        border-bottom-color: var(--ch-color-primary);
      }

      .ionic-line-control--invalid {
        border-bottom-color: var(--ch-color-danger);
      }

      .ionic-line-label {
        color: var(--ch-color-text);
        font-size: 0.78rem;
        font-weight: 850;
        line-height: 1.2;
      }

      .ionic-line-label .required {
        color: var(--ch-color-danger);
      }

      .ionic-select-display {
        font: inherit;
        cursor: pointer;
      }

      .ionic-select-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 28px;
        min-width: 0;
      }

      .ionic-select-value {
        min-width: 0;
        overflow: hidden;
        color: var(--ch-color-text);
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ionic-select-value--placeholder {
        color: var(--ch-color-muted);
      }

      .ionic-select-chevron {
        flex: 0 0 auto;
        color: var(--ch-color-text);
        font-size: 0.78rem;
        line-height: 1;
        opacity: 0.78;
      }

      ion-item.ionic-field {
        width: 100%;
        min-width: 0;
        --background: transparent;
        --border-color: var(--ch-color-border);
        --color: var(--ch-color-text);
        --highlight-color-focused: var(--ch-color-primary);
        --inner-border-width: 0 0 1px 0;
        --inner-padding-end: 0;
        --min-height: 56px;
        --padding-end: 0;
        --padding-start: 0;
        --ripple-color: color-mix(in srgb, var(--ch-color-primary) 18%, transparent);
        background: transparent;
      }

      ion-item.ionic-field--invalid {
        --border-color: var(--ch-color-danger);
      }

      ion-input,
      ion-textarea {
        display: block;
        width: 100%;
        min-width: 0;
        --color: var(--ch-color-text);
        --highlight-color-focused: var(--ch-color-primary);
        --placeholder-color: var(--ch-color-muted);
        color: var(--ch-color-text);
        font: inherit;
      }

      ion-input::part(label),
      ion-textarea::part(label) {
        color: var(--ch-color-text);
      }

      ion-input::part(label),
      ion-textarea::part(label) {
        font-size: 0.82rem;
        font-weight: 800;
      }

      ion-input::part(native),
      ion-textarea::part(native) {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: 0;
        appearance: none;
        background: transparent;
        box-shadow: none;
        color: var(--ch-color-text);
        font: inherit;
      }

      :host ::ng-deep ion-input.ionic-line-input .input-wrapper,
      :host ::ng-deep ion-input.ionic-line-input .native-wrapper,
      :host ::ng-deep ion-input.ionic-line-input .native-input {
        display: block;
        width: 100%;
        min-width: 0;
      }

      :host ::ng-deep ion-input.ionic-line-input .input-wrapper {
        min-height: 28px;
      }

      :host ::ng-deep ion-input.ionic-line-input .native-input {
        min-height: 28px;
        border: 0 !important;
        outline: 0 !important;
        appearance: none;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--ch-color-text);
        font: inherit;
        line-height: 1.35;
        padding: 0 !important;
      }

      :host ::ng-deep ion-input.ionic-line-input .native-input::placeholder {
        color: var(--ch-color-muted);
        opacity: 1;
      }

      ion-input.ionic-line-input {
        min-height: 28px;
        --padding-bottom: 0;
        --padding-end: 0;
        --padding-start: 0;
        --padding-top: 0;
      }

      ion-textarea {
        min-height: 104px;
      }

      .ionic-options-panel {
        position: absolute;
        z-index: 35;
        top: calc(100% + 6px);
        right: 0;
        left: 0;
        width: 100%;
        max-height: 220px;
        overflow: auto;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
        padding: 6px;
      }

      .ionic-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        min-height: 36px;
        border: 0;
        border-radius: calc(var(--ch-radius) - 2px);
        background: transparent;
        color: var(--ch-color-text);
        padding: 8px 10px;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }

      .ionic-option:hover,
      .ionic-option--selected {
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      .ionic-option-check {
        color: var(--ch-color-primary);
        font-size: 0.8rem;
        font-weight: 900;
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
          <ion-item class="ionic-field" [class.ionic-field--invalid]="!!error" lines="full" mode="md">
          <ion-textarea
            mode="md"
            labelPlacement="stacked"
            [label]="labelText"
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
          </ion-item>
          @if (error) {
            <span class="ionic-note ionic-note--error" role="alert">{{ error }}</span>
          } @else if (help) {
            <span class="ionic-note">{{ help }}</span>
          }
        </div>
      }
      @case ('select') {
        <div class="ionic-stack ionic-select-shell">
          <button
            type="button"
            class="ionic-line-control ionic-select-display"
            [class.ionic-line-control--invalid]="!!error"
            [disabled]="disabled || readonly"
            [attr.aria-expanded]="selectOpen"
            [attr.aria-controls]="controlId + '-options'"
            (click)="toggleSelect($event)"
          >
            <span class="ionic-line-label">
              {{ plainLabel }}
              @if (field.required === true) {
                <span class="required">*</span>
              }
            </span>
            <span class="ionic-select-row">
              <span
                class="ionic-select-value"
                [class.ionic-select-value--placeholder]="!selectedOptionLabel"
              >
                {{ selectedOptionLabel || field.placeholder || 'Selecciona una opción' }}
              </span>
              <span class="ionic-select-chevron" aria-hidden="true">▾</span>
            </span>
          </button>
          @if (selectOpen && !disabled && !readonly) {
            <div class="ionic-options-panel" [id]="controlId + '-options'" role="listbox">
              @for (option of field.options || []; track option.value) {
                <button
                  type="button"
                  class="ionic-option"
                  role="option"
                  [class.ionic-option--selected]="isSelected(option.value)"
                  [attr.aria-selected]="isSelected(option.value)"
                  (click)="chooseOption(option.value, $event)"
                >
                  <span>{{ option.label }}</span>
                  @if (isSelected(option.value)) {
                    <span class="ionic-option-check" aria-hidden="true">✓</span>
                  }
                </button>
              }
            </div>
          }
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
            {{ field.placeholder || 'Sí' }}
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
            {{ field.placeholder || 'Sí' }}
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
          <div
            class="ionic-line-control"
            [class.ionic-line-control--invalid]="!!error"
            (click)="focusInput(inputControl)"
          >
            <span class="ionic-line-label" [id]="controlId + '-label'">
              {{ plainLabel }}
              @if (field.required === true) {
                <span class="required">*</span>
              }
            </span>
          <ion-input
            #inputControl
            class="ionic-line-input"
            mode="md"
            [id]="controlId"
            [attr.aria-labelledby]="controlId + '-label'"
            [attr.name]="field.name"
            [type]="inputType"
            [placeholder]="field.placeholder || ''"
            [required]="field.required === true"
            [disabled]="disabled"
            [readonly]="readonly"
            [value]="stringValue"
            (click)="$event.stopPropagation()"
            (ionInput)="updateText($event)"
          ></ion-input>
          </div>
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input({ required: true }) field!: RuntimeField;
  @Input({ required: true }) controlId = '';
  @Input() value: unknown = '';
  @Input() help = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Output() readonly valueChange = new EventEmitter<unknown>();
  selectOpen = false;

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
    const label = this.plainLabel;
    return this.field.required === true ? `${label} *` : label;
  }

  get selectedOptionLabel() {
    const option = (this.field.options || []).find((item) => this.sameValue(item.value, this.value));
    return option?.label || '';
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

  focusInput(input: IonInput) {
    if (this.disabled || this.readonly) {
      return;
    }
    void input.setFocus();
  }

  toggleSelect(event: Event) {
    event.stopPropagation();
    if (this.disabled || this.readonly) {
      return;
    }
    this.selectOpen = !this.selectOpen;
  }

  chooseOption(value: unknown, event: Event) {
    event.stopPropagation();
    this.selectOpen = false;
    this.valueChange.emit(value);
  }

  isSelected(value: unknown) {
    return this.sameValue(value, this.value);
  }

  @HostListener('document:click', ['$event'])
  closeSelectOnOutside(event: MouseEvent) {
    if (!this.selectOpen || this.host.nativeElement.contains(event.target as Node)) {
      return;
    }
    this.selectOpen = false;
  }

  private sameValue(left: unknown, right: unknown) {
    return left === right || String(left) === String(right);
  }
}

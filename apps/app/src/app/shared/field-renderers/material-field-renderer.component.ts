import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { MobileEvidenceControlComponent } from '../mobile-form/mobile-evidence-control.component';

@Component({
  selector: 'app-material-field-renderer',
  standalone: true,
  imports: [
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MobileEvidenceControlComponent
  ],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .material-field {
        width: 100%;
        min-width: 0;
        --mdc-outlined-text-field-container-shape: var(--ch-kit-control-radius, 4px);
        --mdc-outlined-text-field-outline-color: var(--ch-color-border);
        --mdc-outlined-text-field-hover-outline-color: var(--ch-color-primary-border);
        --mdc-outlined-text-field-focus-outline-color: var(--ch-color-primary);
        --mdc-outlined-text-field-input-text-color: var(--ch-color-text);
        --mdc-outlined-text-field-caret-color: var(--ch-color-primary);
        --mdc-outlined-text-field-label-text-color: var(--ch-color-muted);
        --mdc-outlined-text-field-focus-label-text-color: var(--ch-color-primary);
        --mdc-outlined-text-field-disabled-input-text-color: var(--ch-color-muted);
        --mdc-outlined-text-field-disabled-outline-color: color-mix(in srgb, var(--ch-color-border) 70%, transparent);
        --mat-form-field-container-height: var(--ch-control-height);
        --mat-form-field-container-vertical-padding: 0;
        --mat-select-enabled-trigger-text-color: var(--ch-color-text);
        --mat-select-placeholder-text-color: var(--ch-color-muted);
        --mat-select-disabled-trigger-text-color: var(--ch-color-muted);
        display: block;
      }

      :host ::ng-deep .mat-mdc-text-field-wrapper {
        height: var(--ch-control-height);
        min-height: var(--ch-control-height);
        background: var(--ch-color-surface);
        padding-inline: 12px;
      }

      :host ::ng-deep .mat-mdc-form-field-flex {
        height: var(--ch-control-height);
        min-height: var(--ch-control-height);
        align-items: center;
      }

      :host ::ng-deep .mat-mdc-form-field-infix {
        display: flex;
        align-items: center;
        width: auto;
        min-width: 0;
        height: var(--ch-control-height);
        min-height: 0;
        padding-top: 0;
        padding-bottom: 0;
      }

      :host ::ng-deep .mat-mdc-floating-label {
        display: none;
      }

      :host ::ng-deep .mat-mdc-select-trigger {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 24px;
        min-width: 0;
        line-height: 1.35;
      }

      :host ::ng-deep .mat-mdc-select-value {
        color: var(--ch-color-text);
        min-width: 0;
        overflow: hidden;
      }

      :host ::ng-deep .mat-mdc-select-value-text {
        color: var(--ch-color-text);
        font: inherit;
        line-height: 1.35;
      }

      :host ::ng-deep .mat-mdc-select-placeholder {
        color: var(--ch-color-muted);
        opacity: 0.82;
      }

      :host ::ng-deep .mat-mdc-select-arrow,
      :host ::ng-deep .mat-mdc-select-arrow svg {
        color: var(--ch-color-muted);
        fill: var(--ch-color-muted);
      }

      :host ::ng-deep input.mat-mdc-input-element {
        min-height: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--ch-color-text) !important;
        outline: 0 !important;
        padding: 0 !important;
        line-height: 1.35 !important;
        caret-color: var(--ch-color-primary) !important;
      }

      :host ::ng-deep input.mat-mdc-input-element::placeholder,
      :host ::ng-deep textarea.mat-mdc-input-element::placeholder {
        color: var(--ch-color-muted);
        opacity: 0.82;
      }

      :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      .textarea-field ::ng-deep .mat-mdc-text-field-wrapper,
      .textarea-field ::ng-deep .mat-mdc-form-field-flex,
      .textarea-field ::ng-deep .mat-mdc-form-field-infix {
        height: auto;
        min-height: 86px;
        align-items: stretch;
      }

      .textarea-field ::ng-deep textarea.mat-mdc-input-element {
        min-height: 74px !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--ch-color-text) !important;
        outline: 0 !important;
        padding: 10px 0 !important;
        resize: vertical;
      }

      .boolean-control,
      .option-list {
        display: grid;
        gap: 8px;
        min-height: 42px;
      }

      .toggle-control,
      mat-checkbox,
      mat-radio-button {
        min-height: 42px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 9px 11px;
      }
    `
  ],
  template: `
    @switch (controlType) {
      @case ('textarea') {
        <mat-form-field class="material-field textarea-field" appearance="outline" subscriptSizing="dynamic">
          <textarea
            matInput
            [id]="controlId"
            [name]="field.name"
            [placeholder]="field.placeholder || ''"
            [required]="field.required === true"
            [disabled]="disabled"
            [readonly]="readonly"
            [ngModel]="value"
            (ngModelChange)="valueChange.emit($event)"
          ></textarea>
        </mat-form-field>
      }
      @case ('select') {
        <mat-form-field class="material-field" appearance="outline" subscriptSizing="dynamic">
          <mat-select
            [id]="controlId"
            [name]="field.name"
            [placeholder]="field.placeholder || 'Select an option'"
            [required]="field.required === true"
            [disabled]="disabled || readonly"
            [ngModel]="value"
            (ngModelChange)="valueChange.emit($event)"
          >
            @for (option of field.options || []; track option.label) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
      @case ('checkbox') {
        <mat-checkbox
          [id]="controlId"
          [name]="field.name"
          [disabled]="disabled || readonly"
          [ngModel]="value === true"
          (ngModelChange)="valueChange.emit($event)"
        >
          {{ field.placeholder || 'Yes' }}
        </mat-checkbox>
      }
      @case ('toggle') {
        <mat-slide-toggle
          class="toggle-control"
          [id]="controlId"
          [name]="field.name"
          [disabled]="disabled || readonly"
          [ngModel]="value === true"
          (ngModelChange)="valueChange.emit($event)"
        >
          {{ field.placeholder || 'Yes' }}
        </mat-slide-toggle>
      }
      @case ('radio') {
        <mat-radio-group class="option-list" [ngModel]="value" (ngModelChange)="valueChange.emit($event)">
          @for (option of field.options || []; track option.label) {
            <mat-radio-button [value]="option.value" [disabled]="disabled || readonly">
              {{ option.label }}
            </mat-radio-button>
          }
        </mat-radio-group>
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
        <mat-form-field class="material-field" appearance="outline" subscriptSizing="dynamic">
          <input
            matInput
            [id]="controlId"
            [name]="field.name"
            [type]="inputType"
            [placeholder]="field.placeholder || ''"
            [required]="field.required === true"
            [disabled]="disabled"
            [readonly]="readonly"
            [ngModel]="value"
            (ngModelChange)="valueChange.emit($event)"
          />
        </mat-form-field>
      }
    }
  `
})
export class MaterialFieldRendererComponent {
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

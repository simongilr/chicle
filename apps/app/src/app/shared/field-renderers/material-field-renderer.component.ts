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

      mat-form-field {
        width: 100%;
      }

      :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
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
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
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
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-select
            [id]="controlId"
            [name]="field.name"
            [placeholder]="field.placeholder || 'Selecciona una opción'"
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
          {{ field.placeholder || 'Sí' }}
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
          {{ field.placeholder || 'Sí' }}
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
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
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

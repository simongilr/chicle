import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { DynamicFieldControlComponent } from '../dynamic-field-control/dynamic-field-control.component';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';

export interface SchemaFieldEditorValue {
  name: string;
  type: string;
  length: number;
  precision: number;
  scale: number;
  nullable: boolean;
  defaultValue: string;
}

@Component({
  selector: 'app-schema-field-editor',
  standalone: true,
  imports: [DynamicFieldControlComponent, UiKitButtonComponent],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .schema-editor {
        display: grid;
        grid-template-columns:
          minmax(140px, 1fr)
          minmax(118px, 140px)
          minmax(82px, 96px)
          minmax(96px, 120px)
          minmax(92px, auto)
          auto;
        gap: 8px;
        align-items: end;
        min-width: 0;
        border: 1px solid var(--ch-color-surface-muted);
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-surface) 88%, var(--ch-color-background));
        padding: 10px;
      }

      .nullable-slot {
        min-width: 0;
      }

      .remove-slot {
        display: flex;
        align-items: end;
      }

      @media (max-width: 940px) {
        .schema-editor {
          grid-template-columns: 1fr;
        }

        .remove-slot {
          display: block;
        }
      }
    `
  ],
  template: `
    <div class="schema-editor">
      <app-dynamic-field-control
        [field]="nameField"
        [value]="field.name"
        (valueChange)="update('name', asString($event))"
      ></app-dynamic-field-control>
      <app-dynamic-field-control
        [field]="typeField"
        [value]="field.type"
        (valueChange)="update('type', asString($event))"
      ></app-dynamic-field-control>
      <app-dynamic-field-control
        [field]="lengthField"
        [value]="field.length"
        [disabled]="field.type !== 'string'"
        (valueChange)="update('length', asNumber($event, 180))"
      ></app-dynamic-field-control>
      <app-dynamic-field-control
        [field]="defaultField"
        [value]="field.defaultValue"
        (valueChange)="update('defaultValue', asString($event))"
      ></app-dynamic-field-control>
      <div class="nullable-slot">
        <app-dynamic-field-control
          [field]="nullableField"
          [value]="field.nullable"
          (valueChange)="update('nullable', asBoolean($event))"
        ></app-dynamic-field-control>
      </div>
      @if (showRemove) {
        <div class="remove-slot">
          <app-ui-kit-button
            label="Quitar"
            tone="secondary"
            variant="outline"
            [disabled]="!removable"
            (pressed)="remove.emit()"
          ></app-ui-kit-button>
        </div>
      }
    </div>
  `
})
export class SchemaFieldEditorComponent {
  @Input({ required: true }) field!: SchemaFieldEditorValue;
  @Input() columnTypes: string[] = [];
  @Input() removable = true;
  @Input() showRemove = true;
  @Output() readonly fieldChange = new EventEmitter<SchemaFieldEditorValue>();
  @Output() readonly remove = new EventEmitter<void>();

  readonly nameField: RuntimeField = {
    name: 'schemaFieldName',
    type: 'text',
    label: 'Campo',
    placeholder: 'name'
  };
  readonly lengthField: RuntimeField = {
    name: 'schemaFieldLength',
    type: 'number',
    label: 'Longitud',
    placeholder: '180'
  };
  readonly defaultField: RuntimeField = {
    name: 'schemaFieldDefault',
    type: 'text',
    label: 'Default',
    placeholder: 'default'
  };
  readonly nullableField: RuntimeField = {
    name: 'schemaFieldNullable',
    type: 'checkbox',
    label: 'Nullable'
  };

  get typeField(): RuntimeField {
    return {
      name: 'schemaFieldType',
      type: 'select',
      label: 'Tipo',
      options: this.columnTypes.map((type) => ({ label: type, value: type }))
    };
  }

  update(key: keyof SchemaFieldEditorValue, value: SchemaFieldEditorValue[keyof SchemaFieldEditorValue]) {
    this.fieldChange.emit({
      ...this.field,
      [key]: value
    });
  }

  asString(value: unknown) {
    return value == null ? '' : String(value);
  }

  asNumber(value: unknown, fallback: number) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  asBoolean(value: unknown) {
    return value === true || value === 'true' || value === '1';
  }
}

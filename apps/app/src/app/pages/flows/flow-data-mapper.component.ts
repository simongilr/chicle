import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { UiKitAwareComponent } from '../../shared/ui-kit/ui-kit-aware.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';

export interface FlowMapRow {
  key: string;
  value: string;
}

export interface FlowDataOption {
  group: 'input' | 'steps' | 'context' | 'literal';
  label: string;
  value: string;
  detail?: string;
}

@Component({
  selector: 'app-flow-data-mapper',
  standalone: true,
  imports: [DynamicFieldControlComponent, UiKitButtonComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .mapper {
        display: grid;
        gap: 9px;
      }

      .row {
        display: grid;
        grid-template-columns: minmax(130px, 0.65fr) minmax(210px, 1.35fr) auto;
        gap: 8px;
        align-items: end;
      }

      label {
        display: grid;
        gap: 5px;
        color: var(--ch-color-text);
        font-size: 0.86rem;
        font-weight: 800;
      }

      .empty {
        border: 1px dashed var(--ch-color-primary-border);
        border-radius: 7px;
        padding: 11px;
        color: var(--ch-color-muted);
      }

      @media (max-width: 680px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <div class="mapper">
      @for (row of rows; track $index) {
        <div class="row">
          <app-dynamic-field-control
            [field]="rowKeyField($index)"
            [value]="row.key"
            (valueChange)="setRowKey($index, $event)"
          ></app-dynamic-field-control>
          <app-dynamic-field-control
            [field]="rowValueField($index)"
            [value]="row.value"
            (valueChange)="setRowValue($index, $event)"
          ></app-dynamic-field-control>
          <app-ui-kit-button
            label=""
            icon="pi pi-trash"
            tone="danger"
            variant="outline"
            (pressed)="remove($index)"
          ></app-ui-kit-button>
          @if (row.value === '__manual__' || !isKnownOption(row.value)) {
            <div style="grid-column: 2 / -1;">
              <app-dynamic-field-control
                [field]="manualValueField($index)"
                [value]="row.value === '__manual__' ? '' : row.value"
                (valueChange)="setManualValue($index, $event)"
              ></app-dynamic-field-control>
            </div>
          }
        </div>
      } @empty {
        <div class="empty">Este paso no necesita datos todavía.</div>
      }

      <app-ui-kit-button
        label="Agregar dato"
        icon="pi pi-plus"
        tone="secondary"
        variant="outline"
        (pressed)="add()"
      ></app-ui-kit-button>
    </div>
  `
})
export class FlowDataMapperComponent extends UiKitAwareComponent {
  @Input() rows: FlowMapRow[] = [];
  @Input() options: FlowDataOption[] = [];
  @Output() rowsChange = new EventEmitter<FlowMapRow[]>();

  readonly optionGroups: Array<{ key: FlowDataOption['group']; label: string }> = [
    { key: 'input', label: 'Datos iniciales del proceso' },
    { key: 'steps', label: 'Resultados de pasos anteriores' },
    { key: 'context', label: 'Organización y usuario actual' },
    { key: 'literal', label: 'Valores frecuentes' }
  ];

  rowKeyField(index: number): RuntimeField {
    return {
      name: `map_key_${index}`,
      type: 'text',
      label: 'Dato que necesita',
      placeholder: 'email'
    };
  }

  rowValueField(index: number): RuntimeField {
    return {
      name: `map_value_${index}`,
      type: 'select',
      label: 'Tomar el valor de',
      options: [
        { label: 'Selecciona un dato', value: '' },
        ...this.groupedOptions,
        { label: 'Escribir valor o ruta manual', value: '__manual__' }
      ]
    };
  }

  manualValueField(index: number): RuntimeField {
    return {
      name: `map_manual_${index}`,
      type: 'text',
      label: 'Valor manual',
      placeholder: 'Texto fijo o {{input.campo}}'
    };
  }

  get groupedOptions() {
    return this.optionGroups.flatMap((group) =>
      this.optionsFor(group.key).map((option) => ({
        label: `${group.label}: ${option.label}`,
        value: option.value
      }))
    );
  }

  optionsFor(group: FlowDataOption['group']) {
    return this.options.filter((option) => option.group === group);
  }

  isKnownOption(value: string) {
    return !value || value === '__manual__' || this.options.some((option) => option.value === value);
  }

  add() {
    this.rows = [...this.rows, { key: '', value: '' }];
    this.emitRows();
  }

  setRowKey(index: number, value: unknown) {
    this.rows = this.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, key: this.controlString(value) } : row
    );
    this.emitRows();
  }

  setRowValue(index: number, value: unknown) {
    this.rows = this.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, value: this.controlString(value) } : row
    );
    this.emitRows();
  }

  remove(index: number) {
    this.rows = this.rows.filter((_, rowIndex) => rowIndex !== index);
    this.emitRows();
  }

  setManualValue(index: number, value: unknown) {
    this.rows = this.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, value: this.controlString(value) } : row
    );
    this.emitRows();
  }

  emitRows() {
    this.rowsChange.emit(this.rows.map((row) => ({ ...row })));
  }

  private controlString(value: unknown) {
    return typeof value === 'string' ? value : value == null ? '' : String(value);
  }
}

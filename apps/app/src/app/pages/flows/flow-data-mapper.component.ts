import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  imports: [FormsModule],
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
        color: #153b61;
        font-size: 0.86rem;
        font-weight: 800;
      }

      input,
      select {
        width: 100%;
        min-height: 38px;
        border: 1px solid #b9cfe6;
        border-radius: 7px;
        padding: 8px 10px;
        background: #fff;
        color: #153b61;
        font: inherit;
      }

      button {
        min-height: 38px;
        border: 1px solid #bfd2e5;
        border-radius: 7px;
        background: #fff;
        color: #153b61;
        cursor: pointer;
      }

      .empty {
        border: 1px dashed #b9cfe6;
        border-radius: 7px;
        padding: 11px;
        color: #587087;
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
          <label>
            Dato que necesita
            <input [(ngModel)]="row.key" (ngModelChange)="emitRows()" placeholder="email" />
          </label>
          <label>
            Tomar el valor de
            <select [(ngModel)]="row.value" (ngModelChange)="emitRows()">
              <option value="">Selecciona un dato</option>
              @for (group of optionGroups; track group.key) {
                <optgroup [label]="group.label">
                  @for (option of optionsFor(group.key); track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </optgroup>
              }
              <option value="__manual__">Escribir valor o ruta manual</option>
            </select>
          </label>
          <button type="button" title="Quitar mapeo" (click)="remove($index)">
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
          @if (row.value === '__manual__' || !isKnownOption(row.value)) {
            <label style="grid-column: 2 / -1;">
              Valor manual
              <input
                [ngModel]="row.value === '__manual__' ? '' : row.value"
                (ngModelChange)="setManualValue($index, $event)"
                [placeholder]="'Texto fijo o {{input.campo}}'"
              />
            </label>
          }
        </div>
      } @empty {
        <div class="empty">Este paso no necesita datos todavía.</div>
      }

      <button type="button" (click)="add()"><i class="pi pi-plus" aria-hidden="true"></i> Agregar dato</button>
    </div>
  `
})
export class FlowDataMapperComponent {
  @Input() rows: FlowMapRow[] = [];
  @Input() options: FlowDataOption[] = [];
  @Output() rowsChange = new EventEmitter<FlowMapRow[]>();

  readonly optionGroups: Array<{ key: FlowDataOption['group']; label: string }> = [
    { key: 'input', label: 'Datos iniciales del proceso' },
    { key: 'steps', label: 'Resultados de pasos anteriores' },
    { key: 'context', label: 'Organización y usuario actual' },
    { key: 'literal', label: 'Valores frecuentes' }
  ];

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

  remove(index: number) {
    this.rows = this.rows.filter((_, rowIndex) => rowIndex !== index);
    this.emitRows();
  }

  setManualValue(index: number, value: string) {
    this.rows = this.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, value } : row));
    this.emitRows();
  }

  emitRows() {
    this.rowsChange.emit(this.rows.map((row) => ({ ...row })));
  }
}

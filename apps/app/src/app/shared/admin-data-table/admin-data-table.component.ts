import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export interface AdminDataColumn {
  name: string;
  label?: string;
}

@Component({
  selector: 'app-admin-data-table',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .table-wrap {
        max-width: 100%;
        overflow: auto;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
      }

      table {
        width: 100%;
        min-width: 720px;
        border-collapse: collapse;
      }

      th,
      td {
        border-bottom: 1px solid var(--ch-color-border);
        padding: 10px 12px;
        text-align: left;
        vertical-align: top;
      }

      th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        font-size: 0.82rem;
        font-weight: 850;
      }

      td {
        color: var(--ch-color-text);
        font-size: 0.9rem;
      }

      .cell {
        display: block;
        max-width: 260px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .row-button {
        min-height: 34px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 6px 10px;
        font: inherit;
        font-weight: 850;
      }

      .row-button:hover,
      .row-button:focus-visible {
        border-color: var(--ch-color-primary);
        color: var(--ch-color-primary);
        outline: none;
      }

      .empty {
        color: var(--ch-color-muted);
        padding: 16px;
      }

      :host([data-ui-kit='material']) .table-wrap,
      :host([data-ui-kit='material']) .row-button {
        border-radius: 4px;
      }

      :host([data-ui-kit='bootstrap']) .table-wrap,
      :host([data-ui-kit='bootstrap']) .row-button {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .table-wrap {
        border-radius: 14px;
      }
    `
  ],
  template: `
    <div class="table-wrap">
      @if (!rows.length) {
        <p class="empty">{{ emptyMessage }}</p>
      } @else {
        <table>
          <thead>
            <tr>
              @if (showDetailAction) {
                <th style="width: 84px">{{ detailLabel }}</th>
              }
              @for (column of normalizedColumns; track column.name) {
                <th>{{ column.label || column.name }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track rowTrack(row, $index)) {
              <tr>
                @if (showDetailAction) {
                  <td>
                    <button class="row-button" type="button" (click)="rowSelected.emit(row)">
                      {{ detailActionLabel }}
                    </button>
                  </td>
                }
                @for (column of normalizedColumns; track column.name) {
                  <td>
                    <span class="cell" [title]="formatCell(row[column.name])">
                      {{ formatCell(row[column.name]) }}
                    </span>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class AdminDataTableComponent extends UiKitAwareComponent {
  @Input() columns: ReadonlyArray<string | AdminDataColumn> = [];
  @Input() rows: ReadonlyArray<Record<string, unknown>> = [];
  @Input() emptyMessage = 'No rows to display.';
  @Input() showDetailAction = true;
  @Input() detailLabel = 'Detail';
  @Input() detailActionLabel = 'View';

  @Output() rowSelected = new EventEmitter<Record<string, unknown>>();

  get normalizedColumns(): AdminDataColumn[] {
    return this.columns.map((column) => (typeof column === 'string' ? { name: column } : column));
  }

  rowTrack(row: Record<string, unknown>, index: number) {
    return typeof row['id'] === 'string' ? row['id'] : index;
  }

  formatCell(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}

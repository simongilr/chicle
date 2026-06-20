import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { TableModule } from 'primeng/table';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';

type TableScope = 'tenant' | 'current_tenant' | 'global';

interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
}

interface DatabaseTable {
  name: string;
  entity: string;
  scope: TableScope;
  columns: DatabaseColumn[];
}

interface DatabaseTablesResponse {
  tables: DatabaseTable[];
}

interface DatabaseRowsResponse {
  table: DatabaseTable;
  page: number;
  pageSize: number;
  total: number;
  rows: Record<string, unknown>[];
}

@Component({
  selector: 'app-database-page',
  standalone: true,
  imports: [FormsModule, IonContent, JsonPipe, MainNavComponent, TableModule],
  styles: [
    `
      ion-content {
        --background: #f5f7fb;
      }

      .shell {
        display: grid;
        gap: 18px;
        max-width: 1260px;
        margin: 0 auto;
        padding: 24px 0 54px;
      }

      .intro,
      .browser,
      .detail {
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 42px rgba(20, 50, 80, 0.06);
      }

      .intro {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 18px;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        color: #102f4d;
        font-size: 1.7rem;
        line-height: 1.18;
      }

      h2 {
        color: #173b5f;
        font-size: 1rem;
      }

      p,
      .meta,
      .empty {
        color: #526577;
        line-height: 1.5;
      }

      .badge {
        border-radius: 999px;
        background: #eaf3fc;
        color: #16496f;
        padding: 6px 10px;
        font-size: 0.78rem;
        font-weight: 850;
        white-space: nowrap;
      }

      .browser {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        min-height: 560px;
        overflow: hidden;
      }

      .tables {
        display: grid;
        align-content: start;
        gap: 8px;
        border-right: 1px solid #d9e2ec;
        background: #fbfcfe;
        padding: 14px;
      }

      .table-button {
        display: grid;
        gap: 4px;
        width: 100%;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        color: #173b5f;
        padding: 10px;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }

      .table-button.active {
        border-color: #b7cce2;
        background: #eaf3fc;
      }

      .table-button strong {
        color: #102f4d;
      }

      .workspace {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        min-width: 0;
      }

      .toolbar {
        display: grid;
        grid-template-columns: minmax(180px, 1fr) auto auto;
        gap: 10px;
        align-items: center;
        border-bottom: 1px solid #d9e2ec;
        padding: 14px;
      }

      input,
      select,
      button {
        min-height: 38px;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
        color: #102f4d;
        padding: 8px 10px;
        font: inherit;
      }

      button {
        color: #173b5f;
        font-weight: 800;
        cursor: pointer;
      }

      button.primary {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .table-wrap {
        min-width: 0;
        overflow: auto;
        padding: 14px;
      }

      .cell {
        display: block;
        max-width: 320px;
        overflow: hidden;
        color: #243f57;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .row-button {
        min-height: 30px;
        padding: 4px 8px;
      }

      .pager {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }

      .detail {
        display: grid;
        gap: 10px;
        padding: 16px;
      }

      pre {
        max-height: 360px;
        overflow: auto;
        border-radius: 8px;
        background: #102033;
        color: #e9f1fb;
        padding: 14px;
        font-size: 0.85rem;
        line-height: 1.45;
      }

      :host ::ng-deep .p-datatable-table {
        font-size: 0.9rem;
      }

      :host ::ng-deep .p-datatable-thead > tr > th {
        background: #f4f7fb;
        color: #173b5f;
        font-weight: 850;
      }

      @media (max-width: 860px) {
        .browser {
          grid-template-columns: 1fr;
        }

        .tables {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-right: 0;
          border-bottom: 1px solid #d9e2ec;
        }

        .toolbar {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <ion-content class="ion-padding">
      <app-main-nav contextLabel="Base de datos" />

      <main class="shell">
        <section class="intro">
          <div>
            <h1>Base de datos</h1>
            <p>Visor web minimalista y solo lectura para owner/admin. Sin SQL libre ni edición.</p>
          </div>
          <span class="badge">Solo web</span>
        </section>

        @if (!auth.state.isOwnerOrAdmin) {
          <section class="detail">
            <h2>Acceso restringido</h2>
            <p>Este visor solo está disponible para usuarios owner o admin.</p>
          </section>
        } @else {
          <section class="browser">
            <aside class="tables">
              <h2>Tablas</h2>
              @if (loadingTables) {
                <p class="meta">Cargando tablas...</p>
              }
              @for (table of tables; track table.name) {
                <button
                  class="table-button"
                  type="button"
                  [class.active]="selectedTable?.name === table.name"
                  (click)="selectTable(table)"
                >
                  <strong>{{ table.name }}</strong>
                  <span class="meta">{{ table.scope }} · {{ table.columns.length }} columnas</span>
                </button>
              }
            </aside>

            <section class="workspace">
              <div class="toolbar">
                <input
                  type="search"
                  [(ngModel)]="filter"
                  placeholder="Filtrar filas cargadas"
                  aria-label="Filtrar filas cargadas"
                />
                <select [(ngModel)]="pageSize" (ngModelChange)="loadRows(1)" aria-label="Tamaño de página">
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="25">25</option>
                  <option [ngValue]="50">50</option>
                  <option [ngValue]="100">100</option>
                </select>
                <button type="button" (click)="loadRows(page)" [disabled]="!selectedTable || loadingRows">
                  Refrescar
                </button>
              </div>

              <div class="table-wrap">
                @if (!selectedTable) {
                  <p class="empty">Selecciona una tabla para ver sus filas.</p>
                } @else if (loadingRows) {
                  <p class="empty">Cargando filas...</p>
                } @else {
                  <p-table [value]="filteredRows" [scrollable]="true" scrollHeight="430px">
                    <ng-template pTemplate="header">
                      <tr>
                        <th style="width: 84px">Detalle</th>
                        @for (column of selectedTable.columns; track column.name) {
                          <th>{{ column.name }}</th>
                        }
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-row>
                      <tr>
                        <td>
                          <button class="row-button" type="button" (click)="selectedRow = row">Ver</button>
                        </td>
                        @for (column of selectedTable.columns; track column.name) {
                          <td>
                            <span class="cell" [title]="formatCell(row[column.name])">
                              {{ formatCell(row[column.name]) }}
                            </span>
                          </td>
                        }
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr>
                        <td [attr.colspan]="selectedTable.columns.length + 1">No hay filas para mostrar.</td>
                      </tr>
                    </ng-template>
                  </p-table>

                  <div class="pager">
                    <span class="meta">
                      Página {{ page }} · {{ total }} filas{{ filter ? ' · filtro local activo' : '' }}
                    </span>
                    <button type="button" (click)="loadRows(page - 1)" [disabled]="page <= 1 || loadingRows">
                      Anterior
                    </button>
                    <button
                      class="primary"
                      type="button"
                      (click)="loadRows(page + 1)"
                      [disabled]="page * pageSize >= total || loadingRows"
                    >
                      Siguiente
                    </button>
                  </div>
                }
              </div>
            </section>
          </section>

          @if (selectedRow) {
            <section class="detail">
              <h2>Detalle de fila</h2>
              <pre>{{ selectedRow | json }}</pre>
            </section>
          }
        }
      </main>
    </ion-content>
  `
})
export class DatabasePageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  tables: DatabaseTable[] = [];
  selectedTable?: DatabaseTable;
  rows: Record<string, unknown>[] = [];
  selectedRow?: Record<string, unknown>;
  loadingTables = true;
  loadingRows = false;
  page = 1;
  pageSize = 25;
  total = 0;
  filter = '';

  get filteredRows() {
    const search = this.filter.trim().toLowerCase();
    if (!search) {
      return this.rows;
    }

    return this.rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search));
  }

  ngOnInit() {
    if (this.auth.state.isOwnerOrAdmin) {
      this.loadTables();
    }
  }

  selectTable(table: DatabaseTable) {
    this.selectedTable = table;
    this.selectedRow = undefined;
    this.filter = '';
    this.loadRows(1);
  }

  loadTables() {
    this.loadingTables = true;
    this.api.get<DatabaseTablesResponse>('database/tables').subscribe({
      next: (response) => {
        this.tables = response.tables;
        this.loadingTables = false;
        if (!this.selectedTable && this.tables.length) {
          this.selectTable(this.tables[0]);
        }
      },
      error: () => {
        this.tables = [];
        this.loadingTables = false;
      }
    });
  }

  loadRows(page: number) {
    if (!this.selectedTable) {
      return;
    }

    this.loadingRows = true;
    this.api
      .get<DatabaseRowsResponse>(`database/tables/${encodeURIComponent(this.selectedTable.name)}?page=${page}&pageSize=${this.pageSize}`)
      .subscribe({
        next: (response) => {
          this.selectedTable = response.table;
          this.rows = response.rows;
          this.page = response.page;
          this.pageSize = response.pageSize;
          this.total = response.total;
          this.selectedRow = undefined;
          this.loadingRows = false;
        },
        error: () => {
          this.rows = [];
          this.total = 0;
          this.loadingRows = false;
        }
      });
  }

  formatCell(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }
}

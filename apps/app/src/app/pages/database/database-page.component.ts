import { JsonPipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogHeaderComponent } from '../../shared/catalog-header/catalog-header.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';
import {
  SegmentedControlComponent,
  SegmentedControlItem
} from '../../shared/segmented-control/segmented-control.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';

type TableScope = 'tenant' | 'current_tenant' | 'global';
type TableSource = 'entity' | 'schema';
type PageMode = 'data' | 'designer' | 'history';
type SchemaOperation = 'create_table' | 'add_column' | 'alter_column' | 'drop_column';
type SchemaColumnType = 'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'json' | 'uuid';

interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
  editable: boolean;
}

interface DatabaseTable {
  name: string;
  entity: string;
  scope: TableScope;
  source: TableSource;
  editable: boolean;
  designable: boolean;
  columns: DatabaseColumn[];
}

interface DatabaseTablesResponse {
  tables: DatabaseTable[];
}

const DATABASE_TABLE_CACHE_KEY = 'chicle.databaseTables';

interface DatabaseRowsResponse {
  table: DatabaseTable;
  page: number;
  pageSize: number;
  total: number;
  rows: Record<string, unknown>[];
}

interface DatabaseUpdateResponse {
  table: DatabaseTable;
  row: Record<string, unknown>;
}

interface SchemaFieldDraft {
  name: string;
  type: SchemaColumnType;
  length: number;
  precision: number;
  scale: number;
  nullable: boolean;
  defaultValue: string;
}

interface SchemaRequest {
  operation: SchemaOperation;
  tableName: string;
  columns?: Partial<SchemaFieldDraft>[];
  column?: Partial<SchemaFieldDraft>;
  currentColumnName?: string;
  confirmation?: string;
}

interface SchemaPreviewResponse {
  operation: SchemaOperation;
  tableName: string;
  columnName?: string | null;
  sql: string;
  migrationName: string;
  migrationSource: string;
  warnings: string[];
}

interface SchemaChange {
  id: string;
  sequence: number;
  operation: SchemaOperation;
  tableName: string;
  columnName?: string | null;
  status: 'applied' | 'failed';
  sql: string;
  migrationName: string;
  migrationPath?: string | null;
  error?: string | null;
  createdAt: string;
}

interface SchemaHistoryResponse {
  changes: SchemaChange[];
}

@Component({
  selector: 'app-database-page',
  standalone: true,
  imports: [
    DialogModule,
    FormsModule,
    IonContent,
    JsonPipe,
    MainNavComponent,
    TableModule,
    ModuleHeaderComponent,
    CatalogHeaderComponent,
    CatalogItemComponent,
    SectionHeaderComponent,
    SegmentedControlComponent,
    StatusNoticeComponent
  ],
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

      .panel,
      .browser {
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 42px rgba(20, 50, 80, 0.06);
      }

      .panel {
        padding: 18px;
      }

      h1,
      h2,
      h3,
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
        font-size: 1.05rem;
      }

      h3 {
        color: #173b5f;
        font-size: 0.95rem;
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

      .toolbar,
      .modal-actions,
      .designer-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .browser {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        height: clamp(560px, calc(100vh - 230px), 760px);
        min-height: 560px;
        overflow: hidden;
      }

      .tables {
        display: grid;
        align-content: start;
        gap: 10px;
        overflow: auto;
        border-right: 1px solid #d9e2ec;
        background: #fbfcfe;
        padding: 14px;
      }

      .workspace {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        min-width: 0;
        min-height: 0;
      }

      .toolbar {
        display: grid;
        grid-template-columns: minmax(180px, 1fr) auto auto;
        border-bottom: 1px solid #d9e2ec;
        padding: 14px;
      }

      input,
      select,
      button,
      textarea {
        min-height: 38px;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
        color: #102f4d;
        padding: 8px 10px;
        font: inherit;
      }

      textarea {
        min-height: 78px;
        resize: vertical;
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

      button.danger {
        border-color: #b42318;
        color: #b42318;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .table-wrap {
        min-width: 0;
        min-height: 0;
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

      .designer-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.95fr);
        gap: 16px;
        align-items: start;
      }

      .form-grid,
      .editor,
      .field-grid,
      .preview-box,
      .history-list {
        display: grid;
        gap: 12px;
        min-width: 0;
      }

      .form-grid,
      .preview-box {
        min-width: 0;
        align-content: start;
      }

      .form-row {
        display: grid;
        gap: 6px;
      }

      .form-row label,
      .field-label {
        color: #173b5f;
        font-weight: 850;
      }

      .columns-list {
        display: grid;
        gap: 10px;
      }

      .schema-column {
        display: grid;
        grid-template-columns: minmax(120px, 1fr) minmax(112px, 130px) minmax(72px, 86px) minmax(72px, 86px) auto auto;
        gap: 8px;
        align-items: center;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px;
        min-width: 0;
      }

      .schema-column input,
      .schema-column select {
        width: 100%;
        min-width: 0;
      }

      .schema-column .check {
        display: flex;
        gap: 6px;
        align-items: center;
        color: #526577;
        font-weight: 750;
      }

      .schema-column input[type='checkbox'] {
        min-height: auto;
      }

      .notice {
        display: grid;
        gap: 8px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        color: #254057;
        padding: 14px;
      }

      .notice.error {
        border-color: #f1b4b4;
        background: #fff6f6;
        color: #8b2323;
      }

      .notice.success {
        border-color: #a9ddb7;
        background: #f4fbf6;
        color: #17643a;
      }

      .field-row {
        display: grid;
        grid-template-columns: minmax(130px, 0.35fr) minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px;
      }

      .field-label {
        display: grid;
        gap: 4px;
      }

      .field-label small {
        color: #64748b;
        font-weight: 650;
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

      @media (max-width: 1120px) {
        .designer-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 940px) {
        .browser,
        .designer-grid {
          grid-template-columns: 1fr;
        }

        .browser {
          height: auto;
          min-height: 0;
          overflow: visible;
        }

        .tables {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          max-height: 320px;
          overflow: auto;
          border-right: 0;
          border-bottom: 1px solid #d9e2ec;
        }

        .workspace {
          min-height: 520px;
        }

        .toolbar,
        .schema-column {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <ion-content class="ion-padding">
      <app-main-nav contextLabel="Base de datos" />

      <main class="shell">
        <app-module-header
          title="Base de datos"
          description="Visor de datos y diseñador controlado para tablas custom. Sin SQL libre ni cambios sobre tablas core."
          badge="Owner/Admin"
        ></app-module-header>

        @if (!auth.state.isOwnerOrAdmin) {
          <section class="panel">
            <h2>Acceso restringido</h2>
            <p>Este módulo solo está disponible para usuarios owner o admin.</p>
          </section>
        } @else {
          <app-segmented-control
            [items]="modeOptions"
            [value]="mode"
            (valueChange)="setMode($event)"
            ariaLabel="Modos de base de datos"
          ></app-segmented-control>

          @if (mode === 'data') {
            <section class="browser">
              <aside class="tables">
                <app-catalog-header
                  title="Tablas"
                  [summary]="tables.length + (tables.length === 1 ? ' tabla' : ' tablas')"
                ></app-catalog-header>
                @if (loadingTables) {
                  <p class="meta">Cargando tablas...</p>
                } @else if (tablesError) {
                  <app-status-notice title="No se pudieron cargar las tablas" tone="error">
                    <span>{{ tablesError }}</span>
                    <button notice-action type="button" (click)="loadTables()">Reintentar</button>
                  </app-status-notice>
                } @else if (!tables.length) {
                  <app-status-notice title="No hay tablas visibles">
                    <span>El backend respondió correctamente, pero no encontró tablas habilitadas.</span>
                  </app-status-notice>
                }
                @for (table of tables; track table.name) {
                  <app-catalog-item
                    [title]="table.name"
                    [meta]="
                      (table.source === 'schema' ? 'custom' : table.scope) + ' · ' + table.columns.length + ' columnas'
                    "
                    [active]="selectedTable?.name === table.name"
                    (selected)="selectTable(table)"
                  ></app-catalog-item>
                }
              </aside>

              <section class="workspace" #workspacePanel>
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
                  } @else if (rowsError) {
                    <div class="notice error">
                      <strong>No se pudieron cargar las filas</strong>
                      <span>{{ rowsError }}</span>
                      <button type="button" (click)="loadRows(page)">Reintentar</button>
                    </div>
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
                            <button class="row-button" type="button" (click)="openRow(row)">Ver</button>
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
          }

          @if (mode === 'designer') {
            <section class="panel designer-grid">
              <div class="form-grid">
                <app-section-header
                  title="Diseñador de tablas"
                  description="Solo administra tablas custom_*. Cada operación genera SQL, historial y migración TypeORM."
                  stepLabel="Esquema controlado"
                ></app-section-header>

                <div class="form-row">
                  <label for="operation">Operación</label>
                  <select id="operation" [(ngModel)]="schemaOperation" (ngModelChange)="resetPreview()">
                    <option value="create_table">Crear tabla</option>
                    <option value="add_column">Agregar campo</option>
                    <option value="alter_column">Editar campo</option>
                    <option value="drop_column">Eliminar campo</option>
                  </select>
                </div>

                <div class="form-row">
                  <label for="schema-table">Tabla</label>
                  <input
                    id="schema-table"
                    [(ngModel)]="schemaTableName"
                    placeholder="custom_clients"
                    (ngModelChange)="resetPreview()"
                  />
                </div>

                @if (schemaOperation === 'create_table') {
                  <div class="columns-list">
                    <h3>Campos iniciales</h3>
                    @for (column of createColumns; track $index; let index = $index) {
                      <div class="schema-column">
                        <input
                          [(ngModel)]="createColumns[index].name"
                          placeholder="name"
                          (ngModelChange)="resetPreview()"
                        />
                        <select [(ngModel)]="createColumns[index].type" (ngModelChange)="resetPreview()">
                          @for (type of columnTypes; track type) {
                            <option [value]="type">{{ type }}</option>
                          }
                        </select>
                        <input
                          type="number"
                          [(ngModel)]="createColumns[index].length"
                          [disabled]="createColumns[index].type !== 'string'"
                          aria-label="Longitud"
                        />
                        <input
                          [(ngModel)]="createColumns[index].defaultValue"
                          placeholder="default"
                          (ngModelChange)="resetPreview()"
                        />
                        <label class="check">
                          <input
                            type="checkbox"
                            [(ngModel)]="createColumns[index].nullable"
                            (ngModelChange)="resetPreview()"
                          />
                          nullable
                        </label>
                        <button
                          type="button"
                          (click)="removeCreateColumn(index)"
                          [disabled]="createColumns.length <= 1"
                        >
                          Quitar
                        </button>
                      </div>
                    }
                    <button type="button" (click)="addCreateColumn()">Agregar campo</button>
                  </div>
                } @else {
                  <div class="form-row">
                    <label for="current-column">Campo actual</label>
                    <input
                      id="current-column"
                      [(ngModel)]="currentColumnName"
                      placeholder="status"
                      (ngModelChange)="syncDropConfirmation(); resetPreview()"
                    />
                  </div>

                  @if (schemaOperation !== 'drop_column') {
                    <div class="schema-column">
                      <input
                        [(ngModel)]="singleColumn.name"
                        placeholder="new_status"
                        (ngModelChange)="resetPreview()"
                      />
                      <select [(ngModel)]="singleColumn.type" (ngModelChange)="resetPreview()">
                        @for (type of columnTypes; track type) {
                          <option [value]="type">{{ type }}</option>
                        }
                      </select>
                      <input
                        type="number"
                        [(ngModel)]="singleColumn.length"
                        [disabled]="singleColumn.type !== 'string'"
                        aria-label="Longitud"
                      />
                      <input
                        [(ngModel)]="singleColumn.defaultValue"
                        placeholder="default"
                        (ngModelChange)="resetPreview()"
                      />
                      <label class="check">
                        <input type="checkbox" [(ngModel)]="singleColumn.nullable" (ngModelChange)="resetPreview()" />
                        nullable
                      </label>
                    </div>
                  } @else {
                    <div class="form-row">
                      <label for="confirmation">Confirmación</label>
                      <input id="confirmation" [(ngModel)]="dropConfirmation" [placeholder]="dropPhrase" />
                      <p class="meta">
                        Escribe exactamente: <code>{{ dropPhrase }}</code>
                      </p>
                    </div>
                  }
                }

                @if (schemaError) {
                  <div class="notice error">
                    <strong>No se pudo preparar el cambio</strong>
                    <span>{{ schemaError }}</span>
                  </div>
                }
                @if (schemaSuccess) {
                  <div class="notice success">
                    <strong>Cambio aplicado</strong>
                    <span>{{ schemaSuccess }}</span>
                  </div>
                }

                <div class="designer-actions">
                  <button type="button" (click)="previewSchema()" [disabled]="schemaLoading">Previsualizar</button>
                  <button
                    class="primary"
                    type="button"
                    (click)="applySchema()"
                    [disabled]="schemaLoading || !schemaPreview"
                  >
                    {{ schemaLoading ? 'Procesando...' : 'Aplicar cambio' }}
                  </button>
                </div>
              </div>

              <div class="preview-box">
                <h2>Preview seguro</h2>
                @if (!schemaPreview) {
                  <div class="notice">
                    <strong>Sin cambios aplicados todavía</strong>
                    <span>Primero genera el preview para revisar el SQL y la migración TypeORM.</span>
                  </div>
                } @else {
                  <div class="notice">
                    <strong>{{ schemaPreview.migrationName }}</strong>
                    @for (warning of schemaPreview.warnings; track warning) {
                      <span>{{ warning }}</span>
                    }
                  </div>

                  <h3>SQL</h3>
                  <pre>{{ schemaPreview.sql }}</pre>

                  <h3>Migración TypeORM</h3>
                  <pre>{{ schemaPreview.migrationSource }}</pre>
                }
              </div>
            </section>
          }

          @if (mode === 'history') {
            <section class="panel history-list">
              <app-section-header
                title="Historial de cambios"
                description="Últimos cambios generados desde el diseñador visual."
                stepLabel="Auditoría de esquema"
              >
                <button type="button" (click)="loadHistory()">Refrescar</button>
              </app-section-header>

              @if (historyError) {
                <div class="notice error">{{ historyError }}</div>
              } @else if (!schemaChanges.length) {
                <div class="notice">Todavía no hay cambios de esquema registrados.</div>
              }

              @for (change of schemaChanges; track change.id) {
                <article class="notice" [class.error]="change.status === 'failed'">
                  <strong>#{{ change.sequence }} · {{ change.operation }} · {{ change.tableName }}</strong>
                  <span class="meta"> {{ change.createdAt }} · {{ change.status }} · {{ change.migrationName }} </span>
                  @if (change.migrationPath) {
                    <span class="meta">Archivo: {{ change.migrationPath }}</span>
                  }
                  @if (change.error) {
                    <span>{{ change.error }}</span>
                  }
                  <details>
                    <summary>Ver SQL</summary>
                    <pre>{{ change.sql }}</pre>
                  </details>
                </article>
              }
            </section>
          }

          <p-dialog
            header="Detalle de fila"
            [(visible)]="detailVisible"
            [modal]="true"
            [draggable]="false"
            [resizable]="false"
            [style]="{ width: 'min(920px, 94vw)' }"
          >
            @if (selectedRow && selectedTable) {
              <section class="editor">
                <div class="notice" [class.error]="saveError">
                  <strong>{{ selectedTable.name }}</strong>
                  <span>
                    {{
                      selectedTable.editable
                        ? 'Edita los campos habilitados y guarda los cambios.'
                        : 'Esta tabla es solo lectura en el visor.'
                    }}
                  </span>
                  @if (saveError) {
                    <span>{{ saveError }}</span>
                  }
                </div>

                <div class="field-grid">
                  @for (column of selectedTable.columns; track column.name) {
                    <div class="field-row">
                      <div class="field-label">
                        <span>{{ column.name }}</span>
                        <small>
                          {{ column.type }}{{ column.primary ? ' · primary' : ''
                          }}{{ column.nullable ? ' · nullable' : '' }}
                        </small>
                      </div>

                      @if (column.editable) {
                        @if (isBooleanColumn(column)) {
                          <select [(ngModel)]="editDraft[column.name]">
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        } @else if (isLongColumn(column)) {
                          <textarea [(ngModel)]="editDraft[column.name]"></textarea>
                        } @else {
                          <input [(ngModel)]="editDraft[column.name]" />
                        }
                      } @else {
                        <span class="cell" [title]="formatCell(selectedRow[column.name])">
                          {{ formatCell(selectedRow[column.name]) || ' ' }}
                        </span>
                      }
                    </div>
                  }
                </div>

                <details>
                  <summary>JSON completo</summary>
                  <pre>{{ selectedRow | json }}</pre>
                </details>

                <div class="modal-actions">
                  <button type="button" (click)="detailVisible = false">Cerrar</button>
                  <button
                    class="primary"
                    type="button"
                    [disabled]="!selectedTable.editable || savingRow || !editableColumns.length"
                    (click)="saveRow()"
                  >
                    {{ savingRow ? 'Guardando...' : 'Guardar cambios' }}
                  </button>
                </div>
              </section>
            }
          </p-dialog>
        }
      </main>
    </ion-content>
  `
})
export class DatabasePageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);
  @ViewChild('workspacePanel') private workspacePanel?: ElementRef<HTMLElement>;

  readonly columnTypes: SchemaColumnType[] = [
    'string',
    'text',
    'integer',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'json',
    'uuid'
  ];

  mode: PageMode = 'data';
  readonly modeOptions: SegmentedControlItem[] = [
    { key: 'data', label: 'Datos', icon: 'pi pi-table' },
    { key: 'designer', label: 'Diseñador', icon: 'pi pi-wrench' },
    { key: 'history', label: 'Historial', icon: 'pi pi-history' }
  ];
  tables: DatabaseTable[] = [];
  selectedTable?: DatabaseTable;
  rows: Record<string, unknown>[] = [];
  selectedRow?: Record<string, unknown>;
  editDraft: Record<string, string> = {};
  detailVisible = false;
  savingRow = false;
  saveError = '';
  loadingTables = true;
  loadingRows = false;
  tablesError = '';
  rowsError = '';
  page = 1;
  pageSize = 25;
  total = 0;
  filter = '';

  schemaOperation: SchemaOperation = 'create_table';
  schemaTableName = 'custom_';
  currentColumnName = '';
  dropConfirmation = '';
  schemaLoading = false;
  schemaError = '';
  schemaSuccess = '';
  schemaPreview?: SchemaPreviewResponse;
  schemaChanges: SchemaChange[] = [];
  historyError = '';
  createColumns: SchemaFieldDraft[] = [this.newField('name', false)];
  singleColumn: SchemaFieldDraft = this.newField('', true);

  get filteredRows() {
    const search = this.filter.trim().toLowerCase();
    if (!search) {
      return this.rows;
    }

    return this.rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search));
  }

  get editableColumns() {
    return this.selectedTable?.columns.filter((column) => column.editable) ?? [];
  }

  get dropPhrase() {
    return `DROP ${this.schemaTableName}.${this.currentColumnName}`;
  }

  ngOnInit() {
    if (this.auth.state.isOwnerOrAdmin) {
      this.loadTables();
    }
  }

  selectTable(table: DatabaseTable, focusWorkspace = true) {
    this.selectedTable = table;
    this.selectedRow = undefined;
    this.filter = '';
    this.schemaTableName = table.designable ? table.name : this.schemaTableName;
    if (focusWorkspace) {
      this.focusWorkspacePanel();
    }
    this.loadRows(1);
  }

  loadTables() {
    this.loadingTables = true;
    this.tablesError = '';
    this.rowsError = '';
    this.api.get<DatabaseTablesResponse>('database/tables').subscribe({
      next: (response) => {
        this.tables = response.tables;
        sessionStorage.setItem(DATABASE_TABLE_CACHE_KEY, JSON.stringify(response.tables));
        this.loadingTables = false;
        if (!this.selectedTable && this.tables.length) {
          this.selectTable(this.tables[0], false);
        }
      },
      error: (error) => {
        this.tables = [];
        this.rows = [];
        this.selectedTable = undefined;
        this.tablesError = this.errorMessage(error);
        this.loadingTables = false;
      }
    });
  }

  loadRows(page: number) {
    if (!this.selectedTable) {
      return;
    }

    this.loadingRows = true;
    this.rowsError = '';
    this.api
      .get<DatabaseRowsResponse>(
        `database/tables/${encodeURIComponent(this.selectedTable.name)}?page=${page}&pageSize=${this.pageSize}`
      )
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
        error: (error) => {
          this.rows = [];
          this.total = 0;
          this.rowsError = this.errorMessage(error);
          this.loadingRows = false;
        }
      });
  }

  private focusWorkspacePanel() {
    window.setTimeout(() => {
      this.workspacePanel?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    });
  }

  openRow(row: Record<string, unknown>) {
    this.selectedRow = row;
    this.editDraft = {};
    this.saveError = '';

    for (const column of this.editableColumns) {
      this.editDraft[column.name] = this.toDraft(row[column.name], column);
    }

    this.detailVisible = true;
  }

  saveRow() {
    if (!this.selectedTable || !this.selectedRow || !this.selectedRow['id']) {
      this.saveError = 'No se puede guardar una fila sin id.';
      return;
    }

    const values: Record<string, unknown> = {};
    try {
      for (const column of this.editableColumns) {
        const currentValue = this.editDraft[column.name] ?? '';
        const originalValue = this.toDraft(this.selectedRow[column.name], column);
        if (currentValue !== originalValue) {
          values[column.name] = this.fromDraft(currentValue, column);
        }
      }
    } catch {
      this.saveError = 'Hay un valor JSON inválido. Corrígelo antes de guardar.';
      return;
    }

    if (!Object.keys(values).length) {
      this.saveError = 'No hay cambios para guardar.';
      return;
    }

    this.savingRow = true;
    this.saveError = '';
    this.api
      .patch<DatabaseUpdateResponse>(
        `database/tables/${encodeURIComponent(this.selectedTable.name)}/${encodeURIComponent(String(this.selectedRow['id']))}`,
        { values }
      )
      .subscribe({
        next: (response) => {
          this.selectedTable = response.table;
          this.selectedRow = response.row;
          this.rows = this.rows.map((row) => (row['id'] === response.row['id'] ? response.row : row));
          this.openRow(response.row);
          this.savingRow = false;
        },
        error: (error) => {
          this.saveError = this.errorMessage(error);
          this.savingRow = false;
        }
      });
  }

  addCreateColumn() {
    this.createColumns = [...this.createColumns, this.newField('', true)];
    this.resetPreview();
  }

  removeCreateColumn(index: number) {
    this.createColumns = this.createColumns.filter((_, itemIndex) => itemIndex !== index);
    this.resetPreview();
  }

  syncDropConfirmation() {
    if (!this.dropConfirmation || this.dropConfirmation.startsWith('DROP ')) {
      this.dropConfirmation = this.dropPhrase;
    }
  }

  previewSchema() {
    this.schemaLoading = true;
    this.schemaError = '';
    this.schemaSuccess = '';
    this.api.post<SchemaPreviewResponse>('database/schema/preview', this.schemaRequest()).subscribe({
      next: (response) => {
        this.schemaPreview = response;
        this.schemaLoading = false;
      },
      error: (error) => {
        this.schemaPreview = undefined;
        this.schemaError = this.errorMessage(error);
        this.schemaLoading = false;
      }
    });
  }

  applySchema() {
    this.schemaLoading = true;
    this.schemaError = '';
    this.api.post<SchemaPreviewResponse>('database/schema/apply', this.schemaRequest()).subscribe({
      next: (response) => {
        this.schemaPreview = response;
        this.schemaSuccess = `${response.migrationName} aplicado y registrado.`;
        this.schemaLoading = false;
        this.loadTables();
        this.loadHistory();
      },
      error: (error) => {
        this.schemaError = this.errorMessage(error);
        this.schemaLoading = false;
      }
    });
  }

  openHistory() {
    this.mode = 'history';
    this.loadHistory();
  }

  setMode(value: string) {
    if (value === 'history') {
      this.openHistory();
      return;
    }
    if (value === 'data' || value === 'designer') {
      this.mode = value;
    }
  }

  loadHistory() {
    this.historyError = '';
    this.api.get<SchemaHistoryResponse>('database/schema/changes').subscribe({
      next: (response) => {
        this.schemaChanges = response.changes;
      },
      error: (error) => {
        this.historyError = this.errorMessage(error);
      }
    });
  }

  resetPreview() {
    this.schemaPreview = undefined;
    this.schemaError = '';
    this.schemaSuccess = '';
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

  isBooleanColumn(column: DatabaseColumn) {
    const type = column.type.toLowerCase();
    return type === 'boolean' || type === 'bool' || type === 'tinyint(1)' || type.includes('boolean');
  }

  isLongColumn(column: DatabaseColumn) {
    const type = column.type.toLowerCase();
    return type.includes('json') || type.includes('text') || type.includes('simple-json');
  }

  private newField(name: string, nullable: boolean): SchemaFieldDraft {
    return {
      name,
      type: 'string',
      length: 180,
      precision: 12,
      scale: 2,
      nullable,
      defaultValue: ''
    };
  }

  private schemaRequest(): SchemaRequest {
    const request: SchemaRequest = {
      operation: this.schemaOperation,
      tableName: this.schemaTableName.trim()
    };

    if (this.schemaOperation === 'create_table') {
      request.columns = this.createColumns.map((column) => this.fieldPayload(column));
      return request;
    }

    request.currentColumnName = this.currentColumnName.trim();
    if (this.schemaOperation === 'drop_column') {
      request.confirmation = this.dropConfirmation;
      return request;
    }

    request.column = this.fieldPayload(this.singleColumn);
    return request;
  }

  private fieldPayload(field: SchemaFieldDraft): Partial<SchemaFieldDraft> {
    return {
      name: field.name.trim(),
      type: field.type,
      length: field.type === 'string' ? Number(field.length) : undefined,
      precision: field.type === 'decimal' ? Number(field.precision) : undefined,
      scale: field.type === 'decimal' ? Number(field.scale) : undefined,
      nullable: field.nullable,
      defaultValue: field.defaultValue === '' ? undefined : field.defaultValue
    };
  }

  private toDraft(value: unknown, column: DatabaseColumn) {
    if (value === null || value === undefined) {
      return '';
    }

    if (this.isLongColumn(column) && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  private fromDraft(value: string, column: DatabaseColumn): unknown {
    if (!value && column.nullable) {
      return null;
    }

    if (this.isLongColumn(column) && column.type.toLowerCase().includes('json')) {
      return JSON.parse(value || 'null');
    }

    return value;
  }

  private errorMessage(error: { status?: number; error?: { message?: string } }) {
    if (error.status === 0) {
      return 'No hay conexión con la API. Revisa que el backend esté corriendo y que API_PORT coincida.';
    }

    if (error.status === 401) {
      return 'Tu sesión no fue aceptada por la API. Cierra sesión e ingresa nuevamente.';
    }

    if (error.status === 403) {
      return 'La API rechazó el acceso. Este módulo requiere usuario owner o admin.';
    }

    if (error.status === 404) {
      return 'La API no tiene este endpoint todavía. Reinicia el backend para cargar el módulo nuevo /api/database.';
    }

    return error.error?.message ?? 'La API devolvió un error inesperado.';
  }
}

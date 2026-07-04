import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldShellComponent } from '../../shared/field-shell/field-shell.component';
import { DynamicFieldLibraryComponent } from '../../shared/dynamic-field-library/dynamic-field-library.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiThemeSelectorComponent } from '../../shared/ui-theme-selector/ui-theme-selector.component';
import {
  UI_COMPONENT_CATALOG,
  UiComponentCatalogEntry,
  UiComponentCategory
} from '../../shared/ui-component-catalog';
import { ComponentVisualPreviewComponent } from './component-visual-preview.component';

type ComponentStatusFilter = 'all' | UiComponentCatalogEntry['status'];

@Component({
  selector: 'app-components-page',
  standalone: true,
  imports: [
    ComponentVisualPreviewComponent,
    DynamicFieldLibraryComponent,
    FieldShellComponent,
    FormsModule,
    ModuleHeaderComponent,
    PageShellComponent,
    StatusNoticeComponent,
    UiThemeSelectorComponent
  ],
  styles: [
    `
      .toolbar,
      .summary,
      .field-library,
      .component-card {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
      }

      .toolbar {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) repeat(3, minmax(170px, 230px));
        gap: 12px;
        padding: 16px;
      }

      input,
      select {
        width: 100%;
        min-height: 42px;
        border: 1px solid #b9c9d8;
        border-radius: var(--ch-radius);
        background: #ffffff;
        color: var(--ch-color-text);
        padding: 9px 11px;
        font: inherit;
      }

      input:focus,
      select:focus {
        outline: 3px solid rgba(21, 84, 162, 0.16);
        border-color: var(--ch-color-primary);
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        overflow: hidden;
      }

      .field-library {
        display: grid;
        gap: 16px;
        padding: 18px;
      }

      .field-library-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .field-library-header div {
        display: grid;
        gap: 4px;
      }

      .field-library-header strong {
        color: var(--ch-color-text);
        font-size: 1.1rem;
      }

      .field-library-header span {
        color: var(--ch-color-muted);
        line-height: 1.5;
      }

      .field-count {
        flex: 0 0 auto;
        border-radius: 999px;
        background: #e8f2ff;
        color: #1554a2 !important;
        padding: 6px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .preview-command {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        width: fit-content;
        min-height: 38px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 7px 11px;
        font: inherit;
        font-weight: 800;
      }

      .preview-command:hover {
        border-color: var(--ch-color-primary);
        color: var(--ch-color-primary);
      }

      .field-library-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .summary-item {
        display: grid;
        gap: 4px;
        background: #f8fbfe;
        padding: 14px;
      }

      .summary-item strong {
        color: var(--ch-color-text);
        font-size: 1.2rem;
      }

      .summary-item span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
      }

      .catalog {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .component-card {
        display: grid;
        align-content: start;
        gap: 14px;
        min-width: 0;
        padding: 18px;
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      h2,
      p,
      pre {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.05rem;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.5;
      }

      .selector,
      .badge,
      .consumer {
        border-radius: 999px;
        font-size: 0.76rem;
        font-weight: 800;
      }

      .selector {
        width: fit-content;
        background: #e8f2ff;
        color: #1554a2;
        padding: 5px 8px;
      }

      .badge {
        flex: 0 0 auto;
        background: #eef3f8;
        color: #52677a;
        padding: 5px 8px;
      }

      .detail {
        display: grid;
        gap: 6px;
      }

      .detail-label {
        color: #64748b;
        font-size: 0.74rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .consumers {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .consumer {
        background: #f2f6fa;
        color: #35526e;
        padding: 5px 8px;
      }

      pre {
        max-width: 100%;
        overflow: auto;
        border-radius: 6px;
        background: #10263e;
        color: #e9f3ff;
        padding: 12px;
        font-size: 0.78rem;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      code {
        color: #174f91;
        overflow-wrap: anywhere;
      }

      @media (max-width: 900px) {
        .toolbar,
        .catalog {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 620px) {
        .summary {
          grid-template-columns: 1fr;
        }

        .card-header {
          display: grid;
        }

        .field-library-header {
          display: grid;
        }

        .badge {
          justify-self: start;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Biblioteca de componentes">
      <app-module-header
        eyebrow="Documentación visual"
        title="Componentes disponibles"
        description="Referencia independiente de componentes reutilizables: propósito, adopción, importación e invocación mínima."
        badge="UI Catalog"
      ></app-module-header>

      <section class="toolbar" aria-label="Filtros del catálogo">
        <app-field-shell label="Buscar" forId="component-search">
          <input
            id="component-search"
            type="search"
            [(ngModel)]="search"
            placeholder="Nombre, selector, propósito o pantalla"
          />
        </app-field-shell>
        <app-field-shell label="Categoría" forId="component-category">
          <select id="component-category" [(ngModel)]="category">
            <option value="all">Todas</option>
            @for (item of categories; track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select>
        </app-field-shell>
        <app-field-shell label="Estado" forId="component-status">
          <select id="component-status" [(ngModel)]="status">
            <option value="all">Todos</option>
            <option value="stable">Estable</option>
            <option value="initial">Inicial</option>
            <option value="domain">Especializado</option>
          </select>
        </app-field-shell>
        <app-ui-theme-selector
          label="Tema instalado"
          controlId="component-theme"
        ></app-ui-theme-selector>
      </section>

      <section class="summary" aria-label="Resumen del catálogo">
        <div class="summary-item">
          <strong>{{ catalog.length }}</strong>
          <span>componentes registrados</span>
        </div>
        <div class="summary-item">
          <strong>{{ sharedCount }}</strong>
          <span>componentes compartidos</span>
        </div>
        <div class="summary-item">
          <strong>{{ filteredCatalog.length }}</strong>
          <span>resultados visibles</span>
        </div>
      </section>

      <section class="field-library" aria-label="Biblioteca de campos dinámicos">
        <header class="field-library-header">
          <div>
            <strong>Controles importados e integrados</strong>
            <span>
              Esta galería usa el runtime real de Formly y los mismos adaptadores disponibles para
              formularios y pantallas dinámicas.
            </span>
          </div>
          <div class="field-library-actions">
            <span class="field-count">17 tipos</span>
            <button
              class="preview-command"
              type="button"
              [attr.aria-expanded]="fieldLibraryOpen"
              (click)="fieldLibraryOpen = !fieldLibraryOpen"
            >
              <i class="pi" [class.pi-eye]="!fieldLibraryOpen" [class.pi-eye-slash]="fieldLibraryOpen"></i>
              {{ fieldLibraryOpen ? 'Ocultar galería' : 'Ver galería' }}
            </button>
          </div>
        </header>
        @if (fieldLibraryOpen) {
          <app-dynamic-field-library></app-dynamic-field-library>
        } @else {
          <app-status-notice>
            Abre la galería para montar los controles reales y comparar PrimeNG, Ionic y HTML base.
          </app-status-notice>
        }
      </section>

      @if (!filteredCatalog.length) {
        <app-status-notice title="Sin resultados">
          Cambia la búsqueda o los filtros para volver a mostrar componentes.
        </app-status-notice>
      } @else {
        <section class="catalog" aria-label="Catálogo de componentes">
          @for (component of filteredCatalog; track component.name) {
            <article class="component-card">
              <header class="card-header">
                <div class="detail">
                  <h2>{{ component.name }}</h2>
                  <code class="selector">&lt;{{ component.selector }}&gt;</code>
                </div>
                <span class="badge">{{ statusLabel(component.status) }}</span>
              </header>

              <p>{{ component.purpose }}</p>

              <button
                class="preview-command"
                type="button"
                [attr.aria-expanded]="isPreviewExpanded(component.name)"
                (click)="togglePreview(component.name)"
              >
                <i
                  class="pi"
                  [class.pi-eye]="!isPreviewExpanded(component.name)"
                  [class.pi-eye-slash]="isPreviewExpanded(component.name)"
                ></i>
                {{ isPreviewExpanded(component.name) ? 'Ocultar vista' : 'Ver componente' }}
              </button>

              @if (isPreviewExpanded(component.name)) {
                <app-component-visual-preview
                  [componentName]="component.name"
                ></app-component-visual-preview>
              }

              <div class="detail">
                <span class="detail-label">Categoría</span>
                <span>{{ component.category }}</span>
              </div>

              <div class="detail">
                <span class="detail-label">Usado actualmente en</span>
                <div class="consumers">
                  @for (consumer of component.usedBy; track consumer) {
                    <span class="consumer">{{ consumer }}</span>
                  }
                </div>
              </div>

              <div class="detail">
                <span class="detail-label">Importación</span>
                <pre>{{ component.importPath }}</pre>
              </div>

              <div class="detail">
                <span class="detail-label">Invocación mínima</span>
                <pre>{{ component.example }}</pre>
              </div>
            </article>
          }
        </section>
      }
    </app-page-shell>
  `
})
export class ComponentsPageComponent {
  readonly catalog = UI_COMPONENT_CATALOG;
  readonly categories = Array.from(new Set(this.catalog.map((item) => item.category))).sort();
  readonly sharedCount = this.catalog.filter((item) => item.status !== 'domain').length;

  search = '';
  category: 'all' | UiComponentCategory = 'all';
  status: ComponentStatusFilter = 'all';
  fieldLibraryOpen = false;
  readonly expandedPreviews = new Set<string>();

  get filteredCatalog() {
    const term = this.search.trim().toLowerCase();
    return this.catalog.filter((component) => {
      const matchesCategory = this.category === 'all' || component.category === this.category;
      const matchesStatus = this.status === 'all' || component.status === this.status;
      const matchesSearch =
        !term ||
        [
          component.name,
          component.selector,
          component.purpose,
          component.importPath,
          component.category,
          ...component.usedBy
        ].some((value) => value.toLowerCase().includes(term));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }

  statusLabel(status: UiComponentCatalogEntry['status']) {
    return {
      stable: 'Estable',
      initial: 'Inicial',
      domain: 'Especializado'
    }[status];
  }

  isPreviewExpanded(componentName: string) {
    return this.expandedPreviews.has(componentName);
  }

  togglePreview(componentName: string) {
    if (this.expandedPreviews.has(componentName)) {
      this.expandedPreviews.delete(componentName);
      return;
    }
    this.expandedPreviews.add(componentName);
  }
}

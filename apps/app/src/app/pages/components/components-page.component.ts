import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { AdminCardGridComponent } from '../../shared/admin-card-grid/admin-card-grid.component';
import { AdminFilterBarComponent } from '../../shared/admin-filter-bar/admin-filter-bar.component';
import { ComponentDocCardComponent } from '../../shared/component-doc-card/component-doc-card.component';
import { DynamicFieldLibraryComponent } from '../../shared/dynamic-field-library/dynamic-field-library.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { UiThemeSelectorComponent } from '../../shared/ui-theme-selector/ui-theme-selector.component';
import {
  UI_COMPONENT_CATALOG,
  UiComponentCatalogEntry,
  UiComponentCategory
} from '../../shared/ui-component-catalog';
import { ComponentVisualPreviewComponent } from './component-visual-preview.component';
import { UiKitPreference } from '../../core/ui/ui-presentation.types';

@Component({
  selector: 'app-components-page',
  standalone: true,
  imports: [
    ComponentVisualPreviewComponent,
    AdminCardGridComponent,
    AdminFilterBarComponent,
    ComponentDocCardComponent,
    DynamicFieldControlComponent,
    DynamicFieldLibraryComponent,
    FormsModule,
    ModuleHeaderComponent,
    PageShellComponent,
    StatusNoticeComponent,
    UiKitButtonComponent,
    UiThemeSelectorComponent
  ],
  styles: [
    `
      .summary,
      .field-library {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
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
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary) !important;
        padding: 6px 9px;
        font-size: 0.78rem;
        font-weight: 850;
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
        background: var(--ch-color-surface-alt);
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

      h2,
      p {
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

      code {
        color: var(--ch-color-primary);
        overflow-wrap: anywhere;
      }

      @media (max-width: 620px) {
        .summary {
          grid-template-columns: 1fr;
        }

        .field-library-header {
          display: grid;
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

      <app-admin-filter-bar ariaLabel="Component catalog filters" minColumnWidth="210px" [kit]="previewKit">
        <app-dynamic-field-control
          [field]="searchField"
          [value]="search"
          [presentation]="previewPresentation"
          (valueChange)="setSearch($event)"
        ></app-dynamic-field-control>
        <app-dynamic-field-control
          [field]="categoryField"
          [value]="category"
          [presentation]="previewPresentation"
          (valueChange)="setCategory($event)"
        ></app-dynamic-field-control>
        <app-dynamic-field-control
          [field]="kitField"
          [value]="previewKit"
          [presentation]="previewPresentation"
          (valueChange)="setPreviewKit($event)"
        ></app-dynamic-field-control>
        <app-ui-theme-selector
          label="Colores / tema"
          controlId="component-theme"
          [kit]="previewKit"
        ></app-ui-theme-selector>
      </app-admin-filter-bar>

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
              Esta galería usa la fachada multikit real y los mismos adaptadores disponibles para
              formularios, pantallas dinámicas y apps generadas.
            </span>
          </div>
          <div class="field-library-actions">
            <span class="field-count">17 tipos</span>
            <app-ui-kit-button
              [label]="fieldLibraryOpen ? 'Ocultar galería' : 'Ver galería'"
              [icon]="fieldLibraryOpen ? 'pi pi-eye-slash' : 'pi pi-eye'"
              [kit]="previewKit"
              tone="secondary"
              variant="outline"
              (pressed)="fieldLibraryOpen = !fieldLibraryOpen"
            ></app-ui-kit-button>
          </div>
        </header>
        @if (fieldLibraryOpen) {
          <app-dynamic-field-library [kit]="previewKit"></app-dynamic-field-library>
        } @else {
          <app-status-notice>
            Abre la galería para montar los controles reales y comparar PrimeNG, Ionic, Material,
            Bootstrap y HTML base.
          </app-status-notice>
        }
      </section>

      @if (!filteredCatalog.length) {
        <app-status-notice title="Sin resultados">
          Cambia la búsqueda o los filtros para volver a mostrar componentes.
        </app-status-notice>
      } @else {
        <app-admin-card-grid ariaLabel="Component catalog" minColumnWidth="360px">
          @for (component of filteredCatalog; track component.name) {
            <app-component-doc-card
              [name]="component.name"
              [selector]="component.selector"
              [purpose]="component.purpose"
              [status]="statusLabel(component.status)"
              [category]="component.category"
              [consumers]="component.usedBy"
              [importPath]="component.importPath"
              [example]="component.example"
              [expanded]="isPreviewExpanded(component.name)"
              [kit]="previewKit"
              (previewToggle)="togglePreview(component.name)"
            >
              @if (isPreviewExpanded(component.name)) {
                <app-component-visual-preview
                  component-preview
                  [componentName]="component.name"
                  [kit]="previewKit"
                ></app-component-visual-preview>
              }
            </app-component-doc-card>
          }
        </app-admin-card-grid>
      }
    </app-page-shell>
  `
})
export class ComponentsPageComponent {
  readonly catalog = UI_COMPONENT_CATALOG;
  readonly categories = Array.from(new Set(this.catalog.map((item) => item.category))).sort();
  readonly sharedCount = this.catalog.filter((item) => item.status !== 'domain').length;
  readonly visualKits: Array<{ value: UiKitPreference; label: string }> = [
    { value: 'primeng', label: 'PrimeNG' },
    { value: 'ionic', label: 'Ionic' },
    { value: 'material', label: 'Material' },
    { value: 'bootstrap', label: 'Bootstrap' },
    { value: 'native', label: 'Base HTML' }
  ];

  search = '';
  category: 'all' | UiComponentCategory = 'all';
  previewKit: UiKitPreference = 'primeng';
  fieldLibraryOpen = false;
  readonly expandedPreviews = new Set<string>();

  readonly searchField: RuntimeField = {
    name: 'component-search',
    type: 'search',
    label: 'Buscar',
    placeholder: 'Nombre, selector o pantalla'
  };

  get categoryField(): RuntimeField {
    return {
      name: 'component-category',
      type: 'select',
      label: 'Categoría',
      placeholder: 'Todas',
      options: [
        { label: 'Todas', value: 'all' },
        ...this.categories.map((category) => ({ label: category, value: category }))
      ]
    };
  }

  get kitField(): RuntimeField {
    return {
      name: 'component-kit',
      type: 'select',
      label: 'Kit visual',
      placeholder: 'Selecciona un kit',
      options: this.visualKits
    };
  }

  get previewPresentation() {
    return { kit: this.previewKit };
  }

  get filteredCatalog() {
    const term = this.search.trim().toLowerCase();
    return this.catalog.filter((component) => {
      const matchesCategory = this.category === 'all' || component.category === this.category;
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
      return matchesCategory && matchesSearch;
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

  setSearch(value: unknown) {
    this.search = typeof value === 'string' ? value : '';
  }

  setCategory(value: unknown) {
    if (value === 'all' || this.categories.includes(value as UiComponentCategory)) {
      this.category = value as 'all' | UiComponentCategory;
    }
  }

  setPreviewKit(value: unknown) {
    if (this.visualKits.some((kit) => kit.value === value)) {
      this.previewKit = value as UiKitPreference;
    }
  }
}

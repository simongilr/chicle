import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export interface ScreenCanvasComponent {
  id: string;
  componentKey: string;
  title: string;
  region: string;
  bindingType: string;
  bindingKey: string;
  width: string;
  align: string;
  chrome: string;
  actionType: string;
  actionTarget: string;
  permission: string;
}

@Component({
  selector: 'app-screen-visual-canvas',
  standalone: true,
  imports: [NgTemplateOutlet, UiKitButtonComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .screen-canvas {
        display: grid;
        gap: 14px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: clamp(14px, 2vw, 20px);
      }

      :host([data-ui-kit='material']) .screen-canvas,
      :host([data-ui-kit='material']) .screen-block,
      :host([data-ui-kit='material']) .screen-topbar,
      :host([data-ui-kit='material']) .screen-aside,
      :host([data-ui-kit='material']) .empty-zone {
        border-radius: 4px;
      }

      :host([data-ui-kit='bootstrap']) .screen-canvas,
      :host([data-ui-kit='bootstrap']) .screen-block,
      :host([data-ui-kit='bootstrap']) .screen-topbar,
      :host([data-ui-kit='bootstrap']) .screen-aside,
      :host([data-ui-kit='bootstrap']) .empty-zone {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .screen-canvas,
      :host([data-ui-kit='ionic']) .screen-block,
      :host([data-ui-kit='ionic']) .screen-topbar,
      :host([data-ui-kit='ionic']) .screen-aside,
      :host([data-ui-kit='ionic']) .empty-zone {
        border-radius: 16px;
      }

      .screen-topbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        padding: 10px 12px;
      }

      .brand {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .brand strong,
      .brand span,
      .screen-heading h2,
      .screen-heading p {
        display: block;
        min-width: 0;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .brand strong {
        color: var(--ch-color-text);
        font-size: 0.95rem;
      }

      .brand span {
        color: var(--ch-color-muted);
        font-size: 0.74rem;
        font-weight: 750;
      }

      .menu {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
      }

      .menu-item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
        padding: 4px 10px;
        font-size: 0.76rem;
        font-weight: 850;
      }

      .menu-item.active {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      .screen-heading {
        display: grid;
        gap: 6px;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 14px;
      }

      .screen-heading h2 {
        color: var(--ch-color-text);
        font-size: clamp(1.2rem, 2vw, 1.55rem);
        line-height: 1.15;
      }

      .screen-heading p {
        max-width: 760px;
        color: var(--ch-color-muted);
        line-height: 1.42;
      }

      .screen-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(210px, 0.34fr);
        gap: 14px;
        align-items: start;
        min-width: 0;
      }

      .screen-body.mobile,
      .screen-body.tablet {
        grid-template-columns: 1fr;
      }

      .content-flow,
      .aside-flow,
      .action-flow,
      .header-flow {
        display: grid;
        gap: 10px;
        min-width: 0;
      }

      .header-flow {
        margin-top: -2px;
      }

      .screen-aside {
        display: grid;
        gap: 10px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        padding: 10px;
      }

      .zone-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ch-color-muted);
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .zone-label::after {
        content: '';
        flex: 1 1 auto;
        height: 1px;
        background: var(--ch-color-border);
      }

      .block-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 10px;
      }

      .screen-body.tablet .block-grid,
      .screen-body.mobile .block-grid {
        grid-template-columns: 1fr;
      }

      .screen-body.tablet .screen-block,
      .screen-body.mobile .screen-block {
        grid-column: 1 / -1 !important;
      }

      .screen-block {
        display: grid;
        gap: 10px;
        min-width: 0;
        min-height: 96px;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 12px;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }

      .screen-block.card {
        box-shadow: var(--ch-shadow-card);
      }

      .screen-block.plain {
        border-style: dashed;
        background: transparent;
      }

      .screen-block.toolbar {
        min-height: 62px;
        align-content: center;
      }

      .screen-block.modal,
      .screen-block.drawer {
        border-style: dashed;
      }

      .screen-block.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        box-shadow: 0 0 0 2px var(--ch-color-primary-soft);
      }

      .block-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
        min-width: 0;
      }

      .block-copy {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .block-copy strong,
      .block-copy span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .block-copy strong {
        font-size: 0.9rem;
        line-height: 1.2;
      }

      .block-copy span {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        line-height: 1.35;
      }

      .block-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        padding: 2px 7px;
        font-size: 0.68rem;
        font-weight: 850;
        white-space: nowrap;
      }

      .block-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .empty-zone {
        display: grid;
        place-items: center;
        min-height: 72px;
        border: 1px dashed var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        padding: 10px;
        text-align: center;
        font-size: 0.78rem;
        line-height: 1.35;
      }

      @media (max-width: 920px) {
        .screen-body {
          grid-template-columns: 1fr;
        }

        .screen-topbar {
          align-items: stretch;
        }

        .menu {
          justify-content: flex-start;
        }
      }
    `
  ],
  template: `
    <section class="screen-canvas" aria-label="Diseñador visual de pantalla">
      <nav class="screen-topbar" aria-label="Navegación de preview">
        <div class="brand">
          <strong>{{ appName || 'Mi app' }}</strong>
          <span>{{ targetLabel }} · {{ route || '/inicio' }}</span>
        </div>
        <div class="menu">
          @for (item of navigationItems; track item.route) {
            <span class="menu-item" [class.active]="item.active">{{ item.label }}</span>
          }
          @if (!navigationItems.length) {
            <span class="menu-item active">Inicio</span>
          }
        </div>
      </nav>

      <div class="header-flow">
        @if (componentsFor('header').length) {
          <span class="zone-label">Header</span>
          <div class="block-grid">
            @for (component of componentsFor('header'); track component.id) {
              <ng-container
                [ngTemplateOutlet]="blockTemplate"
                [ngTemplateOutletContext]="{ component: component }"
              ></ng-container>
            }
          </div>
        }
      </div>

      <header class="screen-heading">
        <h2>{{ screenTitle || 'Pantalla sin título' }}</h2>
        <p>{{ screenDescription || 'Describe qué verá el usuario en esta pantalla.' }}</p>
      </header>

      <div class="screen-body" [class.tablet]="viewport === 'tablet'" [class.mobile]="viewport === 'mobile'">
        <main class="content-flow">
          <span class="zone-label">Contenido</span>
          <div class="block-grid">
            @for (component of componentsFor('content'); track component.id) {
              <ng-container
                [ngTemplateOutlet]="blockTemplate"
                [ngTemplateOutletContext]="{ component: component }"
              ></ng-container>
            }
            @if (!componentsFor('content').length) {
              <div class="empty-zone" style="grid-column: 1 / -1;">Agrega formularios, tablas, cards o galerías.</div>
            }
          </div>

          @if (componentsFor('actions').length) {
            <section class="action-flow">
              <span class="zone-label">Acciones</span>
              <div class="block-grid">
                @for (component of componentsFor('actions'); track component.id) {
                  <ng-container
                    [ngTemplateOutlet]="blockTemplate"
                    [ngTemplateOutletContext]="{ component: component }"
                  ></ng-container>
                }
              </div>
            </section>
          }
        </main>

        <aside class="screen-aside">
          <span class="zone-label">Lateral</span>
          @for (component of componentsFor('aside'); track component.id) {
            <ng-container
              [ngTemplateOutlet]="blockTemplate"
              [ngTemplateOutletContext]="{ component: component }"
            ></ng-container>
          }
          @if (!componentsFor('aside').length) {
            <div class="empty-zone">Filtros, menú lateral o contexto.</div>
          }
        </aside>
      </div>
    </section>

    <ng-template #blockTemplate let-component="component">
      <article
        class="screen-block"
        [class.active]="component.id === selectedId"
        [class.card]="component.chrome === 'card'"
        [class.plain]="component.chrome === 'plain'"
        [class.toolbar]="component.chrome === 'toolbar'"
        [class.modal]="component.chrome === 'modal'"
        [class.drawer]="component.chrome === 'drawer'"
        [style.grid-column]="componentColumn(component)"
        [style.justify-self]="component.align === 'stretch' ? 'stretch' : component.align"
        role="button"
        tabindex="0"
        (click)="selected.emit(component.id)"
        (keydown.enter)="selected.emit(component.id)"
      >
        <div class="block-head">
          <div class="block-copy">
            <strong>{{ component.title }}</strong>
            <span>{{ componentDescription(component) }}</span>
          </div>
          <span class="block-chip">{{ component.width }}</span>
        </div>

        <div class="block-copy">
          <span>{{ bindingSummary(component) }}</span>
          <span>{{ actionSummary(component) }}</span>
        </div>

        <div class="block-actions" (click)="$event.stopPropagation()">
          <app-ui-kit-button
            label="Editar"
            icon="pi pi-pencil"
            tone="secondary"
            variant="ghost"
            size="small"
            (pressed)="selected.emit(component.id)"
          ></app-ui-kit-button>
          <app-ui-kit-button
            label="Subir"
            icon="pi pi-arrow-up"
            tone="secondary"
            variant="ghost"
            size="small"
            (pressed)="moved.emit({ id: component.id, direction: -1 })"
          ></app-ui-kit-button>
          <app-ui-kit-button
            label="Bajar"
            icon="pi pi-arrow-down"
            tone="secondary"
            variant="ghost"
            size="small"
            (pressed)="moved.emit({ id: component.id, direction: 1 })"
          ></app-ui-kit-button>
        </div>
      </article>
    </ng-template>
  `
})
export class ScreenVisualCanvasComponent extends UiKitAwareComponent {
  @Input() appName = '';
  @Input() targetLabel = 'multi';
  @Input() route = '/inicio';
  @Input() screenTitle = '';
  @Input() screenDescription = '';
  @Input() viewport: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  @Input() components: ScreenCanvasComponent[] = [];
  @Input() selectedId: string | null = null;
  @Input() navigationItems: Array<{ label: string; route: string; active: boolean }> = [];

  @Output() readonly selected = new EventEmitter<string>();
  @Output() readonly moved = new EventEmitter<{ id: string; direction: -1 | 1 }>();

  componentsFor(region: string) {
    return this.components.filter((component) => component.region === region);
  }

  componentColumn(component: ScreenCanvasComponent) {
    if (this.viewport !== 'desktop') {
      return '1 / -1';
    }
    const columns: Record<string, string> = {
      full: 'span 12',
      two_thirds: 'span 8',
      half: 'span 6',
      third: 'span 4',
      quarter: 'span 3',
      auto: component.region === 'header' ? 'span 12' : 'span 6'
    };
    return columns[component.width] ?? 'span 6';
  }

  componentDescription(component: ScreenCanvasComponent) {
    const descriptions: Record<string, string> = {
      nav_menu: 'Menú superior conectado a las rutas publicadas.',
      side_nav: 'Navegación lateral para secciones amplias.',
      bottom_nav: 'Navegación inferior para móvil.',
      tabs: 'Tabs para agrupar vistas relacionadas.',
      auth_login: 'Login estándar conectado a Auth.',
      form_runtime: 'Formulario dinámico publicado.',
      data_table: 'Listado conectado a servicio o tabla.',
      service_button: 'Botón que ejecuta un servicio dinámico.',
      flow_button: 'Botón que dispara un flow publicado.',
      metric_strip: 'Indicadores de negocio.',
      chart_panel: 'Gráfico o resumen visual.',
      entity_card: 'Card de entidad o registro.',
      detail_panel: 'Detalle de registro.',
      timeline: 'Historial de eventos.',
      media_gallery: 'Galería de imágenes o evidencias.',
      map_view: 'Mapa o ubicación GPS.',
      modal_shell: 'Modal configurable.'
    };
    return descriptions[component.componentKey] ?? 'Bloque reutilizable de pantalla.';
  }

  bindingSummary(component: ScreenCanvasComponent) {
    if (component.bindingType === 'none' || !component.bindingKey) {
      return 'Sin datos conectados';
    }
    return `${component.bindingType}: ${component.bindingKey}`;
  }

  actionSummary(component: ScreenCanvasComponent) {
    if (component.actionType === 'none') {
      return 'Sin acción primaria';
    }
    return `${component.actionType}${component.actionTarget ? ': ' + component.actionTarget : ''}`;
  }
}

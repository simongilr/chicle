import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export interface ComponentPaletteItem {
  key: string;
  label: string;
  description: string;
  icon?: string;
  group?: string;
}

@Component({
  selector: 'app-component-palette',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: grid;
        min-width: 0;
      }

      .palette {
        display: grid;
        gap: 10px;
      }

      .palette-header {
        display: grid;
        gap: 3px;
      }

      .palette-header strong,
      .palette-header span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .palette-header strong {
        color: var(--ch-color-text);
        font-size: 0.96rem;
      }

      .palette-header span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.38;
      }

      .palette-help {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius-sm);
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
        padding: 7px 8px;
        font-size: 0.73rem;
        line-height: 1.35;
      }

      .palette-help i {
        color: var(--ch-color-primary);
      }

      .palette-grid {
        display: grid;
        gap: 10px;
        min-width: 0;
        padding: 2px;
      }

      .palette-group-block {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      .palette-group-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ch-color-muted);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .palette-group-title::after {
        content: '';
        flex: 1 1 auto;
        height: 1px;
        background: var(--ch-color-border);
      }

      .palette-group-grid {
        display: grid;
        gap: 6px;
      }

      .palette-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 9px;
        align-items: center;
        min-width: 0;
        width: 100%;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 9px;
        text-align: left;
        font: inherit;
        cursor: pointer;
        transition:
          background 140ms ease,
          border-color 140ms ease,
          transform 140ms ease;
      }

      .palette-item:hover,
      .palette-item:focus-visible {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        outline: none;
        transform: translateY(-1px);
      }

      :host([data-ui-kit='material']) .palette-item {
        border-radius: 4px;
      }

      :host([data-ui-kit='bootstrap']) .palette-item {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .palette-item {
        border-radius: 14px;
      }

      .palette-main {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .palette-icon {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 9px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      .palette-label {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 0.84rem;
        font-weight: 850;
      }

      .palette-description {
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        line-height: 1.28;
      }

      .palette-drag {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        font-size: 0.75rem;
      }

      @media (max-width: 760px) {
        .palette-item {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .palette-drag {
          display: none;
        }
      }
    `
  ],
  template: `
    <section class="palette" aria-label="Paleta de componentes">
      <div class="palette-header">
        <strong>{{ title }}</strong>
        <span>{{ description }}</span>
      </div>

      <div class="palette-help">
        <i class="pi pi-arrows-alt" aria-hidden="true"></i>
        <span>Arrastra un bloque a Header, Contenido, Lateral o Acciones. También puedes tocarlo para agregarlo con su ubicación recomendada.</span>
      </div>

      <div class="palette-grid">
        @for (group of groupedItems(); track group.name) {
          <div class="palette-group-block">
            <span class="palette-group-title">{{ group.name }}</span>
            <div class="palette-group-grid">
              @for (item of group.items; track item.key) {
                <button
                  type="button"
                  class="palette-item"
                  draggable="true"
                  (click)="selected.emit(item.key)"
                  (dragstart)="startDrag($event, item.key)"
                >
              @if (item.icon) {
                <span class="palette-icon"><i [class]="item.icon" aria-hidden="true"></i></span>
              }
                  <span class="palette-main">
                    <span class="palette-label">{{ item.label }}</span>
                    <span class="palette-description">{{ item.description }}</span>
                  </span>
                  <span class="palette-drag"><i class="pi pi-grip-vertical" aria-hidden="true"></i></span>
                </button>
              }
            </div>
          </div>
            }
      </div>
    </section>
  `
})
export class ComponentPaletteComponent extends UiKitAwareComponent {
  @Input() title = 'Bloques';
  @Input() description = 'Agrega piezas reutilizables a la pantalla.';
  @Input() items: ComponentPaletteItem[] = [];
  @Output() readonly selected = new EventEmitter<string>();

  groupedItems() {
    const groups = new Map<string, ComponentPaletteItem[]>();
    for (const item of this.items) {
      const group = item.group || 'Componentes';
      groups.set(group, [...(groups.get(group) ?? []), item]);
    }
    return Array.from(groups, ([name, items]) => ({ name, items }));
  }

  startDrag(event: DragEvent, key: string) {
    event.dataTransfer?.setData('application/x-chicle-component', key);
    event.dataTransfer?.setData('text/plain', key);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}

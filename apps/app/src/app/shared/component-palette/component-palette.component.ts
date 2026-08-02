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

      .palette-grid {
        display: grid;
        gap: 8px;
      }

      .palette-item {
        display: grid;
        gap: 6px;
        min-width: 0;
        width: 100%;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 11px;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }

      .palette-item:hover,
      .palette-item:focus-visible {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        outline: none;
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
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .palette-icon {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 10px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      .palette-label {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 0.86rem;
        font-weight: 850;
      }

      .palette-description {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        line-height: 1.34;
      }

      .palette-group {
        display: inline-flex;
        width: fit-content;
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        padding: 2px 7px;
        font-size: 0.68rem;
        font-weight: 850;
      }
    `
  ],
  template: `
    <section class="palette" aria-label="Paleta de componentes">
      <div class="palette-header">
        <strong>{{ title }}</strong>
        <span>{{ description }}</span>
      </div>

      <div class="palette-grid">
        @for (item of items; track item.key) {
          <button type="button" class="palette-item" (click)="selected.emit(item.key)">
            <span class="palette-main">
              @if (item.icon) {
                <span class="palette-icon"><i [class]="item.icon" aria-hidden="true"></i></span>
              }
              <span class="palette-label">{{ item.label }}</span>
            </span>
            <span class="palette-description">{{ item.description }}</span>
            @if (item.group) {
              <span class="palette-group">{{ item.group }}</span>
            }
          </button>
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
}

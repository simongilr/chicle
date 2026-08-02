import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export interface ScreenInspectorComponent {
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
  selector: 'app-screen-component-inspector',
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

      .inspector {
        display: grid;
        gap: 11px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-left: 3px solid var(--ch-color-primary);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 12px;
      }

      :host([data-ui-kit='material']) .inspector {
        border-radius: 4px;
      }

      :host([data-ui-kit='bootstrap']) .inspector {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .inspector {
        border-radius: 16px;
      }

      .copy {
        display: grid;
        gap: 4px;
      }

      .copy strong,
      .copy span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .copy strong {
        color: var(--ch-color-text);
        font-size: 0.96rem;
      }

      .copy span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.38;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
      }

      .item {
        display: grid;
        gap: 3px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius-sm);
        background: var(--ch-color-surface-alt);
        padding: 8px;
      }

      .item small,
      .item b {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .item small {
        color: var(--ch-color-muted);
        font-size: 0.68rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .item b {
        color: var(--ch-color-text);
        font-size: 0.82rem;
      }
    `
  ],
  template: `
    <section class="inspector" aria-label="Inspector de componente">
      @if (component) {
        <div class="copy">
          <strong>{{ component.title }}</strong>
          <span>{{ summary || 'Edita el bloque seleccionado desde sus propiedades.' }}</span>
        </div>
        <div class="grid">
          <div class="item">
            <small>Tipo</small>
            <b>{{ component.componentKey }}</b>
          </div>
          <div class="item">
            <small>Ubicación</small>
            <b>{{ component.region }} · {{ component.width }}</b>
          </div>
          <div class="item">
            <small>Datos</small>
            <b>{{ component.bindingType }} {{ component.bindingKey || '' }}</b>
          </div>
          <div class="item">
            <small>Acción</small>
            <b>{{ component.actionType }} {{ component.actionTarget || '' }}</b>
          </div>
          <div class="item">
            <small>Permiso</small>
            <b>{{ component.permission || 'sin permiso propio' }}</b>
          </div>
        </div>
      } @else {
        <div class="copy">
          <strong>Selecciona un bloque</strong>
          <span>Haz clic sobre un componente del preview para editar sus propiedades, datos, acción y permisos.</span>
        </div>
      }
    </section>
  `
})
export class ScreenComponentInspectorComponent extends UiKitAwareComponent {
  @Input() component: ScreenInspectorComponent | null = null;
  @Input() summary = '';
}

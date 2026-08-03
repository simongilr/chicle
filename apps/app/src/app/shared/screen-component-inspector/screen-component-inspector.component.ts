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
        gap: 12px;
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

      .inspector-title {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        min-width: 0;
      }

      .inspector-icon {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 12px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
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

      .guide {
        display: grid;
        gap: 7px;
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius-sm);
        background: var(--ch-color-surface-alt);
        padding: 10px;
      }

      .guide-step {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        line-height: 1.34;
      }

      .guide-step b {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
        font-size: 0.7rem;
      }
    `
  ],
  template: `
    <section class="inspector" aria-label="Inspector de componente">
      @if (component) {
        <div class="inspector-title">
          <span class="inspector-icon"><i class="pi pi-sliders-h" aria-hidden="true"></i></span>
          <div class="copy">
            <strong>{{ component.title }}</strong>
            <span>{{ summary || 'Edita el bloque seleccionado desde sus propiedades.' }}</span>
          </div>
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
        <div class="inspector-title">
          <span class="inspector-icon"><i class="pi pi-mouse" aria-hidden="true"></i></span>
          <div class="copy">
            <strong>Selecciona un bloque</strong>
            <span>El inspector aparece aquí cuando eliges un componente del canvas.</span>
          </div>
        </div>
        <div class="guide">
          <span class="guide-step"><b>1</b><span>Arrastra un bloque desde la paleta.</span></span>
          <span class="guide-step"><b>2</b><span>Haz clic sobre el bloque en el canvas.</span></span>
          <span class="guide-step"><b>3</b><span>Configura recurso, acción, ancho, permiso y estilo.</span></span>
        </div>
      }
    </section>
  `
})
export class ScreenComponentInspectorComponent extends UiKitAwareComponent {
  @Input() component: ScreenInspectorComponent | null = null;
  @Input() summary = '';
}

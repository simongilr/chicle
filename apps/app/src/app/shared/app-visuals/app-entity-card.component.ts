import { Component, Input } from '@angular/core';
import { AppEntityCard, AppVisualKind } from './app-visuals.types';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

const KIND_ICONS: Record<AppVisualKind, string> = {
  event: 'pi pi-calendar',
  property: 'pi pi-building',
  ticket: 'pi pi-ticket',
  service: 'pi pi-briefcase',
  game: 'pi pi-bolt',
  inspection: 'pi pi-camera'
};

@Component({
  selector: 'app-entity-card',
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

      .entity {
        display: grid;
        gap: 10px;
        height: 100%;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px;
      }

      :host([data-ui-kit='material']) .entity {
        border-radius: 4px;
        box-shadow: 0 1px 5px color-mix(in srgb, var(--ch-color-text) 14%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .entity {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .entity {
        border-radius: 16px;
        padding: 12px;
      }

      :host([data-ui-kit='native']) .entity {
        border-radius: 2px;
      }

      .visual {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 58px;
        border-radius: 7px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 10px;
      }

      .visual i {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-primary);
      }

      .visual-label {
        min-width: 0;
        overflow: hidden;
        font-size: 0.74rem;
        font-weight: 850;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .copy {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      .title-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
      }

      h4 {
        min-width: 0;
        margin: 0;
        color: var(--ch-color-text);
        font-size: 0.98rem;
        line-height: 1.18;
      }

      .price {
        flex: 0 0 auto;
        color: var(--ch-color-success);
        font-size: 0.82rem;
        font-weight: 850;
      }

      p {
        margin: 0;
        color: var(--ch-color-muted);
        font-size: 0.8rem;
        line-height: 1.35;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }

      .status,
      .action {
        min-height: 26px;
        border-radius: 999px;
        padding: 5px 9px;
        font-size: 0.72rem;
        font-weight: 850;
        line-height: 1;
      }

      .status {
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
      }

      .action {
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
      }

      .kind-property .visual {
        background: var(--ch-color-success-soft);
      }

      .kind-property .visual i {
        color: var(--ch-color-success);
      }

      .kind-ticket .visual {
        background: var(--ch-color-warning-soft);
      }

      .kind-ticket .visual i {
        color: var(--ch-color-warning);
      }

      .kind-service .visual {
        background: var(--ch-color-primary-soft);
      }

      .kind-service .visual i {
        color: var(--ch-color-primary);
      }

      .kind-game .visual {
        background: var(--ch-color-surface-muted);
      }

      .kind-game .visual i {
        color: var(--ch-color-primary);
      }

      .kind-inspection .visual {
        background: var(--ch-color-success-soft);
      }

      .kind-inspection .visual i {
        color: var(--ch-color-success);
      }
    `
  ],
  template: `
    <article class="entity" [class.kind-event]="card.kind === 'event'" [class.kind-property]="card.kind === 'property'" [class.kind-ticket]="card.kind === 'ticket'" [class.kind-service]="card.kind === 'service'" [class.kind-game]="card.kind === 'game'" [class.kind-inspection]="card.kind === 'inspection'">
      <div class="visual">
        <i [class]="card.icon || iconFor(card.kind)" aria-hidden="true"></i>
        <span class="visual-label">{{ card.imageLabel || card.kind }}</span>
      </div>
      <div class="copy">
        <div class="title-row">
          <h4>{{ card.title }}</h4>
          @if (card.price) {
            <span class="price">{{ card.price }}</span>
          }
        </div>
        <p>{{ card.subtitle }}</p>
        @if (card.detail) {
          <p>{{ card.detail }}</p>
        }
      </div>
      <div class="meta">
        @if (card.status) {
          <span class="status">{{ card.status }}</span>
        }
        @if (card.actionLabel) {
          <span class="action">{{ card.actionLabel }}</span>
        }
      </div>
    </article>
  `
})
export class AppEntityCardComponent extends UiKitAwareComponent {
  @Input() card: AppEntityCard = {
    kind: 'service',
    title: 'Elemento',
    subtitle: 'Resumen del elemento'
  };

  iconFor(kind: AppVisualKind) {
    return KIND_ICONS[kind];
  }
}

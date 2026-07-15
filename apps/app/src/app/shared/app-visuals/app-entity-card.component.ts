import { Component, Input } from '@angular/core';
import { AppEntityCard, AppVisualKind } from './app-visuals.types';

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
        border: 1px solid #cbd9e6;
        border-radius: 8px;
        background: #ffffff;
        padding: 10px;
      }

      .visual {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 58px;
        border-radius: 7px;
        background: #edf5fb;
        color: #12385c;
        padding: 10px;
      }

      .visual i {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: #ffffff;
        color: #185a9d;
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
        color: #12385c;
        font-size: 0.98rem;
        line-height: 1.18;
      }

      .price {
        flex: 0 0 auto;
        color: #1f7a53;
        font-size: 0.82rem;
        font-weight: 850;
      }

      p {
        margin: 0;
        color: #52677a;
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
        background: #edf7f1;
        color: #1f7a53;
      }

      .action {
        border: 1px solid #bfd0e0;
        background: #ffffff;
        color: #12385c;
      }

      .kind-property .visual {
        background: #eef6ee;
      }

      .kind-property .visual i {
        color: #2f6e3f;
      }

      .kind-ticket .visual {
        background: #fff5df;
      }

      .kind-ticket .visual i {
        color: #9a5c00;
      }

      .kind-service .visual {
        background: #edf2ff;
      }

      .kind-service .visual i {
        color: #3457a6;
      }

      .kind-game .visual {
        background: #f4efff;
      }

      .kind-game .visual i {
        color: #6d45a3;
      }

      .kind-inspection .visual {
        background: #eaf7f5;
      }

      .kind-inspection .visual i {
        color: #167062;
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
export class AppEntityCardComponent {
  @Input() card: AppEntityCard = {
    kind: 'service',
    title: 'Elemento',
    subtitle: 'Resumen del elemento'
  };

  iconFor(kind: AppVisualKind) {
    return KIND_ICONS[kind];
  }
}

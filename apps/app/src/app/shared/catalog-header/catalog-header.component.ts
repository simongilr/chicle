import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-catalog-header',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .copy {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      h2 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1.15rem;
      }

      span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.35;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
        align-items: center;
      }

      :host([data-ui-kit='material']) .header {
        min-height: 48px;
      }

      :host([data-ui-kit='material']) h2 {
        font-size: 1.05rem;
        font-weight: 500;
      }

      :host([data-ui-kit='bootstrap']) .header {
        gap: 12px;
      }

      :host([data-ui-kit='bootstrap']) h2 {
        font-size: 1.1rem;
        font-weight: 600;
      }

      :host([data-ui-kit='ionic']) .header {
        align-items: flex-start;
        min-height: 48px;
      }

      :host([data-ui-kit='ionic']) h2 {
        font-size: 1.05rem;
        font-weight: 700;
      }

      :host ::ng-deep .actions button {
        width: auto;
        min-height: 34px;
        min-width: 0;
        flex: 0 0 auto;
        border-radius: 7px;
        padding: 7px 10px;
      }

      @media (max-width: 340px) {
        .header {
          grid-template-columns: 1fr;
        }

        .actions {
          justify-content: flex-start;
        }
      }
    `
  ],
  template: `
    <header class="header">
      <div class="copy">
        <h2>{{ title }}</h2>
        @if (summary) {
          <span>{{ summary }}</span>
        }
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </header>
  `
})
export class CatalogHeaderComponent extends UiKitAwareComponent {
  @Input({ required: true }) title = '';
  @Input() summary = '';
}

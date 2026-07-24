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
        container-type: inline-size;
      }

      .header {
        display: grid;
        grid-template-columns: minmax(84px, 1fr) auto;
        align-items: start;
        justify-content: space-between;
        gap: 6px;
      }

      .copy {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      h2 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1.05rem;
        line-height: 1.15;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.35;
      }

      .actions {
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-end;
        gap: 4px;
        align-items: center;
        min-width: 0;
      }

      :host([data-ui-kit='material']) .header {
        min-height: 42px;
      }

      :host([data-ui-kit='material']) h2 {
        font-size: 1rem;
        font-weight: 500;
      }

      :host([data-ui-kit='bootstrap']) .header {
        gap: 8px;
      }

      :host([data-ui-kit='bootstrap']) h2 {
        font-size: 1rem;
        font-weight: 600;
      }

      :host([data-ui-kit='ionic']) .header {
        align-items: flex-start;
        min-height: 42px;
      }

      :host([data-ui-kit='ionic']) h2 {
        font-size: 1rem;
        font-weight: 700;
      }

      :host ::ng-deep .actions button,
      :host ::ng-deep .actions ion-button,
      :host ::ng-deep .actions .p-button {
        width: auto;
        min-height: 30px;
        min-width: 0;
        flex: 0 0 auto;
        border-radius: 7px;
        padding: 5px 8px;
        white-space: nowrap;
      }

      :host ::ng-deep .actions app-ui-kit-button {
        flex: 0 1 auto;
        min-width: 0;
        font-size: 0.8rem;
        --button-min-height: 30px;
      }

      :host ::ng-deep .actions app-ui-kit-button ion-button {
        --padding-end: 8px;
        --padding-start: 8px;
      }

      @container (max-width: 190px) {
        .header {
          grid-template-columns: 1fr;
          align-items: start;
          gap: 8px;
          min-height: 0;
        }

        .actions {
          justify-content: flex-start;
          width: 100%;
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

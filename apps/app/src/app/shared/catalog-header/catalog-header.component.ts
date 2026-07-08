import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-catalog-header',
  standalone: true,
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
        color: #173b5f;
        font-size: 1.15rem;
      }

      span {
        color: #52677a;
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
export class CatalogHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() summary = '';
}

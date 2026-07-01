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
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
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
        gap: 8px;
        align-items: center;
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

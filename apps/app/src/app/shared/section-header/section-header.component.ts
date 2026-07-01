import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
      }

      .header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .copy {
        display: grid;
        gap: 4px;
        min-width: min(100%, 260px);
      }

      .step {
        color: #587087;
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: #173b5f;
        font-size: 1.15rem;
      }

      p {
        color: #52677a;
        line-height: 1.45;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .actions:empty {
        display: none;
      }

      :host ::ng-deep .actions button {
        width: auto;
        min-width: 0;
        flex: 0 0 auto;
      }
    `
  ],
  template: `
    <header class="header">
      <div class="copy">
        @if (stepLabel) {
          <span class="step">{{ stepLabel }}</span>
        }
        <h2>{{ title }}</h2>
        @if (description) {
          <p>{{ description }}</p>
        }
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </header>
  `
})
export class SectionHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() stepLabel = '';
}

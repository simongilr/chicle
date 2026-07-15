import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-section-header',
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
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      :host([data-ui-kit='material']) .header {
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 10px;
      }

      :host([data-ui-kit='bootstrap']) .header {
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 8px;
      }

      :host([data-ui-kit='ionic']) .header {
        gap: 10px;
      }

      :host([data-ui-kit='ionic']) h2 {
        font-size: 1.08rem;
      }

      .copy {
        display: grid;
        gap: 4px;
        min-width: min(100%, 260px);
      }

      .step {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.15rem;
      }

      p {
        color: var(--ch-color-muted);
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
export class SectionHeaderComponent extends UiKitAwareComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() stepLabel = '';
}

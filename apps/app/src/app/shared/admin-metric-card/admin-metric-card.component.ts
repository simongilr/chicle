import { Component, Input } from '@angular/core';
import { UiKitCardComponent } from '../ui-kit-card/ui-kit-card.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type AdminMetricTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-admin-metric-card',
  standalone: true,
  imports: [UiKitCardComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit',
    '[attr.data-tone]': 'tone'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .metric-card {
        display: grid;
        gap: 6px;
        min-width: 0;
        min-height: 94px;
      }

      span {
        color: var(--ch-color-muted);
        font-size: 0.84rem;
        line-height: 1.45;
      }

      strong {
        color: var(--ch-color-text);
        font-size: 1.1rem;
        overflow-wrap: anywhere;
      }
    `
  ],
  template: `
    <app-ui-kit-card [kit]="kit" [tone]="tone" variant="subtle" padding="14px">
      <article class="metric-card">
        @if (label) {
          <span>{{ label }}</span>
        }
        <strong>{{ value }}</strong>
        @if (detail) {
          <span>{{ detail }}</span>
        }
      </article>
    </app-ui-kit-card>
  `
})
export class AdminMetricCardComponent extends UiKitAwareComponent {
  @Input() label = '';
  @Input({ required: true }) value = '';
  @Input() detail = '';
  @Input() tone: AdminMetricTone = 'neutral';
}

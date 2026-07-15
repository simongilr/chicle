import { Component, Input } from '@angular/core';
import { AppMetricItem } from './app-visuals.types';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-metric-strip',
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

      .metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        gap: 10px;
      }

      .metric {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 10px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px;
      }

      :host([data-ui-kit='material']) .metric {
        border-radius: 4px;
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .metric {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .metric {
        border-radius: 16px;
        padding: 12px;
      }

      :host([data-ui-kit='native']) .metric {
        border-radius: 2px;
      }

      .metric-icon {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: var(--ch-radius);
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
        font-size: 0.95rem;
      }

      .metric-copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .metric-value {
        color: var(--ch-color-text);
        font-size: 1.05rem;
        font-weight: 850;
        line-height: 1.1;
      }

      .metric-label,
      .metric-trend {
        overflow: hidden;
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .metric-trend {
        color: var(--ch-color-success);
        font-weight: 800;
      }

      @media (max-width: 520px) {
        .metrics {
          grid-template-columns: 1fr 1fr;
        }

        .metric {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }
    `
  ],
  template: `
    <div class="metrics">
      @for (item of items; track item.label) {
        <article class="metric">
          <span class="metric-icon" aria-hidden="true"><i [class]="item.icon || 'pi pi-chart-line'"></i></span>
          <span class="metric-copy">
            <strong class="metric-value">{{ item.value }}</strong>
            <span class="metric-label">{{ item.label }}</span>
            @if (item.trend) {
              <span class="metric-trend">{{ item.trend }}</span>
            }
          </span>
        </article>
      }
    </div>
  `
})
export class AppMetricStripComponent extends UiKitAwareComponent {
  @Input() items: AppMetricItem[] = [];
}

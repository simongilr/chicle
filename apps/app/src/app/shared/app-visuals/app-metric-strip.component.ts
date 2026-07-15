import { Component, Input } from '@angular/core';
import { AppMetricItem } from './app-visuals.types';

@Component({
  selector: 'app-metric-strip',
  standalone: true,
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
        border: 1px solid #cbd9e6;
        border-radius: 8px;
        background: #ffffff;
        padding: 10px;
      }

      .metric-icon {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: #e8f2ff;
        color: #185a9d;
        font-size: 0.95rem;
      }

      .metric-copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .metric-value {
        color: #12385c;
        font-size: 1.05rem;
        font-weight: 850;
        line-height: 1.1;
      }

      .metric-label,
      .metric-trend {
        overflow: hidden;
        color: #52677a;
        font-size: 0.76rem;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .metric-trend {
        color: #1f7a53;
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
export class AppMetricStripComponent {
  @Input() items: AppMetricItem[] = [];
}

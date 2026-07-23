import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type AdminMetricTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-admin-metric-card',
  standalone: true,
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
        border: 1px solid var(--metric-border);
        border-radius: var(--metric-radius);
        background: var(--metric-bg);
        box-shadow: var(--metric-shadow);
        padding: 14px;
      }

      :host {
        --metric-bg: var(--ch-color-surface-alt);
        --metric-border: var(--ch-color-border);
        --metric-radius: var(--ch-radius);
        --metric-shadow: none;
      }

      :host([data-tone='primary']) {
        --metric-bg: color-mix(in srgb, var(--ch-color-primary-soft) 78%, var(--ch-color-surface));
        --metric-border: var(--ch-color-primary-border);
      }

      :host([data-tone='success']) {
        --metric-bg: var(--ch-color-success-soft);
        --metric-border: var(--ch-color-success-border);
      }

      :host([data-tone='warning']) {
        --metric-bg: var(--ch-color-warning-soft);
        --metric-border: var(--ch-color-warning-border);
      }

      :host([data-tone='danger']) {
        --metric-bg: var(--ch-color-danger-soft);
        --metric-border: var(--ch-color-danger-border);
      }

      :host([data-ui-kit='ionic']) {
        --metric-radius: 16px;
      }

      :host([data-ui-kit='material']) {
        --metric-radius: 4px;
        --metric-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 10%, transparent);
      }

      :host([data-ui-kit='bootstrap']) {
        --metric-radius: 6px;
      }

      :host([data-ui-kit='native']) {
        --metric-radius: 2px;
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
    <article class="metric-card">
      @if (label) {
        <span>{{ label }}</span>
      }
      <strong>{{ value }}</strong>
      @if (detail) {
        <span>{{ detail }}</span>
      }
    </article>
  `
})
export class AdminMetricCardComponent extends UiKitAwareComponent {
  @Input() label = '';
  @Input({ required: true }) value = '';
  @Input() detail = '';
  @Input() tone: AdminMetricTone = 'neutral';
}

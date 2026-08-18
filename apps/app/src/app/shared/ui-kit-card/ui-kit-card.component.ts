import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type UiKitCardTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
export type UiKitCardVariant = 'surface' | 'subtle' | 'outline';

@Component({
  selector: 'app-ui-kit-card',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit',
    '[attr.data-tone]': 'tone',
    '[attr.data-variant]': 'variant'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .card-base {
        display: grid;
        gap: var(--card-gap);
        min-width: 0;
        border: 1px solid var(--card-border);
        border-radius: var(--card-radius);
        background: var(--card-bg);
        box-shadow: var(--card-shadow);
        color: var(--ch-color-text);
        padding: var(--card-padding);
      }

      :host {
        --card-bg: var(--ch-color-surface);
        --card-border: var(--ch-color-border);
        --card-radius: var(--ch-radius);
        --card-shadow: var(--ch-shadow-card);
      }

      :host([data-variant='subtle']) {
        --card-bg: var(--ch-color-surface-alt);
        --card-shadow: none;
      }

      :host([data-variant='outline']) {
        --card-shadow: none;
      }

      :host([data-tone='primary']) {
        --card-bg: color-mix(in srgb, var(--ch-color-primary-soft) 78%, var(--ch-color-surface));
        --card-border: var(--ch-color-primary-border);
      }

      :host([data-tone='success']) {
        --card-bg: var(--ch-color-success-soft);
        --card-border: var(--ch-color-success-border);
      }

      :host([data-tone='warning']) {
        --card-bg: var(--ch-color-warning-soft);
        --card-border: var(--ch-color-warning-border);
      }

      :host([data-tone='danger']) {
        --card-bg: var(--ch-color-danger-soft);
        --card-border: var(--ch-color-danger-border);
      }

      :host([data-ui-kit='ionic']) {
        --card-radius: 16px;
        --card-shadow: 0 12px 30px color-mix(in srgb, var(--ch-color-primary) 8%, transparent);
      }

      :host([data-ui-kit='material']) {
        --card-radius: 4px;
        --card-shadow: 0 2px 8px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='primeng']) {
        --card-radius: var(--ch-radius);
      }

      :host([data-ui-kit='bootstrap']) {
        --card-radius: 0.375rem;
        --card-shadow: none;
      }

      :host([data-ui-kit='native']) {
        --card-radius: 2px;
        --card-shadow: none;
      }
    `
  ],
  template: `
    <article
      class="card-base"
      [style.--card-padding]="padding"
      [style.--card-gap]="gap"
    >
      <ng-content></ng-content>
    </article>
  `
})
export class UiKitCardComponent extends UiKitAwareComponent {
  @Input() tone: UiKitCardTone = 'neutral';
  @Input() variant: UiKitCardVariant = 'surface';
  @Input() padding = '16px';
  @Input() gap = '12px';
}

import { Component, Input } from '@angular/core';
import { AppTimelineItem } from './app-visuals.types';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-app-timeline',
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

      .timeline {
        display: grid;
        gap: 8px;
      }

      .item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 9px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 9px;
      }

      :host([data-ui-kit='material']) .item {
        border-radius: 4px;
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .item {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .item {
        border-radius: 14px;
        padding: 10px;
      }

      :host([data-ui-kit='native']) .item {
        border-radius: 2px;
      }

      .dot {
        width: 10px;
        height: 10px;
        margin-top: 4px;
        border-radius: 999px;
        background: var(--ch-color-muted);
        box-shadow: 0 0 0 4px var(--ch-color-surface-muted);
      }

      .item.complete .dot {
        background: var(--ch-color-success);
        box-shadow: 0 0 0 4px var(--ch-color-success-soft);
      }

      .item.active .dot {
        background: var(--ch-color-primary);
        box-shadow: 0 0 0 4px var(--ch-color-primary-soft);
      }

      .item.warning .dot {
        background: var(--ch-color-warning);
        box-shadow: 0 0 0 4px var(--ch-color-warning-soft);
      }

      .copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      strong {
        color: var(--ch-color-text);
        font-size: 0.84rem;
        line-height: 1.2;
      }

      span {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        line-height: 1.3;
      }
    `
  ],
  template: `
    <div class="timeline">
      @for (item of items; track item.label) {
        <div class="item" [class.complete]="item.state === 'complete'" [class.active]="item.state === 'active'" [class.warning]="item.state === 'warning'">
          <span class="dot" aria-hidden="true"></span>
          <span class="copy">
            <strong>{{ item.label }}</strong>
            @if (item.detail) {
              <span>{{ item.detail }}</span>
            }
          </span>
        </div>
      }
    </div>
  `
})
export class AppTimelineComponent extends UiKitAwareComponent {
  @Input() items: AppTimelineItem[] = [];
}

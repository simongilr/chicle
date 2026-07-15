import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type StatusNoticeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-status-notice',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .notice {
        display: grid;
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 14px;
      }

      :host([data-ui-kit='material']) .notice {
        border-radius: 4px;
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .notice {
        border-radius: 6px;
        padding: 12px 14px;
      }

      :host([data-ui-kit='ionic']) .notice {
        border-radius: 14px;
        padding: 13px 14px;
      }

      :host([data-ui-kit='native']) .notice {
        border-radius: 2px;
        box-shadow: none;
      }

      .notice.info {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
      }

      .notice.success {
        border-color: var(--ch-color-success-border);
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
      }

      .notice.warning {
        border-color: var(--ch-color-warning-border);
        background: var(--ch-color-warning-soft);
        color: var(--ch-color-warning);
      }

      .notice.error {
        border-color: var(--ch-color-danger-border);
        background: var(--ch-color-danger-soft);
        color: var(--ch-color-danger);
      }

      strong {
        font-weight: 850;
      }

      .actions:empty {
        display: none;
      }

      :host ::ng-deep .actions > button {
        width: auto;
      }
    `
  ],
  template: `
    <section
      class="notice"
      [class.info]="tone === 'info'"
      [class.success]="tone === 'success'"
      [class.warning]="tone === 'warning'"
      [class.error]="tone === 'error'"
    >
      @if (title) {
        <strong>{{ title }}</strong>
      }
      <ng-content></ng-content>
      <div class="actions">
        <ng-content select="[notice-action]"></ng-content>
      </div>
    </section>
  `
})
export class StatusNoticeComponent extends UiKitAwareComponent {
  @Input() title = '';
  @Input() tone: StatusNoticeTone = 'neutral';
}

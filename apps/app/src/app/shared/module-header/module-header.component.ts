import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-module-header',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit',
    '[attr.title]': 'null'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 18px;
        box-shadow: var(--ch-shadow-card);
      }

      :host([data-ui-kit='material']) .header {
        border-radius: 4px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ch-color-text) 14%, transparent);
      }

      :host([data-ui-kit='material']) h1 {
        font-weight: 500;
      }

      :host([data-ui-kit='bootstrap']) .header {
        border-radius: 6px;
        box-shadow: none;
      }

      :host([data-ui-kit='ionic']) .header {
        border-radius: 16px;
        box-shadow: 0 10px 28px color-mix(in srgb, var(--ch-color-primary) 9%, transparent);
      }

      :host([data-ui-kit='native']) .header {
        border-radius: 2px;
        box-shadow: none;
      }

      .copy {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      .eyebrow {
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        font-weight: 850;
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        color: var(--ch-color-text);
        font-size: 1.85rem;
        line-height: 1.15;
      }

      p {
        max-width: 820px;
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .badge {
        flex: 0 0 auto;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 6px 10px;
        font-size: 0.82rem;
        font-weight: 850;
        white-space: nowrap;
      }

      @media (max-width: 620px) {
        .header {
          display: grid;
        }

        h1 {
          font-size: 1.55rem;
        }

        .badge {
          justify-self: start;
        }
      }
    `
  ],
  template: `
    <section class="header">
      <div class="copy">
        @if (eyebrow) {
          <span class="eyebrow">{{ eyebrow }}</span>
        }
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      @if (badge) {
        <span class="badge">{{ badge }}</span>
      }
    </section>
  `
})
export class ModuleHeaderComponent extends UiKitAwareComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() eyebrow = '';
  @Input() badge = '';
}

import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-admin-panel',
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

      .panel {
        display: grid;
        align-content: start;
        gap: var(--panel-gap);
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        box-shadow: var(--ch-shadow-card);
        padding: var(--panel-padding);
      }

      :host([data-ui-kit='material']) .panel {
        border-radius: 4px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .panel {
        border-radius: 6px;
        box-shadow: none;
      }

      :host([data-ui-kit='ionic']) .panel {
        border-radius: 16px;
        box-shadow: 0 12px 30px color-mix(in srgb, var(--ch-color-primary) 8%, transparent);
      }

      :host([data-ui-kit='native']) .panel {
        border-radius: 2px;
        box-shadow: none;
      }

      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
      }

      .copy {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      .eyebrow {
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
        font-size: var(--panel-title-size);
        line-height: 1.2;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .actions {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .actions:empty {
        display: none;
      }

      .body {
        display: grid;
        gap: inherit;
        min-width: 0;
      }

      @media (max-width: 680px) {
        .header {
          display: grid;
        }

        .actions {
          justify-content: start;
        }
      }
    `
  ],
  template: `
    <section
      class="panel"
      [style.--panel-gap]="gap"
      [style.--panel-padding]="padding"
      [style.--panel-title-size]="titleSize"
    >
      @if (title || description || eyebrow) {
        <header class="header">
          <div class="copy">
            @if (eyebrow) {
              <span class="eyebrow">{{ eyebrow }}</span>
            }
            @if (title) {
              <h2>{{ title }}</h2>
            }
            @if (description) {
              <p>{{ description }}</p>
            }
          </div>
          <div class="actions">
            <ng-content select="[panel-actions]"></ng-content>
          </div>
        </header>
      }
      <div class="body">
        <ng-content></ng-content>
      </div>
    </section>
  `
})
export class AdminPanelComponent extends UiKitAwareComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() eyebrow = '';
  @Input() gap = '14px';
  @Input() padding = '18px';
  @Input() titleSize = '1.12rem';
}

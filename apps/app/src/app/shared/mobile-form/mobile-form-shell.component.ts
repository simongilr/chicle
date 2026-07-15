import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-mobile-form-shell',
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

      .shell {
        display: grid;
        gap: 12px;
        min-height: 0;
        padding: 14px;
      }

      :host([data-ui-kit='material']) .shell {
        gap: 14px;
        border-radius: 4px;
      }

      :host([data-ui-kit='bootstrap']) .shell {
        gap: 12px;
        padding: 16px;
      }

      :host([data-ui-kit='ionic']) .shell {
        gap: 14px;
        padding: 16px;
      }

      .header {
        display: grid;
        gap: 9px;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 10px;
      }

      .title {
        display: grid;
        gap: 4px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 3px 8px;
        font-size: 0.72rem;
        font-weight: 850;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        max-width: 250px;
        color: var(--ch-color-text);
        font-size: 1.12rem;
        line-height: 1.12;
      }

      p {
        display: -webkit-box;
        overflow: hidden;
        color: var(--ch-color-muted);
        font-size: 0.9rem;
        line-height: 1.35;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
    `
  ],
  template: `
    <section class="shell">
      <header class="header">
        <div class="title">
          @if (eyebrow) {
            <span class="pill">{{ eyebrow }}</span>
          }
          <h2>{{ title }}</h2>
          @if (description) {
            <p>{{ description }}</p>
          }
        </div>
        @if (metadata.length) {
          <div class="meta" aria-label="Metadatos visuales">
            @for (item of metadata; track item) {
              <span class="pill">{{ item }}</span>
            }
          </div>
        }
      </header>
      <ng-content></ng-content>
    </section>
  `
})
export class MobileFormShellComponent extends UiKitAwareComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
  @Input() metadata: string[] = [];
}

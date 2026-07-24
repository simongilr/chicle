import { Component, Input } from '@angular/core';
import { UiKitCardComponent, UiKitCardTone } from '../ui-kit-card/ui-kit-card.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-admin-resource-card',
  standalone: true,
  imports: [UiKitCardComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
        min-width: 0;
      }

      .copy {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      strong,
      p,
      code {
        min-width: 0;
        margin: 0;
        overflow-wrap: anywhere;
      }

      strong {
        color: var(--ch-color-text);
        font-weight: 850;
        line-height: 1.25;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.42;
      }

      .meta {
        font-size: 0.82rem;
      }

      code {
        border-radius: 6px;
        background: var(--ch-color-surface-muted);
        color: var(--ch-color-text);
        padding: 4px 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.8rem;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .actions:empty {
        display: none;
      }

      @media (max-width: 680px) {
        .content {
          grid-template-columns: 1fr;
        }

        .actions {
          justify-content: start;
        }
      }
    `
  ],
  template: `
    <app-ui-kit-card [kit]="kit" [tone]="tone" [variant]="variant" [padding]="padding">
      <div class="content">
        <div class="copy">
          <strong>{{ title }}</strong>
          @if (meta) {
            <p class="meta">{{ meta }}</p>
          }
          @if (detail) {
            <p>{{ detail }}</p>
          }
          @if (code) {
            <code>{{ code }}</code>
          }
        </div>
        <div class="actions">
          <ng-content select="[resource-actions]"></ng-content>
        </div>
      </div>
    </app-ui-kit-card>
  `
})
export class AdminResourceCardComponent extends UiKitAwareComponent {
  @Input({ required: true }) title = '';
  @Input() meta = '';
  @Input() detail = '';
  @Input() code = '';
  @Input() tone: UiKitCardTone = 'neutral';
  @Input() variant: 'surface' | 'subtle' | 'outline' = 'subtle';
  @Input() padding = '12px';
}

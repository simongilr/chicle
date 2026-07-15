import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type WorkflowGuideTone = 'info' | 'success' | 'warning';

@Component({
  selector: 'app-workflow-guide',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .guide {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        border-left: 4px solid var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        padding: 13px 15px;
      }

      :host([data-ui-kit='material']) .guide {
        border-left-width: 0;
        border-top: 3px solid var(--ch-color-primary);
        border-radius: 4px;
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .guide {
        border: 1px solid var(--ch-color-primary-border);
        border-left-width: 4px;
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .guide {
        border-left-width: 0;
        border-radius: 16px;
        padding: 14px 15px;
      }

      :host([data-ui-kit='native']) .guide {
        border-radius: 2px;
      }

      .guide.success {
        border-left-color: var(--ch-color-success);
        background: var(--ch-color-success-soft);
      }

      .guide.warning {
        border-left-color: var(--ch-color-warning);
        background: var(--ch-color-warning-soft);
      }

      .copy {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .step {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      strong {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      p {
        margin: 0;
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .actions:empty {
        display: none;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
        align-items: center;
      }

      @media (max-width: 720px) {
        .guide {
          grid-template-columns: 1fr;
        }

        .actions {
          justify-content: flex-start;
        }
      }
    `
  ],
  template: `
    <section class="guide" [class.success]="tone === 'success'" [class.warning]="tone === 'warning'">
      <div class="copy">
        @if (stepLabel) {
          <span class="step">{{ stepLabel }}</span>
        }
        <strong>{{ title }}</strong>
        <p>{{ description }}</p>
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </section>
  `
})
export class WorkflowGuideComponent extends UiKitAwareComponent {
  @Input() stepLabel = '';
  @Input() title = '';
  @Input() description = '';
  @Input() tone: WorkflowGuideTone = 'info';
}

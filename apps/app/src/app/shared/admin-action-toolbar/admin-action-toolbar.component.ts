import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-admin-action-toolbar',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit',
    '[style.--toolbar-align]': 'toolbarAlign'
  },
  styles: [
    `
      :host {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: var(--toolbar-align);
      }

      :host ::ng-deep a,
      :host ::ng-deep button {
        min-height: 38px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 8px 12px;
        text-decoration: none;
        font: inherit;
        font-weight: 850;
      }

      :host ::ng-deep a.primary,
      :host ::ng-deep button.primary {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      :host ::ng-deep a.danger,
      :host ::ng-deep button.danger {
        border-color: var(--ch-color-danger);
        color: var(--ch-color-danger);
      }

      :host ::ng-deep a:focus-visible,
      :host ::ng-deep button:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--ch-color-primary) 18%, transparent);
        outline-offset: 1px;
      }

      :host ::ng-deep button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      @media (max-width: 620px) {
        :host {
          justify-content: stretch;
        }

        :host ::ng-deep a,
        :host ::ng-deep button {
          flex: 1 1 auto;
          text-align: center;
        }
      }
    `
  ],
  template: `<ng-content></ng-content>`
})
export class AdminActionToolbarComponent extends UiKitAwareComponent {
  @Input() align: 'start' | 'center' | 'end' | 'between' = 'end';

  get toolbarAlign() {
    return this.align === 'start'
      ? 'flex-start'
      : this.align === 'center'
        ? 'center'
        : this.align === 'between'
          ? 'space-between'
          : 'flex-end';
  }
}

import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-admin-filter-bar',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .filter-bar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--filter-min-width), 1fr));
        gap: 12px;
        align-items: end;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        box-shadow: var(--ch-shadow-card);
        padding: 16px;
      }

      :host([data-ui-kit='material']) .filter-bar {
        border-radius: 4px;
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .filter-bar {
        border-radius: 6px;
        box-shadow: none;
      }

      :host([data-ui-kit='ionic']) .filter-bar {
        border-radius: 16px;
        box-shadow: 0 10px 26px color-mix(in srgb, var(--ch-color-primary) 8%, transparent);
      }

      :host([data-ui-kit='native']) .filter-bar {
        border-radius: 2px;
        box-shadow: none;
      }

      :host ::ng-deep .filter-bar > label,
      :host ::ng-deep .filter-bar > .field-group {
        display: grid;
        gap: 7px;
        color: var(--ch-color-text);
        font-size: 0.82rem;
        font-weight: 850;
      }

      :host ::ng-deep .filter-bar > label > input,
      :host ::ng-deep .filter-bar > label > select,
      :host ::ng-deep .filter-bar > label > textarea,
      :host ::ng-deep .filter-bar > .field-group > input,
      :host ::ng-deep .filter-bar > .field-group > select,
      :host ::ng-deep .filter-bar > .field-group > textarea {
        width: 100%;
        min-height: 40px;
        border: 1px solid var(--ch-kit-control-border, var(--ch-color-border));
        border-radius: var(--ch-kit-control-radius, var(--ch-radius));
        background: var(--ch-kit-control-bg, var(--ch-color-surface));
        color: var(--ch-color-text);
        padding: var(--ch-kit-control-padding-y, 8px) var(--ch-kit-control-padding-x, 10px);
        font: inherit;
      }

      :host ::ng-deep .filter-bar > label > input:focus,
      :host ::ng-deep .filter-bar > label > select:focus,
      :host ::ng-deep .filter-bar > label > textarea:focus,
      :host ::ng-deep .filter-bar > .field-group > input:focus,
      :host ::ng-deep .filter-bar > .field-group > select:focus,
      :host ::ng-deep .filter-bar > .field-group > textarea:focus {
        border-color: var(--ch-color-primary);
        outline: 3px solid var(--ch-kit-control-focus, color-mix(in srgb, var(--ch-color-primary) 16%, transparent));
      }

      :host([data-ui-kit='bootstrap']) ::ng-deep .filter-bar > label > input,
      :host([data-ui-kit='bootstrap']) ::ng-deep .filter-bar > label > select,
      :host([data-ui-kit='bootstrap']) ::ng-deep .filter-bar > label > textarea,
      :host([data-ui-kit='bootstrap']) ::ng-deep .filter-bar > .field-group > input,
      :host([data-ui-kit='bootstrap']) ::ng-deep .filter-bar > .field-group > select,
      :host([data-ui-kit='bootstrap']) ::ng-deep .filter-bar > .field-group > textarea {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) ::ng-deep .filter-bar > label > input,
      :host([data-ui-kit='ionic']) ::ng-deep .filter-bar > label > select,
      :host([data-ui-kit='ionic']) ::ng-deep .filter-bar > label > textarea,
      :host([data-ui-kit='ionic']) ::ng-deep .filter-bar > .field-group > input,
      :host([data-ui-kit='ionic']) ::ng-deep .filter-bar > .field-group > select,
      :host([data-ui-kit='ionic']) ::ng-deep .filter-bar > .field-group > textarea {
        border-top: 0;
        border-right: 0;
        border-left: 0;
        border-bottom: 1px solid var(--ch-kit-control-border, var(--ch-color-border));
        padding-inline: 0;
      }

      @media (max-width: 700px) {
        .filter-bar {
          grid-template-columns: 1fr;
          padding: 12px;
        }
      }
    `
  ],
  template: `
    <section
      class="filter-bar"
      [attr.aria-label]="ariaLabel"
      [style.--filter-min-width]="minColumnWidth"
    >
      <ng-content></ng-content>
    </section>
  `
})
export class AdminFilterBarComponent extends UiKitAwareComponent {
  @Input() ariaLabel = 'Admin filters';
  @Input() minColumnWidth = '180px';
}

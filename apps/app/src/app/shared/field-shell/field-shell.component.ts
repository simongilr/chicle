import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-field-shell',
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

      .field {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      :host([data-ui-kit='material']) label {
        font-size: 0.78rem;
        font-weight: 500;
        letter-spacing: 0;
      }

      :host([data-ui-kit='bootstrap']) label {
        font-size: 0.875rem;
        font-weight: 600;
      }

      :host([data-ui-kit='ionic']) .field {
        gap: 6px;
      }

      :host([data-ui-kit='ionic']) label {
        font-size: 0.8rem;
        font-weight: 700;
      }

      label {
        color: var(--ch-color-text);
        font-size: 0.88rem;
        font-weight: 800;
        line-height: 1.2;
      }

      .required {
        color: var(--ch-color-danger);
      }

      .help,
      .error {
        font-size: 0.8rem;
        line-height: 1.35;
      }

      .help {
        color: var(--ch-color-muted);
      }

      .error {
        color: var(--ch-color-danger);
        font-weight: 700;
      }

      .field:focus-within label {
        color: var(--ch-color-primary);
      }
    `
  ],
  template: `
    <div class="field">
      <label [attr.for]="forId">
        {{ label }}
        @if (required) {
          <span class="required" aria-hidden="true">*</span>
        }
      </label>
      <ng-content></ng-content>
      @if (error) {
        <span class="error" role="alert">{{ error }}</span>
      } @else if (help) {
        <span class="help">{{ help }}</span>
      }
    </div>
  `
})
export class FieldShellComponent extends UiKitAwareComponent {
  @Input({ required: true }) label = '';
  @Input() forId = '';
  @Input() help = '';
  @Input() error = '';
  @Input() required = false;
}

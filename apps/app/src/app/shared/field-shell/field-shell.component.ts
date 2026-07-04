import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-field-shell',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      label {
        color: var(--ch-color-text);
        font-size: 0.88rem;
        font-weight: 800;
      }

      .required {
        color: #b84234;
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
        color: #a33428;
        font-weight: 700;
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
export class FieldShellComponent {
  @Input({ required: true }) label = '';
  @Input() forId = '';
  @Input() help = '';
  @Input() error = '';
  @Input() required = false;
}

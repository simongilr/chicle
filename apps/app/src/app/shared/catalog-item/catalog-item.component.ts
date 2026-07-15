import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-catalog-item',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      button {
        display: grid;
        gap: 6px;
        width: 100%;
        min-height: 72px;
        border: 1px solid transparent;
        border-radius: var(--ch-radius);
        background: transparent;
        color: var(--ch-color-text);
        padding: 11px 12px;
        text-align: left;
        font: inherit;
        line-height: 1.3;
        cursor: pointer;
      }

      button:hover {
        background: var(--ch-color-surface-alt);
      }

      button:focus-visible {
        outline: 2px solid var(--ch-color-primary);
        outline-offset: 2px;
      }

      button.active {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
      }

      :host([data-ui-kit='material']) button {
        border-radius: 4px;
        background: var(--ch-color-surface);
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ch-color-text) 14%, transparent);
      }

      :host([data-ui-kit='material']) button.active {
        border-color: var(--ch-color-primary);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ch-color-primary) 22%, transparent);
      }

      :host([data-ui-kit='bootstrap']) button {
        border-radius: 6px;
        border-color: var(--ch-color-border);
        background: var(--ch-color-surface);
        padding: 10px 12px;
      }

      :host([data-ui-kit='bootstrap']) button.active {
        border-color: var(--ch-color-primary);
        background: color-mix(in srgb, var(--ch-color-primary) 9%, var(--ch-color-surface));
      }

      :host([data-ui-kit='ionic']) button {
        min-height: 62px;
        border-radius: 12px;
        background: var(--ch-color-surface);
        padding: 12px 14px;
      }

      :host([data-ui-kit='ionic']) button.active {
        background: color-mix(in srgb, var(--ch-color-primary) 12%, var(--ch-color-surface));
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      strong,
      span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      strong {
        font-weight: 850;
      }

      span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
      }
    `
  ],
  template: `
    <button type="button" [class.active]="active" [disabled]="disabled" (click)="selected.emit()">
      <strong>{{ title }}</strong>
      @if (meta) {
        <span>{{ meta }}</span>
      }
      @if (detail) {
        <span>{{ detail }}</span>
      }
    </button>
  `
})
export class CatalogItemComponent extends UiKitAwareComponent {
  @Input({ required: true }) title = '';
  @Input() meta = '';
  @Input() detail = '';
  @Input() active = false;
  @Input() disabled = false;
  @Output() selected = new EventEmitter<void>();
}

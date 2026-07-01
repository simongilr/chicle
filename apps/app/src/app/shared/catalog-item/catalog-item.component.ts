import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-catalog-item',
  standalone: true,
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
        border-radius: 8px;
        background: transparent;
        color: #173b5f;
        padding: 11px 12px;
        text-align: left;
        font: inherit;
        line-height: 1.3;
        cursor: pointer;
      }

      button:hover {
        background: #f2f7fc;
      }

      button:focus-visible {
        outline: 2px solid #1554a2;
        outline-offset: 2px;
      }

      button.active {
        border-color: #b7cce2;
        background: #eaf3fc;
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
        color: #52677a;
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
export class CatalogItemComponent {
  @Input({ required: true }) title = '';
  @Input() meta = '';
  @Input() detail = '';
  @Input() active = false;
  @Input() disabled = false;
  @Output() selected = new EventEmitter<void>();
}

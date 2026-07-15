import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-mobile-action-bar',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .bar {
        display: flex;
        gap: 8px;
        align-items: center;
        position: sticky;
        bottom: 0;
        z-index: 3;
        margin-inline: -2px;
        border-top: 1px solid var(--ch-color-border);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), #ffffff 36%);
        padding-top: 10px;
      }

      button {
        flex: 1;
        min-height: 44px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 9px 12px;
        font: inherit;
        font-weight: 850;
      }

      .primary {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
    `
  ],
  template: `
    <div class="bar">
      @if (secondaryLabel) {
        <button type="button" [disabled]="secondaryDisabled" (click)="secondary.emit()">
          {{ secondaryLabel }}
        </button>
      }
      <button class="primary" [type]="primaryType" [disabled]="primaryDisabled" (click)="primary.emit()">
        {{ primaryLabel }}
      </button>
    </div>
  `
})
export class MobileActionBarComponent {
  @Input() primaryLabel = 'Continuar';
  @Input() secondaryLabel = '';
  @Input() primaryDisabled = false;
  @Input() secondaryDisabled = false;
  @Input() primaryType: 'button' | 'submit' = 'submit';
  @Output() readonly primary = new EventEmitter<void>();
  @Output() readonly secondary = new EventEmitter<void>();
}

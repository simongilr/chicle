import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-mobile-action-bar',
  standalone: true,
  imports: [UiKitButtonComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
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
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--ch-color-surface) 88%, transparent),
          var(--ch-color-surface) 36%
        );
        padding-top: 10px;
      }

      app-ui-kit-button {
        flex: 1;
      }
    `
  ],
  template: `
    <div class="bar">
      @if (secondaryLabel) {
        <app-ui-kit-button
          [label]="secondaryLabel"
          [kit]="kit"
          type="button"
          tone="neutral"
          variant="outline"
          [disabled]="secondaryDisabled"
          [full]="true"
          (pressed)="secondary.emit()"
        ></app-ui-kit-button>
      }
      <app-ui-kit-button
        [label]="primaryLabel"
        [kit]="kit"
        [type]="primaryType"
        [disabled]="primaryDisabled"
        [full]="true"
        (pressed)="primary.emit()"
      ></app-ui-kit-button>
    </div>
  `
})
export class MobileActionBarComponent extends UiKitAwareComponent {
  @Input() primaryLabel = 'Continuar';
  @Input() secondaryLabel = '';
  @Input() primaryDisabled = false;
  @Input() secondaryDisabled = false;
  @Input() primaryType: 'button' | 'submit' = 'submit';
  @Output() readonly primary = new EventEmitter<void>();
  @Output() readonly secondary = new EventEmitter<void>();
}

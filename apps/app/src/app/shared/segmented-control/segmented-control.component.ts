import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export interface SegmentedControlItem {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: inline-block;
        max-width: 100%;
      }

      .control {
        display: inline-flex;
        max-width: 100%;
        gap: 4px;
        overflow-x: auto;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-primary) 7%, var(--ch-color-surface));
        padding: 3px;
      }

      :host([data-ui-kit='material']) .control {
        border-radius: 4px;
        background: var(--ch-color-surface);
        box-shadow: inset 0 0 0 1px var(--ch-color-border);
      }

      :host([data-ui-kit='material']) button.active {
        box-shadow: 0 1px 5px color-mix(in srgb, var(--ch-color-primary) 20%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .control {
        gap: 0;
        border-radius: 6px;
        background: var(--ch-color-surface);
        padding: 0;
      }

      :host([data-ui-kit='bootstrap']) button {
        border-left: 1px solid var(--ch-color-border);
        border-radius: 0;
      }

      :host([data-ui-kit='bootstrap']) button:first-child {
        border-left: 0;
        border-radius: 6px 0 0 6px;
      }

      :host([data-ui-kit='bootstrap']) button:last-child {
        border-radius: 0 6px 6px 0;
      }

      :host([data-ui-kit='ionic']) .control {
        border-radius: 999px;
        background: var(--ch-color-surface-muted);
        padding: 4px;
      }

      :host([data-ui-kit='ionic']) button {
        border-radius: 999px;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 34px;
        border: 0;
        border-radius: max(3px, calc(var(--ch-radius) - 2px));
        background: transparent;
        color: var(--ch-color-text);
        padding: 6px 11px;
        font: inherit;
        font-weight: 850;
        white-space: nowrap;
        cursor: pointer;
      }

      button.active {
        background: var(--ch-color-surface);
        color: var(--ch-color-primary);
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-primary) 16%, transparent);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      @media (max-width: 520px) {
        :host {
          display: block;
        }

        .control {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
          overflow: visible;
        }

        button {
          min-width: 0;
          white-space: normal;
        }
      }
    `
  ],
  template: `
    <div class="control" [attr.aria-label]="ariaLabel">
      @for (item of items; track item.key) {
        <button
          type="button"
          [class.active]="item.key === value"
          [disabled]="item.disabled"
          (click)="valueChange.emit(item.key)"
        >
          @if (item.icon) {
            <i [class]="item.icon" aria-hidden="true"></i>
          }
          {{ item.label }}
        </button>
      }
    </div>
  `
})
export class SegmentedControlComponent extends UiKitAwareComponent {
  @Input() items: SegmentedControlItem[] = [];
  @Input() value = '';
  @Input() ariaLabel = 'Selector de vista';
  @Output() valueChange = new EventEmitter<string>();
}

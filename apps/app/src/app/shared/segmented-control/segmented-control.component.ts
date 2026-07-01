import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentedControlItem {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
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
        border: 1px solid #c8d6e4;
        border-radius: 8px;
        background: #eef4fa;
        padding: 3px;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 34px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #173b5f;
        padding: 6px 11px;
        font: inherit;
        font-weight: 850;
        white-space: nowrap;
        cursor: pointer;
      }

      button.active {
        background: #ffffff;
        color: #1554a2;
        box-shadow: 0 1px 4px rgba(23, 79, 145, 0.14);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
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
export class SegmentedControlComponent {
  @Input() items: SegmentedControlItem[] = [];
  @Input() value = '';
  @Input() ariaLabel = 'Selector de vista';
  @Output() valueChange = new EventEmitter<string>();
}

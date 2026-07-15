import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProcessStepItem } from '../process-steps/process-steps.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-mobile-step-progress',
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

      .progress {
        display: grid;
        gap: 8px;
      }

      .summary {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        font-weight: 850;
      }

      .track {
        overflow: hidden;
        height: 5px;
        border-radius: 999px;
        background: var(--ch-color-surface-muted);
      }

      .fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--ch-color-primary);
        transition: width 180ms ease;
      }

      .tabs {
        display: flex;
        gap: 7px;
        overflow-x: auto;
        padding-bottom: 2px;
        scrollbar-width: none;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      button {
        display: inline-flex;
        gap: 7px;
        align-items: center;
        flex: 0 0 auto;
        max-width: 168px;
        min-height: 34px;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 6px 10px;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 850;
      }

      :host([data-ui-kit='material']) button {
        border-radius: 4px;
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ch-color-text) 10%, transparent);
      }

      :host([data-ui-kit='bootstrap']) button {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) button {
        min-height: 38px;
        border-radius: 999px;
      }

      :host([data-ui-kit='ionic']) .track {
        height: 4px;
      }

      button.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      button:disabled {
        opacity: 0.82;
      }

      .index {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: var(--ch-color-surface-muted);
        color: var(--ch-color-text);
        font-size: 0.72rem;
      }

      button.active .index {
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
      }

      .label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `
  ],
  template: `
    <nav class="progress" aria-label="Progreso del formulario">
      <div class="summary">
        <span>Paso {{ activeIndex + 1 }} de {{ items.length }}</span>
        <span>{{ activeSummary }}</span>
      </div>
      <div class="track" aria-hidden="true">
        <span class="fill" [style.width.%]="progress"></span>
      </div>
      <div class="tabs">
        @for (item of items; track item.key; let index = $index) {
          <button
            type="button"
            [class.active]="item.key === activeKey"
            [disabled]="!interactive || index > activeIndex"
            [attr.aria-current]="item.key === activeKey ? 'step' : null"
            (click)="select(item.key, index)"
          >
            <span class="index">{{ index + 1 }}</span>
            <span class="label">{{ item.label }}</span>
          </button>
        }
      </div>
    </nav>
  `
})
export class MobileStepProgressComponent extends UiKitAwareComponent {
  @Input() items: ProcessStepItem[] = [];
  @Input() activeKey = '';
  @Input() interactive = false;
  @Output() readonly selected = new EventEmitter<string>();

  get activeIndex() {
    const index = this.items.findIndex((item) => item.key === this.activeKey);
    return index >= 0 ? index : 0;
  }

  get activeItem() {
    return this.items[this.activeIndex];
  }

  get activeSummary() {
    return this.items[this.activeIndex]?.summary || '';
  }

  get progress() {
    if (this.items.length <= 1) {
      return 100;
    }
    return ((this.activeIndex + 1) / this.items.length) * 100;
  }

  select(key: string, index: number) {
    if (!this.interactive || index > this.activeIndex) {
      return;
    }
    this.selected.emit(key);
  }
}

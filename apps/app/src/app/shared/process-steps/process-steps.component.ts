import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type ProcessStepState = 'pending' | 'active' | 'complete' | 'warning';

export interface ProcessStepItem {
  key: string;
  label: string;
  summary: string;
  state?: ProcessStepState;
  disabled?: boolean;
}

@Component({
  selector: 'app-process-steps',
  standalone: true,
  imports: [NgTemplateOutlet],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .process-steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
      }

      .process-step {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr);
        gap: 9px;
        align-items: center;
        width: 100%;
        min-height: 58px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 9px 10px;
        text-align: left;
        font: inherit;
      }

      :host([data-ui-kit='material']) .process-step {
        border-radius: 4px;
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='material']) .process-step.active {
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ch-color-primary) 20%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .process-step {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .process-step {
        min-height: 62px;
        border-radius: 14px;
      }

      :host([data-ui-kit='native']) .process-step {
        border-radius: 2px;
      }

      button.process-step {
        cursor: pointer;
      }

      .process-step.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      .process-step.complete {
        border-color: var(--ch-color-success-border);
        background: var(--ch-color-success-soft);
      }

      .process-step.warning {
        border-color: var(--ch-color-warning-border);
        background: var(--ch-color-warning-soft);
      }

      .process-step:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .marker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--ch-color-surface-muted);
        color: var(--ch-color-text);
        font-size: 0.82rem;
        font-weight: 900;
      }

      .active .marker {
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
      }

      .complete .marker {
        background: var(--ch-color-success);
        color: var(--ch-color-primary-contrast);
      }

      .warning .marker {
        background: var(--ch-color-warning);
        color: var(--ch-color-primary-contrast);
      }

      .copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .copy strong,
      .copy span {
        display: block;
        overflow-wrap: anywhere;
      }

      .copy span {
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        line-height: 1.3;
      }

      .compact .process-step {
        min-height: 50px;
        border-color: var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        padding: 8px 9px;
      }

      .compact .process-step.complete {
        border-color: var(--ch-color-success-border);
        background: var(--ch-color-success-soft);
      }

      @media (max-width: 620px) {
        .process-steps {
          grid-template-columns: 1fr;
        }

        .process-step {
          min-height: 52px;
        }
      }
    `
  ],
  template: `
    <div class="process-steps" [class.compact]="compact" [attr.aria-label]="ariaLabel">
      @for (item of items; track item.key; let index = $index) {
        @if (interactive) {
          <button
            class="process-step"
            type="button"
            [class.active]="stateFor(item) === 'active'"
            [class.complete]="stateFor(item) === 'complete'"
            [class.warning]="stateFor(item) === 'warning'"
            [disabled]="item.disabled"
            (click)="selected.emit(item.key)"
          >
            <ng-container
              [ngTemplateOutlet]="stepContent"
              [ngTemplateOutletContext]="{ item: item, index: index }"
            ></ng-container>
          </button>
        } @else {
          <div
            class="process-step"
            [class.active]="stateFor(item) === 'active'"
            [class.complete]="stateFor(item) === 'complete'"
            [class.warning]="stateFor(item) === 'warning'"
          >
            <ng-container
              [ngTemplateOutlet]="stepContent"
              [ngTemplateOutletContext]="{ item: item, index: index }"
            ></ng-container>
          </div>
        }
      }
    </div>

    <ng-template #stepContent let-item="item" let-index="index">
      <span class="marker">
        @if (stateFor(item) === 'complete') {
          <i class="pi pi-check" aria-hidden="true"></i>
        } @else if (stateFor(item) === 'warning') {
          <i class="pi pi-exclamation" aria-hidden="true"></i>
        } @else {
          {{ index + 1 }}
        }
      </span>
      <span class="copy">
        <strong>{{ item.label }}</strong>
        <span>{{ item.summary }}</span>
      </span>
    </ng-template>
  `
})
export class ProcessStepsComponent extends UiKitAwareComponent {
  @Input() items: ProcessStepItem[] = [];
  @Input() activeKey = '';
  @Input() compact = false;
  @Input() interactive = true;
  @Input() ariaLabel = 'Etapas del proceso';
  @Output() selected = new EventEmitter<string>();

  stateFor(item: ProcessStepItem): ProcessStepState {
    return item.state ?? (item.key === this.activeKey ? 'active' : 'pending');
  }
}

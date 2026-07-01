import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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
        border: 1px solid #c8d6e4;
        border-radius: 8px;
        background: #ffffff;
        color: #173b5f;
        padding: 9px 10px;
        text-align: left;
        font: inherit;
      }

      button.process-step {
        cursor: pointer;
      }

      .process-step.active {
        border-color: #1554a2;
        background: #edf5ff;
      }

      .process-step.complete {
        border-color: #9fd2b0;
        background: #f2faf5;
      }

      .process-step.warning {
        border-color: #e6bd7d;
        background: #fff9ef;
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
        background: #e8eef5;
        color: #173b5f;
        font-size: 0.82rem;
        font-weight: 900;
      }

      .active .marker {
        background: #1554a2;
        color: #ffffff;
      }

      .complete .marker {
        background: #238152;
        color: #ffffff;
      }

      .warning .marker {
        background: #b87515;
        color: #ffffff;
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
        color: #5b7187;
        font-size: 0.78rem;
        line-height: 1.3;
      }

      .compact .process-step {
        min-height: 50px;
        border-color: #d7e2ed;
        background: #f8fbfe;
        padding: 8px 9px;
      }

      .compact .process-step.complete {
        border-color: #9fd2b0;
        background: #f2faf5;
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
export class ProcessStepsComponent {
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

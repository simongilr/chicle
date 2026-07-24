import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { DynamicFieldControlComponent } from '../dynamic-field-control/dynamic-field-control.component';
import { StatusNoticeComponent } from '../status-notice/status-notice.component';

export interface AssignmentChecklistOption {
  key: string;
  label: string;
  description?: string;
  statusLabel?: string;
  statusTone?: 'success' | 'warning' | 'danger' | 'neutral';
  checked?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-assignment-checklist',
  standalone: true,
  imports: [DynamicFieldControlComponent, StatusNoticeComponent],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .assignment-list {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      .assignment-list--pills {
        display: flex;
        flex-wrap: wrap;
      }

      .assignment-item {
        display: grid;
        gap: 5px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 8px;
      }

      .assignment-list--pills .assignment-item {
        min-width: 130px;
        border-radius: 999px;
        background: var(--ch-color-surface-muted);
        padding: 5px 9px;
      }

      .assignment-item.is-disabled {
        opacity: 0.72;
      }

      .assignment-meta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        padding-left: 4px;
      }

      .assignment-description {
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .assignment-status {
        color: var(--ch-color-muted);
        font-size: 0.74rem;
        font-weight: 850;
      }

      .assignment-status--success {
        color: var(--ch-color-success);
      }

      .assignment-status--warning {
        color: var(--ch-color-warning);
      }

      .assignment-status--danger {
        color: var(--ch-color-danger);
      }

      @media (max-width: 680px) {
        .assignment-list--pills {
          display: grid;
        }

        .assignment-list--pills .assignment-item {
          min-width: 0;
          border-radius: var(--ch-radius);
        }
      }
    `
  ],
  template: `
    @if (options.length > 0) {
      <div class="assignment-list" [class.assignment-list--pills]="variant === 'pills'">
        @for (option of options; track option.key) {
          <div class="assignment-item" [class.is-disabled]="disabled || option.disabled">
            <app-dynamic-field-control
              [field]="checkboxField(option)"
              [value]="option.checked === true"
              [disabled]="disabled || option.disabled === true"
              (valueChange)="optionToggle.emit(option.key)"
            ></app-dynamic-field-control>
            @if (variant !== 'pills' && (option.description || option.statusLabel)) {
              <div class="assignment-meta">
                @if (option.description) {
                  <span class="assignment-description">{{ option.description }}</span>
                }
                @if (option.statusLabel) {
                  <span class="assignment-status" [class]="statusClass(option)">
                    {{ option.statusLabel }}
                  </span>
                }
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <app-status-notice tone="info">{{ emptyText }}</app-status-notice>
    }
  `
})
export class AssignmentChecklistComponent {
  @Input() options: AssignmentChecklistOption[] = [];
  @Input() variant: 'list' | 'pills' = 'list';
  @Input() disabled = false;
  @Input() emptyText = 'No hay opciones disponibles.';
  @Output() readonly optionToggle = new EventEmitter<string>();

  checkboxField(option: AssignmentChecklistOption): RuntimeField {
    return {
      name: `assignment_${this.cleanKey(option.key)}`,
      type: 'checkbox',
      label: option.label,
      placeholder: option.label
    };
  }

  statusClass(option: AssignmentChecklistOption) {
    return option.statusTone ? `assignment-status--${option.statusTone}` : '';
  }

  private cleanKey(value: string) {
    return value.replace(/[^a-zA-Z0-9_]+/g, '_');
  }
}

import { Component, Input } from '@angular/core';

export type LoadingSkeletonVariant = 'page' | 'list' | 'form' | 'table';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .skeleton {
        display: grid;
        gap: 14px;
        width: 100%;
        color: var(--ch-color-muted);
      }

      .label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 20px;
        font-size: 0.82rem;
        font-weight: 750;
      }

      .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid #cbd9e7;
        border-top-color: var(--ch-color-primary);
        border-radius: 50%;
        animation: spin 700ms linear infinite;
      }

      .surface {
        display: grid;
        gap: 12px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 18px;
      }

      .line,
      .block,
      .control,
      .row {
        overflow: hidden;
        position: relative;
        border-radius: 6px;
        background: #e8eef5;
      }

      .line::after,
      .block::after,
      .control::after,
      .row::after {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.72) 48%,
          transparent 100%
        );
        content: '';
        transform: translateX(-100%);
        animation: shimmer 1.15s ease-in-out infinite;
      }

      .line {
        width: min(58%, 420px);
        height: 14px;
      }

      .line.short {
        width: min(34%, 220px);
      }

      .block {
        min-height: 82px;
      }

      .controls {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .control {
        height: 42px;
      }

      .rows {
        display: grid;
        gap: 9px;
      }

      .row {
        height: 54px;
      }

      .table-head {
        height: 34px;
      }

      @keyframes shimmer {
        to {
          transform: translateX(100%);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .line::after,
        .block::after,
        .control::after,
        .row::after,
        .spinner {
          animation: none;
        }
      }

      @media (max-width: 620px) {
        .controls {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <section
      class="skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      [attr.aria-label]="label"
    >
      @if (showLabel) {
        <span class="label"><span class="spinner" aria-hidden="true"></span>{{ label }}</span>
      }

      <div class="surface" aria-hidden="true">
        <div class="line short"></div>
        <div class="line"></div>

        @if (variant === 'page') {
          <div class="block"></div>
          <div class="controls">
            <div class="block"></div>
            <div class="block"></div>
          </div>
        } @else if (variant === 'form') {
          <div class="controls">
            @for (item of items; track item) {
              <div class="control"></div>
            }
          </div>
        } @else {
          <div class="rows">
            @if (variant === 'table') {
              <div class="row table-head"></div>
            }
            @for (item of items; track item) {
              <div class="row"></div>
            }
          </div>
        }
      </div>
    </section>
  `
})
export class LoadingSkeletonComponent {
  @Input() variant: LoadingSkeletonVariant = 'page';
  @Input() label = 'Cargando contenido';
  @Input() rows = 4;
  @Input() showLabel = true;

  get items() {
    return Array.from({ length: Math.max(1, Math.min(this.rows, 8)) }, (_, index) => index);
  }
}

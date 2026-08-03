import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-visual-workbench-panel',
  standalone: true,
  imports: [UiKitButtonComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: contents;
      }

      .overlay {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: grid;
        place-items: center;
        padding: 14px;
      }

      .backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background:
          radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--ch-color-primary) 16%, transparent), transparent 32%),
          color-mix(in srgb, var(--ch-color-background) 82%, #000 18%);
        cursor: default;
      }

      .panel {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        width: min(1780px, calc(100vw - 28px));
        height: min(980px, calc(100dvh - 28px));
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--ch-color-border);
        border-radius: calc(var(--ch-radius) + 4px);
        background: var(--ch-color-surface);
        box-shadow: 0 28px 80px color-mix(in srgb, #000 32%, transparent);
      }

      .header {
        display: flex;
        gap: 14px;
        align-items: center;
        justify-content: space-between;
        min-width: 0;
        border-bottom: 1px solid var(--ch-color-border);
        background:
          linear-gradient(135deg, color-mix(in srgb, var(--ch-color-primary-soft) 78%, transparent), transparent),
          var(--ch-color-surface);
        padding: 12px 14px;
      }

      .copy {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .eyebrow,
      .copy strong,
      .copy span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .eyebrow {
        color: var(--ch-color-muted);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .copy strong {
        color: var(--ch-color-text);
        font-size: 1.02rem;
        line-height: 1.18;
      }

      .copy span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.34;
      }

      .actions {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: flex-end;
      }

      .actions:empty {
        display: none;
      }

      .body {
        min-width: 0;
        min-height: 0;
        overflow: auto;
        background:
          linear-gradient(var(--ch-color-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--ch-color-border) 1px, transparent 1px),
          var(--ch-color-background);
        background-size: 24px 24px;
        padding: 14px;
      }

      :host([data-ui-kit='material']) .panel {
        border-radius: 6px;
      }

      :host([data-ui-kit='bootstrap']) .panel {
        border-radius: 8px;
      }

      :host([data-ui-kit='ionic']) .panel {
        border-radius: 22px;
      }

      @media (max-width: 760px) {
        .overlay {
          padding: 0;
        }

        .panel {
          width: 100vw;
          height: 100dvh;
          border-radius: 0;
        }

        .header {
          align-items: stretch;
          flex-direction: column;
        }

        .actions {
          justify-content: stretch;
        }
      }
    `
  ],
  template: `
    @if (open) {
      <section class="overlay" role="dialog" aria-modal="true" [attr.aria-label]="title">
        <button type="button" class="backdrop" tabindex="-1" aria-label="Cerrar panel" (click)="closed.emit()"></button>

        <article class="panel">
          <header class="header">
            <div class="copy">
              @if (eyebrow) {
                <span class="eyebrow">{{ eyebrow }}</span>
              }
              <strong>{{ title }}</strong>
              @if (description) {
                <span>{{ description }}</span>
              }
            </div>
            <div class="actions">
              <ng-content select="[workbench-actions]"></ng-content>
              <app-ui-kit-button
                label="Cerrar"
                icon="pi pi-times"
                tone="secondary"
                variant="outline"
                size="small"
                (pressed)="closed.emit()"
              ></app-ui-kit-button>
            </div>
          </header>

          <div class="body">
            <ng-content></ng-content>
          </div>
        </article>
      </section>
    }
  `
})
export class VisualWorkbenchPanelComponent extends UiKitAwareComponent {
  @Input() open = false;
  @Input() eyebrow = '';
  @Input() title = 'Mesa de trabajo visual';
  @Input() description = '';
  @Output() readonly closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  closeFromEscape() {
    if (this.open) {
      this.closed.emit();
    }
  }
}

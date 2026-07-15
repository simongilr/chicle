import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type ContextAssistantTone = 'info' | 'success' | 'warning';

@Component({
  selector: 'app-context-assistant',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .assistant {
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr) auto;
        gap: 10px;
        align-items: start;
        border-left: 4px solid var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        padding: 11px 12px;
      }

      :host([data-ui-kit='material']) .assistant {
        border-left-width: 0;
        border-radius: 4px;
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .assistant {
        border: 1px solid var(--ch-color-primary-border);
        border-left-width: 4px;
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .assistant {
        grid-template-columns: 34px minmax(0, 1fr);
        border-left-width: 0;
        border-radius: 16px;
        padding: 13px;
      }

      :host([data-ui-kit='ionic']) .state {
        grid-column: 2;
        justify-self: start;
      }

      :host([data-ui-kit='native']) .assistant {
        border-radius: 2px;
      }

      .assistant.success {
        border-left-color: var(--ch-color-success);
        background: var(--ch-color-success-soft);
      }

      .assistant.warning {
        border-left-color: var(--ch-color-warning);
        background: var(--ch-color-warning-soft);
      }

      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--ch-color-surface);
        color: var(--ch-color-primary);
      }

      .success .icon {
        color: var(--ch-color-success);
      }

      .warning .icon {
        color: var(--ch-color-warning);
      }

      .copy {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      strong {
        color: var(--ch-color-text);
        font-size: 0.88rem;
      }

      p,
      small {
        margin: 0;
        color: var(--ch-color-muted);
        line-height: 1.4;
      }

      p {
        font-size: 0.84rem;
      }

      small {
        font-size: 0.77rem;
      }

      .state {
        white-space: nowrap;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-surface);
        color: var(--ch-color-primary);
        padding: 5px 8px;
        font-size: 0.72rem;
        font-weight: 900;
      }

      .success .state {
        border-color: var(--ch-color-success-border);
        color: var(--ch-color-success);
      }

      .warning .state {
        border-color: var(--ch-color-warning-border);
        color: var(--ch-color-warning);
      }

      @media (max-width: 620px) {
        .assistant {
          grid-template-columns: 32px minmax(0, 1fr);
        }

        .state {
          grid-column: 2;
          justify-self: start;
        }
      }
    `
  ],
  template: `
    <aside class="assistant" [class.success]="tone === 'success'" [class.warning]="tone === 'warning'">
      <span class="icon">
        <i [class]="icon" aria-hidden="true"></i>
      </span>
      <span class="copy">
        <strong>{{ title }}</strong>
        <p>{{ description }}</p>
        @if (example) {
          <small><b>Ejemplo:</b> {{ example }}</small>
        }
        @if (nextAction) {
          <small><b>Siguiente:</b> {{ nextAction }}</small>
        }
      </span>
      <span class="state">{{ stateLabel }}</span>
    </aside>
  `
})
export class ContextAssistantComponent extends UiKitAwareComponent {
  @Input() title = 'Asistente';
  @Input() description = '';
  @Input() example = '';
  @Input() nextAction = '';
  @Input() stateLabel = 'Pendiente';
  @Input() tone: ContextAssistantTone = 'info';
  @Input() icon = 'pi pi-lightbulb';
}

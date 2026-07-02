import { Component, Input } from '@angular/core';

export type ContextAssistantTone = 'info' | 'success' | 'warning';

@Component({
  selector: 'app-context-assistant',
  standalone: true,
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
        border-left: 4px solid #1554a2;
        background: #eef6ff;
        padding: 11px 12px;
      }

      .assistant.success {
        border-left-color: #238152;
        background: #f1faf5;
      }

      .assistant.warning {
        border-left-color: #b87515;
        background: #fff8ec;
      }

      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #ffffff;
        color: #1554a2;
      }

      .success .icon {
        color: #238152;
      }

      .warning .icon {
        color: #9a6412;
      }

      .copy {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      strong {
        color: #173b5f;
        font-size: 0.88rem;
      }

      p,
      small {
        margin: 0;
        color: #52677a;
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
        border: 1px solid #b9cfe5;
        border-radius: 999px;
        background: #ffffff;
        color: #174f91;
        padding: 5px 8px;
        font-size: 0.72rem;
        font-weight: 900;
      }

      .success .state {
        border-color: #9fd2b0;
        color: #167044;
      }

      .warning .state {
        border-color: #e6bd7d;
        color: #8a570e;
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
export class ContextAssistantComponent {
  @Input() title = 'Asistente';
  @Input() description = '';
  @Input() example = '';
  @Input() nextAction = '';
  @Input() stateLabel = 'Pendiente';
  @Input() tone: ContextAssistantTone = 'info';
  @Input() icon = 'pi pi-lightbulb';
}

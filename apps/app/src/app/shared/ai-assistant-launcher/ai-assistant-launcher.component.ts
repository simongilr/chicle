import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AiAssistantScope, AiAssistantService } from './ai-assistant.service';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
}

@Component({
  selector: 'app-ai-assistant-launcher',
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      :host {
        position: fixed;
        z-index: 950;
        right: 22px;
        bottom: 22px;
        pointer-events: none;
      }

      button,
      textarea {
        font: inherit;
      }

      .fab {
        pointer-events: auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 46px;
        border: 1px solid #0f4f9f;
        border-radius: 999px;
        background: #1554a2;
        color: #ffffff;
        box-shadow: 0 14px 34px rgba(20, 50, 80, 0.24);
        padding: 0 16px;
        font-weight: 900;
        cursor: pointer;
      }

      .panel {
        pointer-events: auto;
        position: absolute;
        right: 0;
        bottom: 58px;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        width: min(390px, calc(100vw - 24px));
        max-height: min(560px, calc(100dvh - 96px));
        border: 1px solid #c5d6e6;
        border-radius: 14px;
        background: #ffffff;
        box-shadow: 0 24px 70px rgba(20, 50, 80, 0.24);
        overflow: hidden;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid #d9e2ec;
        background: #f7fbff;
        padding: 12px;
      }

      .identity {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .identity strong {
        color: #173b5f;
        font-size: 0.96rem;
      }

      .identity span {
        overflow: hidden;
        color: #52677a;
        font-size: 0.76rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .close {
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        border: 1px solid #c5d6e6;
        border-radius: 8px;
        background: #ffffff;
        color: #173b5f;
        cursor: pointer;
      }

      .messages {
        display: grid;
        align-content: start;
        gap: 10px;
        min-height: 220px;
        overflow: auto;
        padding: 12px;
      }

      .message {
        display: grid;
        gap: 4px;
        max-width: 92%;
        border-radius: 12px;
        padding: 10px 11px;
        line-height: 1.4;
      }

      .message.assistant {
        justify-self: start;
        background: #eef6ff;
        color: #173b5f;
      }

      .message.user {
        justify-self: end;
        background: #1554a2;
        color: #ffffff;
      }

      .message small {
        font-size: 0.68rem;
        font-weight: 900;
        opacity: 0.8;
      }

      .message p {
        margin: 0;
        font-size: 0.82rem;
      }

      .composer {
        display: grid;
        gap: 8px;
        border-top: 1px solid #d9e2ec;
        background: #ffffff;
        padding: 12px;
      }

      textarea {
        width: 100%;
        min-width: 0;
        min-height: 76px;
        resize: vertical;
        border: 1px solid #c5d6e6;
        border-radius: 10px;
        background: #ffffff;
        color: #173b5f;
        padding: 10px 12px;
        line-height: 1.4;
      }

      textarea:focus {
        outline: 3px solid rgba(21, 84, 162, 0.16);
        border-color: #1554a2;
      }

      .send-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .hint {
        color: #52677a;
        font-size: 0.72rem;
        line-height: 1.35;
      }

      .send {
        flex: 0 0 auto;
        min-height: 34px;
        border: 1px solid #1554a2;
        border-radius: 8px;
        background: #1554a2;
        color: #ffffff;
        padding: 0 12px;
        font-weight: 900;
        cursor: pointer;
      }

      .send:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      @media (max-width: 620px) {
        :host {
          right: 12px;
          bottom: 12px;
        }

        .fab span {
          display: none;
        }

        .fab {
          width: 48px;
          min-height: 48px;
          padding: 0;
        }

        .panel {
          right: -2px;
          bottom: 58px;
          width: calc(100vw - 20px);
          max-height: calc(100dvh - 82px);
        }
      }
    `
  ],
  template: `
    @if (open()) {
      <section class="panel" aria-label="Chat asistente de Chicle">
        <header class="header">
          <span class="identity">
            <strong>Chicle IA</strong>
            <span>{{ scopeLabel() }} · asistente de configuración</span>
          </span>
          <button class="close" type="button" title="Cerrar asistente" (click)="toggle()">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </header>

        <div class="messages" aria-live="polite">
          @for (message of messages(); track $index) {
            <article class="message" [class.assistant]="message.role === 'assistant'" [class.user]="message.role === 'user'">
              <small>{{ message.role === 'assistant' ? 'Chicle IA' : 'Tú' }}</small>
              <p>{{ message.text }}</p>
            </article>
          }
        </div>

        <form class="composer" (ngSubmit)="send()">
          <textarea
            name="assistantPrompt"
            [(ngModel)]="prompt"
            [placeholder]="placeholder()"
          ></textarea>
          <div class="send-row">
            <span class="hint">La IA propondrá cambios en la pantalla actual; tú apruebas antes de guardar.</span>
            <button class="send" type="submit" [disabled]="!canSend() || sending()">
              {{ sending() ? 'Pensando' : 'Enviar' }}
            </button>
          </div>
        </form>
      </section>
    }

    <button
      class="fab"
      type="button"
      [attr.aria-expanded]="open()"
      aria-label="Abrir asistente IA"
      (click)="toggle()"
    >
      <i class="pi pi-sparkles" aria-hidden="true"></i>
      <span>Chicle IA</span>
    </button>
  `
})
export class AiAssistantLauncherComponent {
  private readonly router = inject(Router);
  private readonly assistant = inject(AiAssistantService);

  readonly open = signal(false);
  readonly messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      text:
        'Estoy listo para ayudarte en esta pantalla. Dime qué quieres crear o ajustar y lo convertiré en una propuesta para el diseñador correspondiente.'
    }
  ]);
  readonly canSend = computed(() => this.prompt.trim().length >= 3);
  readonly scopeLabel = computed(() => this.describeScope(this.currentScope()));
  readonly placeholder = computed(() => this.placeholderForScope(this.currentScope()));
  readonly sending = signal(false);

  prompt = '';

  toggle() {
    this.open.update((value) => !value);
  }

  async send() {
    const text = this.prompt.trim();
    if (!text || this.sending()) {
      return;
    }

    const scope = this.currentScope();
    this.assistant.submit(text, this.router.url, scope);
    this.messages.update((messages) => [
      ...messages,
      { role: 'user', text },
      { role: 'assistant', text: 'Estoy consultando el runtime IA local con el contexto de esta pantalla.' }
    ]);
    this.prompt = '';

    try {
      this.sending.set(true);
      const response = await firstValueFrom(
        this.assistant.chat({
          prompt: text,
          route: this.router.url,
          scope
        })
      );
      this.replaceLastAssistantMessage(response.message);
    } catch (error) {
      this.replaceLastAssistantMessage(
        'No pude conectar con el asistente IA todavía. Revisa que Ollama esté activo y que los modelos estén descargados. La pantalla sigue funcionando sin IA.'
      );
    } finally {
      this.sending.set(false);
    }
  }

  private replaceLastAssistantMessage(text: string) {
    this.messages.update((messages) => {
      const next = [...messages];
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].role === 'assistant') {
          next[index] = { role: 'assistant', text };
          return next;
        }
      }

      return [...next, { role: 'assistant', text }];
    });
  }

  private currentScope(): AiAssistantScope {
    const url = this.router.url;

    if (url.startsWith('/services')) {
      return 'services';
    }

    if (url.startsWith('/flows')) {
      return 'flows';
    }

    if (url.startsWith('/forms')) {
      return 'forms';
    }

    if (url.startsWith('/database')) {
      return 'database';
    }

    if (url.startsWith('/security')) {
      return 'security';
    }

    if (url.startsWith('/components')) {
      return 'components';
    }

    return 'general';
  }

  private describeScope(scope: AiAssistantScope) {
    const labels: Record<AiAssistantScope, string> = {
      general: 'Chicle',
      services: 'Servicios',
      flows: 'Flows',
      forms: 'Formularios',
      database: 'Base de datos',
      security: 'Seguridad',
      components: 'Componentes'
    };

    return labels[scope];
  }

  private placeholderForScope(scope: AiAssistantScope) {
    const placeholders: Record<AiAssistantScope, string> = {
      general: 'Ej: ayúdame a crear una configuración para esta pantalla',
      services: 'Ej: necesito un servicio para consultar usuarios por nombre',
      flows: 'Ej: crea un proceso que valide un usuario y luego responda al front',
      forms: 'Ej: agrega un formulario de cliente con email, teléfono y validación',
      database: 'Ej: explícame qué tabla necesito para guardar estos datos',
      security: 'Ej: crea una estrategia de permisos para operadores y admins',
      components: 'Ej: muéstrame qué componente debo usar para un catálogo lateral'
    };

    return placeholders[scope];
  }
}

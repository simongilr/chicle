import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CodeTextareaComponent } from '../code-textarea/code-textarea.component';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';
import { AiAssistantScope, AiAssistantService } from './ai-assistant.service';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  suggestions?: string[];
}

@Component({
  selector: 'app-ai-assistant-launcher',
  standalone: true,
  imports: [CodeTextareaComponent, UiKitButtonComponent],
  styles: [
    `
      :host {
        position: fixed;
        z-index: 950;
        right: 22px;
        bottom: 22px;
        pointer-events: none;
      }

      .fab {
        pointer-events: auto;
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
        border: 1px solid var(--ch-color-border);
        border-radius: 14px;
        background: var(--ch-color-surface);
        box-shadow: var(--ch-shadow-card);
        overflow: hidden;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .identity {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .identity strong {
        color: var(--ch-color-text);
        font-size: 0.96rem;
      }

      .identity span {
        overflow: hidden;
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .close {
        flex: 0 0 auto;
        width: 34px;
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
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
      }

      .message.user {
        justify-self: end;
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
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

      .suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .suggestion {
        font-size: 0.76rem;
      }

      .thinking-line {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .spinner {
        display: inline-block;
        flex: 0 0 auto;
        width: 14px;
        height: 14px;
        border: 2px solid color-mix(in srgb, var(--ch-color-primary) 22%, transparent);
        border-top-color: var(--ch-color-primary);
        border-radius: 999px;
        animation: chicle-ai-spin 0.75s linear infinite;
      }

      .composer {
        display: grid;
        gap: 8px;
        border-top: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        padding: 12px;
      }

      .send-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .hint {
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        line-height: 1.35;
      }

      .send {
        flex: 0 0 auto;
      }

      @keyframes chicle-ai-spin {
        to {
          transform: rotate(360deg);
        }
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
            <strong>Chicle AI</strong>
            <span>{{ scopeLabel() }} · asistente de configuración</span>
          </span>
          <app-ui-kit-button
            class="close"
            label=""
            ariaLabel="Cerrar asistente"
            icon="pi pi-times"
            tone="neutral"
            variant="outline"
            (pressed)="toggle()"
          ></app-ui-kit-button>
        </header>

        <div class="messages" aria-live="polite">
          @for (message of messages(); track $index) {
            <article class="message" [class.assistant]="message.role === 'assistant'" [class.user]="message.role === 'user'">
              <small>{{ message.role === 'assistant' ? 'Chicle AI' : 'Tú' }}</small>
              <p [class.thinking-line]="isThinkingMessage($index, message)">
                @if (isThinkingMessage($index, message)) {
                  <span class="spinner" aria-hidden="true"></span>
                }
                <span>{{ message.text }}</span>
              </p>
              @if (message.role === 'assistant' && message.suggestions?.length) {
                <div class="suggestions" aria-label="Respuestas sugeridas">
                  @for (suggestion of message.suggestions; track suggestion) {
                    <app-ui-kit-button
                      class="suggestion"
                      [label]="suggestion"
                      tone="secondary"
                      variant="outline"
                      [disabled]="sending()"
                      (pressed)="sendSuggestion(suggestion)"
                    ></app-ui-kit-button>
                  }
                </div>
              }
            </article>
          }
        </div>

        <div class="composer">
          <app-code-textarea
            controlId="assistant-prompt"
            [value]="prompt"
            minHeight="76px"
            [placeholder]="placeholder()"
            (valueChange)="prompt = $event"
            (keydown)="onPromptKeydown($event)"
          ></app-code-textarea>
          <div class="send-row">
            <span class="hint">La IA propondrá cambios en la pantalla actual; tú apruebas antes de guardar.</span>
            <app-ui-kit-button
              class="send"
              [label]="sending() ? 'Pensando' : 'Enviar'"
              [icon]="sending() ? 'pi pi-spin pi-spinner' : ''"
              [disabled]="!canSend() || sending()"
              (pressed)="send()"
            ></app-ui-kit-button>
          </div>
        </div>
      </section>
    }

    <app-ui-kit-button
      class="fab"
      label="Chicle AI"
      ariaLabel="Abrir asistente IA"
      icon="pi pi-sparkles"
      [attr.aria-expanded]="open()"
      (pressed)="toggle()"
    ></app-ui-kit-button>
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
  readonly scopeLabel = computed(() => this.describeScope(this.currentScope()));
  readonly placeholder = computed(() => this.placeholderForScope(this.currentScope()));
  readonly sending = signal(false);
  private progressTimers: number[] = [];

  prompt = '';

  toggle() {
    this.open.update((value) => {
      const next = !value;
      if (next) {
        void this.checkStatus();
      }

      return next;
    });
  }

  canSend() {
    return this.prompt.trim().length >= 3;
  }

  isThinkingMessage(index: number, message: ChatMessage) {
    return this.sending() && message.role === 'assistant' && index === this.messages().length - 1;
  }

  async send() {
    const text = this.prompt.trim();
    await this.sendText(text);
  }

  async sendSuggestion(text: string) {
    await this.sendText(text);
  }

  private async sendText(text: string) {
    if (!text || this.sending()) {
      return;
    }

    const scope = this.currentScope();
    const submitted = this.assistant.submit(text, this.router.url, scope);
    this.clearSuggestions();
    this.messages.update((messages) => [
      ...messages,
      { role: 'user', text },
      { role: 'assistant', text: 'Estoy consultando el runtime IA local con el contexto de esta pantalla.' }
    ]);
    this.prompt = '';
    this.startProgress();

    try {
      this.sending.set(true);
      const request = {
        prompt: text,
        route: this.router.url,
        scope,
        screenState: submitted.screenState,
        conversation: this.conversationContext(text)
      };
      const response = await firstValueFrom(
        this.assistant.chat(request)
      );
      this.clearProgress();
      if (response.actions?.length) {
        this.assistant.publishProposal(request, response.actions);
      }
      this.replaceLastAssistantMessage(response.message, response.suggestions);
    } catch (error) {
      this.clearProgress();
      this.replaceLastAssistantMessage(this.describeError(error));
    } finally {
      this.sending.set(false);
    }
  }

  onPromptKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void this.send();
  }

  private startProgress() {
    this.clearProgress();
    const steps = [
      { delay: 0, text: 'Entendiendo lo que necesitas en esta pantalla.' },
      { delay: 4500, text: 'Revisando el contexto y preparando una propuesta segura.' },
      { delay: 14000, text: 'Generando el JSON editable para que puedas revisarlo.' },
      { delay: 32000, text: 'El modelo local sigue pensando. No he guardado nada; solo estoy armando el draft.' },
      { delay: 65000, text: 'Sigue procesando en local. Estos modelos pueden tardar más en Docker la primera vez.' }
    ];

    this.progressTimers = steps.map((step) =>
      window.setTimeout(() => {
        if (this.sending()) {
          this.replaceLastAssistantMessage(step.text);
        }
      }, step.delay)
    );
  }

  private clearProgress() {
    for (const timer of this.progressTimers) {
      window.clearTimeout(timer);
    }
    this.progressTimers = [];
  }

  private conversationContext(currentPrompt: string) {
    const recent = this.messages()
      .filter((message) => !this.isProgressText(message.text))
      .slice(-10)
      .map((message) => ({ role: message.role, text: message.text }));

    return [...recent, { role: 'user' as const, text: currentPrompt }];
  }

  private isProgressText(text: string) {
    return [
      'Estoy consultando el runtime IA local con el contexto de esta pantalla.',
      'Entendiendo lo que necesitas en esta pantalla.',
      'Revisando el contexto y preparando una propuesta segura.',
      'Generando el JSON editable para que puedas revisarlo.',
      'El modelo local sigue pensando. No he guardado nada; solo estoy armando el draft.',
      'Sigue procesando en local. Estos modelos pueden tardar más en Docker la primera vez.'
    ].includes(text);
  }

  private async checkStatus() {
    try {
      const status = await firstValueFrom(this.assistant.status());
      const provider = status.providerStatus;
      if (!status.enabled) {
        this.appendAssistantMessage('La IA está desactivada por configuración. Activa ai.enabled o AI_ENABLED para usarla.');
        return;
      }

      if (!provider?.reachable) {
        this.appendAssistantMessage(
          `No puedo ver el runtime IA todavía. Provider: ${status.provider}. Modelo: ${status.chatModel}. ${provider?.error ?? 'Sin detalle del provider.'}`
        );
        return;
      }

      if (!provider.chatModelAvailable) {
        this.appendAssistantMessage(
          `Ollama responde, pero no tiene el modelo configurado (${status.chatModel}). Modelos disponibles: ${provider.models.join(', ') || 'ninguno'}.`
        );
        return;
      }

      this.appendAssistantMessage(
        `IA local activa con ${status.chatModel}. Ya puedes pedirme una propuesta para esta pantalla.`
      );
    } catch (error) {
      this.appendAssistantMessage(this.describeError(error));
    }
  }

  private appendAssistantMessage(text: string) {
    const last = this.messages().at(-1);
    if (last?.role === 'assistant' && last.text === text) {
      return;
    }

    this.messages.update((messages) => [...messages, { role: 'assistant', text }]);
  }

  private replaceLastAssistantMessage(text: string, suggestions: string[] = []) {
    this.messages.update((messages) => {
      const next = [...messages];
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].role === 'assistant') {
          next[index] = { role: 'assistant', text, suggestions };
          return next;
        }
      }

      return [...next, { role: 'assistant', text, suggestions }];
    });
  }

  private clearSuggestions() {
    this.messages.update((messages) =>
      messages.map((message) => (message.suggestions?.length ? { ...message, suggestions: [] } : message))
    );
  }

  private describeError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No puedo alcanzar la API desde el navegador. Revisa que el backend esté arriba en el puerto configurado.';
      }

      if (error.status === 401) {
        return 'Tu sesión no está activa o el token venció. Cierra sesión, vuelve a entrar e intenta de nuevo.';
      }

      if (error.status === 403) {
        return 'Tu usuario no tiene el permiso ai.assistant.use. Sincroniza seguridad o asigna el permiso al rol.';
      }

      const message =
        typeof error.error?.message === 'string'
          ? error.error.message
          : Array.isArray(error.error?.message)
            ? error.error.message.join(', ')
            : error.message;

      return `La API respondió ${error.status}: ${message}`;
    }

    return error instanceof Error
      ? `No pude usar el asistente IA: ${error.message}`
      : 'No pude usar el asistente IA. La pantalla sigue funcionando sin IA.';
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

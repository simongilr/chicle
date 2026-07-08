import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import {
  AiAssistantConfig,
  AiAssistantRequest,
  AiAssistantResponse,
  AiAssistantScope
} from './ai-assistant.types';
import { OllamaProviderService } from './ollama-provider.service';

@Injectable()
export class AiAssistantService {
  constructor(
    private readonly confisys: ConfisysService,
    private readonly ollama: OllamaProviderService
  ) {}

  getConfig(): AiAssistantConfig {
    return {
      enabled: this.booleanFromEnv('AI_ENABLED', this.confisys.get<boolean>('ai.enabled', true)),
      provider: this.stringFromEnv('AI_PROVIDER', this.confisys.get<string>('ai.provider', 'ollama')),
      baseUrl: this.stringFromEnv(
        'AI_BASE_URL',
        this.confisys.get<string>('ai.baseUrl', 'http://localhost:11434/v1')
      ),
      chatModel: this.stringFromEnv(
        'AI_CHAT_MODEL',
        this.confisys.get<string>('ai.chatModel', 'qwen3-coder:30b')
      ),
      embeddingModel: this.stringFromEnv(
        'AI_EMBEDDING_MODEL',
        this.confisys.get<string>('ai.embeddingModel', 'nomic-embed-text:v1.5')
      ),
      timeoutMs: this.numberFromEnv('AI_TIMEOUT_MS', this.confisys.get<number>('ai.timeoutMs', 60000)),
      ragEnabled: this.booleanFromEnv('AI_RAG_ENABLED', this.confisys.get<boolean>('ai.rag.enabled', true)),
      ragMode: this.stringFromEnv('AI_RAG_MODE', this.confisys.get<string>('ai.rag.mode', 'keyword')),
      maxContextChunks: this.numberFromEnv(
        'AI_MAX_CONTEXT_CHUNKS',
        this.confisys.get<number>('ai.maxContextChunks', 12)
      ),
      allowPublish: this.booleanFromEnv('AI_ALLOW_PUBLISH', this.confisys.get<boolean>('ai.allowPublish', false))
    };
  }

  async status() {
    const config = this.getConfig();
    const providerStatus = config.enabled ? await this.getProviderStatus(config) : null;

    return {
      enabled: config.enabled,
      provider: config.provider,
      baseUrl: config.baseUrl,
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel,
      rag: {
        enabled: config.ragEnabled,
        mode: config.ragMode,
        maxContextChunks: config.maxContextChunks
      },
      safety: {
        allowPublish: config.allowPublish,
        appliesDraftOnly: true
      },
      providerStatus
    };
  }

  async chat(auth: AuthContext, request: AiAssistantRequest): Promise<AiAssistantResponse> {
    const config = this.getConfig();
    if (!config.enabled) {
      throw new ServiceUnavailableException('AI assistant is disabled');
    }

    if (config.provider !== 'ollama') {
      throw new ServiceUnavailableException(`AI provider ${config.provider} is not implemented yet`);
    }

    const scope = request.scope ?? this.scopeFromRoute(request.route);
    const system = this.buildSystemPrompt(auth, scope, config);
    const user = this.buildUserPrompt(request);
    const response = await this.ollama.chat(config, [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]);

    return {
      ok: true,
      provider: config.provider,
      model: config.chatModel,
      scope,
      message: response.message,
      raw: response.raw
    };
  }

  private async getProviderStatus(config: AiAssistantConfig) {
    if (config.provider === 'ollama') {
      return this.ollama.status(config);
    }

    return {
      reachable: false,
      models: [],
      chatModelAvailable: false,
      embeddingModelAvailable: false,
      error: `Provider ${config.provider} is not implemented yet`
    };
  }

  private buildSystemPrompt(auth: AuthContext, scope: AiAssistantScope, config: AiAssistantConfig) {
    return [
      'Eres Chicle IA, asistente de configuración de Chicle Engine.',
      'Responde en español claro y breve.',
      'No publiques cambios ni digas que ya guardaste algo.',
      'Tu trabajo es ayudar a preparar drafts declarativos para la pantalla actual.',
      'No generes SQL libre, JavaScript arbitrario, secretos, tokens ni contraseñas.',
      'Si falta contexto, pide el dato faltante en vez de inventarlo.',
      `Scope actual: ${scope}.`,
      `Tenant actual: ${auth.tenant.slug}.`,
      `Roles del usuario: ${auth.roles.map((role) => role.key).join(', ') || 'sin roles'}.`,
      `RAG activo: ${config.ragEnabled ? config.ragMode : 'disabled'}.`,
      `Publicación directa permitida: ${config.allowPublish ? 'si' : 'no'}.`
    ].join('\n');
  }

  private buildUserPrompt(request: AiAssistantRequest) {
    return JSON.stringify(
      {
        prompt: request.prompt,
        route: request.route,
        scope: request.scope,
        screenState: request.screenState ?? null
      },
      null,
      2
    );
  }

  private scopeFromRoute(route?: string): AiAssistantScope {
    if (!route) {
      return 'general';
    }

    if (route.startsWith('/services')) {
      return 'services';
    }

    if (route.startsWith('/flows')) {
      return 'flows';
    }

    if (route.startsWith('/forms')) {
      return 'forms';
    }

    if (route.startsWith('/database')) {
      return 'database';
    }

    if (route.startsWith('/security')) {
      return 'security';
    }

    if (route.startsWith('/components')) {
      return 'components';
    }

    return 'general';
  }

  private stringFromEnv(name: string, fallback: string) {
    return process.env[name]?.trim() || fallback;
  }

  private numberFromEnv(name: string, fallback: number) {
    const raw = process.env[name];
    if (!raw) {
      return fallback;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  private booleanFromEnv(name: string, fallback: boolean) {
    const raw = process.env[name]?.toLowerCase();
    if (raw === 'true') {
      return true;
    }

    if (raw === 'false') {
      return false;
    }

    return fallback;
  }
}

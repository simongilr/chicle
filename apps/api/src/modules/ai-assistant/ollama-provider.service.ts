import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiAssistantConfig } from './ai-assistant.types';

interface OpenAiCompatibleChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenAiCompatibleModelsResponse {
  data?: Array<{ id?: string }>;
}

interface OllamaChatOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

@Injectable()
export class OllamaProviderService {
  async status(config: AiAssistantConfig) {
    const startedAt = Date.now();
    try {
      const response = await this.request<OpenAiCompatibleModelsResponse>(config, '/models', {
        method: 'GET'
      });
      const models = (response.data ?? []).map((model) => model.id).filter(Boolean) as string[];

      return {
        reachable: true,
        latencyMs: Date.now() - startedAt,
        models,
        chatModelAvailable: models.includes(config.chatModel),
        embeddingModelAvailable: models.includes(config.embeddingModel)
      };
    } catch (error) {
      return {
        reachable: false,
        latencyMs: Date.now() - startedAt,
        models: [],
        chatModelAvailable: false,
        embeddingModelAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown provider error'
      };
    }
  }

  async chat(
    config: AiAssistantConfig,
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    options: OllamaChatOptions = {}
  ) {
    const response = await this.request<OpenAiCompatibleChatResponse>(
      { ...config, timeoutMs: options.timeoutMs ?? config.timeoutMs },
      '/chat/completions',
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.chatModel,
        messages,
        stream: false,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 900
      })
      }
    );

    const message = response.choices?.[0]?.message?.content?.trim();
    if (!message) {
      throw new ServiceUnavailableException('AI provider returned an empty response');
    }

    return {
      message,
      raw: response
    };
  }

  private async request<T>(config: AiAssistantConfig, path: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(`${this.normalizeBaseUrl(config.baseUrl)}${path}`, {
        ...init,
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new ServiceUnavailableException(
          `AI provider request failed with ${response.status}${body ? `: ${body}` : ''}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('AI provider request timed out');
      }

      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'AI provider request failed'
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeBaseUrl(baseUrl: string) {
    return baseUrl.replace(/\/$/, '');
  }
}

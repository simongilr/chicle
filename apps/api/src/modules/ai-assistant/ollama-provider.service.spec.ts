import { OllamaProviderService } from './ollama-provider.service';
import { AiAssistantConfig } from './ai-assistant.types';

const config: AiAssistantConfig = {
  enabled: true,
  provider: 'ollama',
  baseUrl: 'http://ollama:11434/v1',
  chatModel: 'qwen2.5-coder:7b',
  embeddingModel: 'nomic-embed-text:v1.5',
  timeoutMs: 180000,
  fastTimeoutMs: 18000,
  reasoningTimeoutMs: 45000,
  maxTokens: 420,
  fastMaxTokens: 140,
  contextWindow: 4096,
  keepAlive: '10m',
  ragEnabled: true,
  ragMode: 'keyword',
  maxContextChunks: 12,
  allowPublish: false
};

describe('OllamaProviderService local runtime optimization', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uses Ollama native chat with keep_alive and bounded generation options before OpenAI-compatible fallback', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ message: { content: 'respuesta corta' } })
    })) as jest.Mock;
    global.fetch = fetchMock as never;

    const service = new OllamaProviderService();
    const response = await service.chat(
      config,
      [
        { role: 'system', content: 'sistema' },
        { role: 'user', content: 'usuario' }
      ],
      { maxTokens: 80, timeoutMs: 12000 }
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(fetchMock.mock.calls[0][0]).toBe('http://ollama:11434/api/chat');
    expect(body).toMatchObject({
      model: 'qwen2.5-coder:7b',
      stream: false,
      keep_alive: '10m',
      options: {
        temperature: 0.2,
        num_predict: 80,
        num_ctx: 4096
      }
    });
    expect(response.message).toBe('respuesta corta');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to OpenAI-compatible chat if native Ollama chat is unavailable', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        text: async () => 'native disabled'
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'respuesta compatible' } }] })
      });
    global.fetch = fetchMock as never;

    const service = new OllamaProviderService();
    const response = await service.chat(config, [{ role: 'user', content: 'hola' }], { maxTokens: 90 });
    const fallbackBody = JSON.parse(fetchMock.mock.calls[1][1].body);

    expect(fetchMock.mock.calls[0][0]).toBe('http://ollama:11434/api/chat');
    expect(fetchMock.mock.calls[1][0]).toBe('http://ollama:11434/v1/chat/completions');
    expect(fallbackBody).toMatchObject({
      model: 'qwen2.5-coder:7b',
      stream: false,
      max_tokens: 90
    });
    expect(response.message).toBe('respuesta compatible');
  });
});

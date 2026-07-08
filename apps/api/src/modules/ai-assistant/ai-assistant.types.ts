export type AiAssistantScope =
  | 'general'
  | 'services'
  | 'flows'
  | 'forms'
  | 'database'
  | 'security'
  | 'components';

export interface AiAssistantRequest {
  prompt: string;
  route?: string;
  scope?: AiAssistantScope;
  screenState?: unknown;
}

export interface AiAssistantConfig {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  timeoutMs: number;
  ragEnabled: boolean;
  ragMode: string;
  maxContextChunks: number;
  allowPublish: boolean;
}

export interface AiAssistantResponse {
  ok: boolean;
  provider: string;
  model: string;
  scope: AiAssistantScope;
  message: string;
  raw?: unknown;
}

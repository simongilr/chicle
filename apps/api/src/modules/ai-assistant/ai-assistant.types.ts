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
  actions?: AiAssistantUiAction[];
  raw?: unknown;
}

export type AiAssistantUiAction = ApplyDynamicServiceJsonAction;

export interface ApplyDynamicServiceJsonAction {
  type: 'apply_dynamic_service_json';
  label: string;
  key: string;
  name: string;
  description?: string;
  publish: false;
  document: {
    intent?: string;
    source?: string;
    resultKind?: string;
    pagination?: Record<string, unknown>;
    effects?: Array<Record<string, unknown>>;
    dataTarget?: Record<string, unknown>;
    method: string;
    url: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
    timeoutMs?: number;
    retry?: Record<string, unknown>;
    responseMap?: Record<string, string>;
  };
}

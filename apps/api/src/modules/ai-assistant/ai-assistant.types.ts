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
  conversation?: AiAssistantConversationMessage[];
}

export interface AiAssistantConversationMessage {
  role: 'assistant' | 'user';
  text: string;
}

export interface AiAssistantConfig {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  timeoutMs: number;
  fastTimeoutMs: number;
  reasoningTimeoutMs: number;
  maxTokens: number;
  fastMaxTokens: number;
  contextWindow: number;
  keepAlive: string;
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
  suggestions?: string[];
  actions?: AiAssistantUiAction[];
  raw?: unknown;
}

export type AiAssistantUiAction =
  | ApplySchemaChangeAction
  | ApplyDynamicServiceJsonAction
  | ApplyFlowJsonAction
  | ApplyDynamicFormJsonAction;

export interface ApplySchemaChangeAction {
  type: 'apply_schema_change';
  label: string;
  tableName: string;
  operation: 'create_table' | 'add_column' | 'alter_column' | 'drop_column' | 'drop_table';
  apply: boolean;
  request: {
    operation: 'create_table' | 'add_column' | 'alter_column' | 'drop_column' | 'drop_table';
    tableName: string;
    columns?: Array<{
      name: string;
      type: 'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'json' | 'uuid';
      length?: number;
      precision?: number;
      scale?: number;
      nullable?: boolean;
      defaultValue?: string | number | boolean | null;
    }>;
    column?: Record<string, unknown>;
    currentColumnName?: string;
    confirmation?: string;
  };
}

export interface ApplyDynamicServiceJsonAction {
  type: 'apply_dynamic_service_json';
  label: string;
  key: string;
  name: string;
  description?: string;
  publish: boolean;
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

export interface ApplyFlowJsonAction {
  type: 'apply_flow_json';
  label: string;
  key: string;
  name: string;
  description?: string;
  publish: boolean;
  document: {
    schemaVersion: 1;
    flow: {
      key: string;
      name: string;
      description?: string | null;
      category?: string | null;
    };
    entry: {
      mode: 'direct' | 'manual' | 'http' | 'record_event' | 'form_submit' | 'schedule';
      key: string;
      config: Record<string, unknown>;
    };
    inputFields: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'boolean' | 'email' | 'date';
      required: boolean;
      example?: string;
    }>;
    steps: Array<Record<string, unknown>>;
    output: {
      stepKey: string | null;
      responseTo: 'caller';
    };
  };
}

export interface ApplyDynamicFormJsonAction {
  type: 'apply_dynamic_form_json';
  label: string;
  key: string;
  name: string;
  description?: string;
  publish: boolean;
  document: Record<string, unknown>;
}

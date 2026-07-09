import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/api/api-client.service';

export type AiAssistantScope = 'general' | 'services' | 'flows' | 'forms' | 'database' | 'security' | 'components';

export interface AiAssistantRequest {
  id: number;
  prompt: string;
  route: string;
  scope: AiAssistantScope;
  createdAt: string;
  screenState?: unknown;
}

export interface AiAssistantChatResponse {
  ok: boolean;
  provider: string;
  model: string;
  scope: AiAssistantScope;
  message: string;
  actions?: AiAssistantUiAction[];
}

export interface AiAssistantStatusResponse {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  providerStatus: null | {
    reachable: boolean;
    latencyMs?: number;
    models: string[];
    chatModelAvailable: boolean;
    embeddingModelAvailable: boolean;
    error?: string;
  };
}

export type AiAssistantUiAction = ApplyDynamicServiceJsonAction;

export interface ApplyDynamicServiceJsonAction {
  type: 'apply_dynamic_service_json';
  label: string;
  key: string;
  name: string;
  description?: string;
  publish: false;
  document: Record<string, unknown>;
}

export interface AiAssistantProposal {
  id: number;
  scope: AiAssistantScope;
  route: string;
  prompt: string;
  actions: AiAssistantUiAction[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private sequence = 0;
  private readonly screenStateProviders = new Map<AiAssistantScope, () => unknown>();
  readonly lastRequest = signal<AiAssistantRequest | null>(null);
  readonly proposal = signal<AiAssistantProposal | null>(null);

  constructor(private readonly api: ApiClientService) {}

  submit(prompt: string, route: string, scope: AiAssistantScope) {
    const request: AiAssistantRequest = {
      id: ++this.sequence,
      prompt,
      route,
      scope,
      createdAt: new Date().toISOString(),
      screenState: this.getScreenState(scope)
    };

    this.lastRequest.set(request);
    return request;
  }

  chat(
    request: Pick<AiAssistantRequest, 'prompt' | 'route' | 'scope' | 'screenState'>
  ): Observable<AiAssistantChatResponse> {
    return this.api.post<AiAssistantChatResponse>('ai-assistant/chat', request);
  }

  status(): Observable<AiAssistantStatusResponse> {
    return this.api.get<AiAssistantStatusResponse>('ai-assistant/status');
  }

  publishProposal(request: Pick<AiAssistantRequest, 'prompt' | 'route' | 'scope'>, actions: AiAssistantUiAction[]) {
    if (!actions.length) {
      return;
    }

    this.proposal.set({
      id: ++this.sequence,
      scope: request.scope,
      route: request.route,
      prompt: request.prompt,
      actions,
      createdAt: new Date().toISOString()
    });
  }

  registerScreenStateProvider(scope: AiAssistantScope, provider: () => unknown) {
    this.screenStateProviders.set(scope, provider);
    return () => {
      if (this.screenStateProviders.get(scope) === provider) {
        this.screenStateProviders.delete(scope);
      }
    };
  }

  getScreenState(scope: AiAssistantScope) {
    return this.screenStateProviders.get(scope)?.() ?? null;
  }
}

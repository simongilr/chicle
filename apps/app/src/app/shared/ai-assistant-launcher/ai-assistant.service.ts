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
}

export interface AiAssistantChatResponse {
  ok: boolean;
  provider: string;
  model: string;
  scope: AiAssistantScope;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private sequence = 0;
  readonly lastRequest = signal<AiAssistantRequest | null>(null);

  constructor(private readonly api: ApiClientService) {}

  submit(prompt: string, route: string, scope: AiAssistantScope) {
    const request: AiAssistantRequest = {
      id: ++this.sequence,
      prompt,
      route,
      scope,
      createdAt: new Date().toISOString()
    };

    this.lastRequest.set(request);
    return request;
  }

  chat(request: Pick<AiAssistantRequest, 'prompt' | 'route' | 'scope'>): Observable<AiAssistantChatResponse> {
    return this.api.post<AiAssistantChatResponse>('ai-assistant/chat', request);
  }
}

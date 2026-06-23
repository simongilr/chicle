import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';

export interface DynamicServiceRunResponse {
  id: string;
  status: string;
  triggerType: string;
  requestSnapshot?: Record<string, unknown> | null;
  responseSnapshot?: Record<string, unknown> | null;
  error?: string | null;
  durationMs: number;
  timeoutMs?: number | null;
  createdAt: string;
}

export interface DynamicServiceExecution<T = unknown> {
  ok: boolean;
  run: DynamicServiceRunResponse;
  result: T | null;
  response: Record<string, unknown> | null;
  error?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DynamicServiceClientService {
  private readonly api = inject(ApiClientService);

  executeRaw(serviceKey: string, context: Record<string, unknown> = {}) {
    return this.api.post<DynamicServiceRunResponse>(
      `dynamic-services/by-key/${encodeURIComponent(serviceKey)}/execute`,
      { context }
    );
  }

  execute<T = unknown>(serviceKey: string, context: Record<string, unknown> = {}) {
    return this.executeRaw(serviceKey, context).pipe(
      map((run) => ({
        ok: run.status === 'success',
        run,
        result: this.resultFromRun<T>(run),
        response: run.responseSnapshot ?? null,
        error: run.error ?? null
      }))
    );
  }

  private resultFromRun<T>(run: DynamicServiceRunResponse): T | null {
    if (!run.responseSnapshot || !Object.prototype.hasOwnProperty.call(run.responseSnapshot, 'result')) {
      return null;
    }
    return run.responseSnapshot['result'] as T;
  }
}

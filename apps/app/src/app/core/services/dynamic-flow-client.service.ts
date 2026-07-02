import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';

export interface AvailableDynamicFlow {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  publishedVersionId: string;
}

export interface DynamicFlowRun {
  id: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'timeout' | 'cancelled';
  output?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
  steps?: Array<Record<string, unknown>>;
}

export interface DynamicFlowExecution<T = Record<string, unknown>> {
  ok: boolean;
  run: DynamicFlowRun;
  result: T | null;
  error: Record<string, unknown> | null;
}

@Injectable({ providedIn: 'root' })
export class DynamicFlowClientService {
  private readonly api = inject(ApiClientService);

  available() {
    return this.api.get<AvailableDynamicFlow[]>('flows/available');
  }

  executeRaw(flowKey: string, input: Record<string, unknown> = {}) {
    return this.api.post<DynamicFlowRun>(`flows/by-key/${encodeURIComponent(flowKey)}/execute`, { input });
  }

  execute<T = Record<string, unknown>>(flowKey: string, input: Record<string, unknown> = {}) {
    return this.executeRaw(flowKey, input).pipe(
      map((run) => ({
        ok: run.status === 'success',
        run,
        result: (run.output as T | null | undefined) ?? null,
        error: run.error ?? null
      }))
    );
  }
}

import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';

export interface FlowLiveEvent {
  tenantId: string;
  type: string;
  flowId?: string;
  jobId?: string;
  runId?: string;
  data?: Record<string, unknown>;
  occurredAt: string;
}

@Injectable()
export class FlowLiveEventsService {
  private readonly events = new Subject<FlowLiveEvent>();

  emit(event: Omit<FlowLiveEvent, 'occurredAt'>) {
    this.events.next({
      ...event,
      occurredAt: new Date().toISOString()
    });
  }

  stream(tenantId: string): Observable<MessageEvent> {
    return this.events.pipe(
      filter((event) => event.tenantId === tenantId),
      map((event) => ({
        id: `${event.occurredAt}:${event.jobId ?? event.runId ?? event.flowId ?? event.type}`,
        type: event.type,
        data: event
      }))
    );
  }

  all() {
    return this.events.asObservable();
  }
}

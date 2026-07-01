import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';

export interface FlowLiveEvent {
  type: string;
  flowId?: string;
  jobId?: string;
  runId?: string;
  data?: Record<string, unknown>;
  occurredAt: string;
}

@Injectable({ providedIn: 'root' })
export class FlowLiveClientService implements OnDestroy {
  private readonly auth = inject(AuthStateService);
  private readonly eventSubject = new Subject<FlowLiveEvent>();
  private socket?: Socket;

  readonly connected = signal(false);
  readonly recentEvents = signal<FlowLiveEvent[]>([]);
  readonly events$ = this.eventSubject.asObservable();

  connect() {
    const token = this.auth.token();
    if (!token) {
      this.disconnect();
      return;
    }
    if (this.socket?.connected) {
      return;
    }
    this.disconnect();
    this.socket = io(`${this.apiOrigin()}/flows`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000
    });
    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('connect_error', () => this.connected.set(false));
    this.socket.on('flow.event', (event: FlowLiveEvent) => {
      this.recentEvents.update((events) => [event, ...events].slice(0, 100));
      this.eventSubject.next(event);
    });
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = undefined;
    this.connected.set(false);
  }

  ngOnDestroy() {
    this.disconnect();
    this.eventSubject.complete();
  }

  private apiOrigin() {
    const url = new URL(environment.apiUrl, window.location.origin);
    return url.origin;
  }
}

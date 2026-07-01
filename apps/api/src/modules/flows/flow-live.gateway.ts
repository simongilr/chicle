import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { FlowLiveEventsService } from './flow-live-events.service';

const configuredOrigins = (process.env.CHICLE_CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const developmentOrigins = ['http://localhost:8100', 'http://127.0.0.1:8100'];

@WebSocketGateway({
  namespace: '/flows',
  cors: {
    origin: configuredOrigins.length ? configuredOrigins : developmentOrigins,
    credentials: true
  },
  transports: ['websocket', 'polling']
})
export class FlowLiveGateway implements OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private subscription?: Subscription;

  constructor(
    private readonly auth: AuthService,
    private readonly live: FlowLiveEventsService
  ) {}

  onModuleInit() {
    this.subscription = this.live.all().subscribe((event) => {
      this.server?.to(this.tenantRoom(event.tenantId)).emit('flow.event', event);
    });
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }

  async handleConnection(client: Socket) {
    const token = this.accessToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const auth = await this.auth.verifyAccessToken(token);
      client.data['tenantId'] = auth.tenant.id;
      client.data['userId'] = auth.user.id;
      await client.join(this.tenantRoom(auth.tenant.id));
      client.emit('flow.connected', {
        tenantId: auth.tenant.id,
        connectedAt: new Date().toISOString()
      });
    } catch {
      client.disconnect(true);
    }
  }

  private accessToken(client: Socket) {
    const authToken = client.handshake.auth?.['token'];
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }
    const header = client.handshake.headers.authorization;
    return header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  }

  private tenantRoom(tenantId: string) {
    return `tenant:${tenantId}`;
  }
}

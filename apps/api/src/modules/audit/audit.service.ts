import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { AuditEvent } from './audit-event.entity';

export interface AuditRecordRequest {
  auth: AuthContext;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly events: Repository<AuditEvent>
  ) {}

  record(request: AuditRecordRequest) {
    return this.events.save(
      this.events.create({
        tenantId: request.auth.tenant.id,
        actorUserId: request.auth.user.id,
        action: request.action,
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        metadata: request.metadata ?? null
      })
    );
  }

  list(tenantId: string, limit = 50) {
    return this.events.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200)
    });
  }
}

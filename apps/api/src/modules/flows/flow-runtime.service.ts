import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { LessThanOrEqual, Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import { TenantMembership } from '../tenants/tenant-membership.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { FlowJob } from './flow-job.entity';
import { FlowLiveEventsService } from './flow-live-events.service';
import { FlowOutboxEvent } from './flow-outbox-event.entity';
import { FlowRunTriggerType } from './flow-run.entity';
import { FlowTrigger } from './flow-trigger.entity';
import { FlowsService } from './flows.service';

export interface QueueFlowRequest {
  input?: Record<string, unknown>;
  triggerType?: FlowRunTriggerType;
  triggerKey?: string | null;
  triggerId?: string | null;
  idempotencyKey?: string;
  priority?: number;
  maxAttempts?: number;
  availableAt?: string | Date;
}

export interface EmitFlowEventRequest {
  payload?: Record<string, unknown>;
  aggregateType?: string | null;
  aggregateId?: string | null;
  headers?: Record<string, unknown> | null;
  idempotencyKey?: string;
}

export interface FireFlowTriggerRequest {
  input?: Record<string, unknown>;
  idempotencyKey?: string;
}

@Injectable()
export class FlowRuntimeService implements OnApplicationBootstrap, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private working = false;
  private readonly workerId = `flow-worker-${randomUUID()}`;

  constructor(
    @InjectRepository(FlowJob)
    private readonly jobs: Repository<FlowJob>,
    @InjectRepository(FlowOutboxEvent)
    private readonly outbox: Repository<FlowOutboxEvent>,
    @InjectRepository(FlowTrigger)
    private readonly triggers: Repository<FlowTrigger>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(TenantMembership)
    private readonly memberships: Repository<TenantMembership>,
    private readonly flows: FlowsService,
    private readonly confisys: ConfisysService,
    private readonly live: FlowLiveEventsService
  ) {}

  onApplicationBootstrap() {
    if (!this.confisys.get<boolean>('flow.worker.enabled', true)) {
      return;
    }
    const pollMs = this.limit(this.confisys.get<number>('flow.worker.pollMs', 1000), 250, 30000);
    this.timer = setInterval(() => void this.tick(), pollMs);
    this.timer.unref?.();
    void this.recoverStaleJobs().then(() => this.tick());
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async enqueue(
    auth: AuthContext,
    flowId: string,
    request: QueueFlowRequest = {},
    options: { skipResourceAccess?: boolean } = {}
  ) {
    if (!options.skipResourceAccess) {
      await this.flows.assertCanExecute(auth, flowId);
    }
    const flow = await this.flows.get(auth, flowId);
    if (!flow.publishedVersion || flow.status !== 'active') {
      throw new BadRequestException('Publish and activate the flow before queueing it');
    }
    const idempotencyKey = this.cleanIdempotencyKey(request.idempotencyKey ?? randomUUID());
    const existing = await this.jobs.findOne({
      where: { tenantId: auth.tenant.id, idempotencyKey }
    });
    if (existing) {
      return existing;
    }

    const job = await this.jobs.save(
      this.jobs.create({
        tenantId: auth.tenant.id,
        flowId: flow.id,
        triggerId: request.triggerId ?? null,
        triggerType: request.triggerType ?? 'manual',
        triggerKey: request.triggerKey?.trim() || null,
        idempotencyKey,
        input: this.asRecord(request.input),
        status: 'queued',
        priority: this.limit(request.priority ?? 0, -100, 100),
        attempts: 0,
        maxAttempts: this.limit(
          request.maxAttempts ?? this.confisys.get<number>('flow.worker.maxJobAttempts', 3),
          1,
          10
        ),
        availableAt: this.safeDate(request.availableAt),
        createdByUserId: auth.user.id
      })
    );
    this.live.emit({
      tenantId: auth.tenant.id,
      type: 'flow.job.queued',
      flowId: flow.id,
      jobId: job.id,
      data: { triggerType: job.triggerType, triggerKey: job.triggerKey }
    });
    return job;
  }

  async emitEvent(auth: AuthContext, eventKey: string, request: EmitFlowEventRequest = {}) {
    const cleanEventKey = this.cleanEventKey(eventKey);
    const idempotencyKey = this.cleanIdempotencyKey(request.idempotencyKey ?? randomUUID());
    const existing = await this.outbox.findOne({
      where: { tenantId: auth.tenant.id, idempotencyKey }
    });
    if (existing) {
      return existing;
    }
    return this.outbox.save(
      this.outbox.create({
        tenantId: auth.tenant.id,
        eventKey: cleanEventKey,
        aggregateType: request.aggregateType?.trim() || null,
        aggregateId: request.aggregateId?.trim() || null,
        idempotencyKey,
        payload: this.asRecord(request.payload),
        headers: request.headers ? this.asRecord(request.headers) : null,
        status: 'pending',
        attempts: 0,
        availableAt: new Date(),
        createdByUserId: auth.user.id
      })
    );
  }

  async fireTrigger(
    auth: AuthContext,
    type: 'manual' | 'http',
    triggerKey: string,
    request: FireFlowTriggerRequest = {}
  ) {
    const trigger = await this.triggers.findOne({
      where: {
        tenantId: auth.tenant.id,
        type,
        key: this.cleanEventKey(triggerKey),
        active: true
      }
    });
    if (!trigger) {
      throw new NotFoundException('Active flow trigger not found');
    }
    return this.enqueue(auth, trigger.flowId, {
      input: this.directTriggerInput(trigger, this.asRecord(request.input)),
      triggerType: type === 'http' ? 'http' : 'manual',
      triggerKey: trigger.key,
      triggerId: trigger.id,
      idempotencyKey: request.idempotencyKey ?? randomUUID()
    });
  }

  async fireWebhook(
    tenantSlug: string,
    triggerKey: string,
    secret: string | undefined,
    request: FireFlowTriggerRequest = {}
  ) {
    const tenant = await this.tenants.findOne({
      where: { slug: tenantSlug.trim().toLowerCase(), active: true }
    });
    if (!tenant) {
      throw new NotFoundException('Webhook not found');
    }
    const trigger = await this.triggers.findOne({
      where: {
        tenantId: tenant.id,
        type: 'http',
        key: this.cleanEventKey(triggerKey),
        active: true
      }
    });
    const secretHash = typeof trigger?.config?.['secretHash'] === 'string' ? trigger.config['secretHash'] : '';
    if (!trigger || !secretHash || !this.matchesSecret(secret, secretHash)) {
      throw new NotFoundException('Webhook not found');
    }
    const auth = await this.systemAuth(tenant.id, trigger.createdByUserId);
    return this.enqueue(
      auth,
      trigger.flowId,
      {
        input: this.directTriggerInput(trigger, this.asRecord(request.input)),
        triggerType: 'http',
        triggerKey: trigger.key,
        triggerId: trigger.id,
        idempotencyKey: request.idempotencyKey ?? randomUUID()
      },
      { skipResourceAccess: true }
    );
  }

  async listJobs(auth: AuthContext, flowId?: string) {
    return this.jobs.find({
      where: {
        tenantId: auth.tenant.id,
        ...(flowId ? { flowId } : {})
      },
      order: { createdAt: 'DESC' },
      take: 100
    });
  }

  liveStream(auth: AuthContext) {
    return this.live.stream(auth.tenant.id);
  }

  async getJob(auth: AuthContext, jobId: string) {
    const job = await this.jobs.findOne({
      where: { id: jobId, tenantId: auth.tenant.id }
    });
    if (!job) {
      throw new NotFoundException('Flow job not found');
    }
    return job;
  }

  async cancelJob(auth: AuthContext, jobId: string) {
    const job = await this.getJob(auth, jobId);
    await this.flows.assertCanExecute(auth, job.flowId);
    if (!['queued', 'waiting'].includes(job.status)) {
      throw new BadRequestException('Only queued or waiting jobs can be cancelled');
    }
    await this.jobs.update(
      { id: job.id, tenantId: auth.tenant.id },
      { status: 'cancelled', lockToken: null, lockedAt: null }
    );
    this.live.emit({
      tenantId: auth.tenant.id,
      type: 'flow.job.cancelled',
      flowId: job.flowId,
      jobId: job.id
    });
    return this.getJob(auth, job.id);
  }

  async retryJob(auth: AuthContext, jobId: string) {
    const job = await this.getJob(auth, jobId);
    await this.flows.assertCanExecute(auth, job.flowId);
    if (!['failed', 'cancelled'].includes(job.status)) {
      throw new BadRequestException('Only failed or cancelled jobs can be retried');
    }
    await this.jobs.update(
      { id: job.id, tenantId: auth.tenant.id },
      {
        status: 'queued',
        attempts: 0,
        availableAt: new Date(),
        error: null,
        lockToken: null,
        lockedAt: null,
        runId: null
      }
    );
    return this.getJob(auth, job.id);
  }

  async processNow() {
    await this.tick();
  }

  private async tick() {
    if (this.working) {
      return;
    }
    this.working = true;
    try {
      await this.fireDueSchedules();
      await this.dispatchOutbox();
      await this.processJobs();
    } finally {
      this.working = false;
    }
  }

  private async fireDueSchedules() {
    const now = new Date();
    const due = await this.triggers.find({
      where: {
        type: 'schedule',
        active: true,
        nextFireAt: LessThanOrEqual(now)
      },
      order: { nextFireAt: 'ASC' },
      take: this.batchSize()
    });

    for (const trigger of due) {
      const scheduledAt = trigger.nextFireAt ?? now;
      const nextFireAt = this.nextScheduleDate(trigger.config, now);
      const claim = await this.triggers.update(
        { id: trigger.id, active: true, nextFireAt: LessThanOrEqual(now) },
        { lastFiredAt: now, nextFireAt }
      );
      if (!claim.affected) {
        continue;
      }
      const auth = await this.systemAuth(trigger.tenantId, trigger.createdByUserId);
      await this.enqueue(
        auth,
        trigger.flowId,
        {
          input: this.asRecord((trigger.config ?? {})['input']),
          triggerType: 'schedule',
          triggerKey: trigger.key,
          triggerId: trigger.id,
          idempotencyKey: `schedule:${trigger.id}:${scheduledAt.toISOString()}`
        },
        { skipResourceAccess: true }
      );
    }
  }

  private async dispatchOutbox() {
    const now = new Date();
    const events = await this.outbox.find({
      where: {
        status: 'pending',
        availableAt: LessThanOrEqual(now)
      },
      order: { createdAt: 'ASC' },
      take: this.batchSize()
    });

    for (const event of events) {
      const claim = await this.outbox.update(
        {
          id: event.id,
          status: 'pending',
          availableAt: LessThanOrEqual(now)
        },
        { status: 'processing', attempts: event.attempts + 1, error: null }
      );
      if (!claim.affected) {
        continue;
      }
      try {
        const matching = await this.triggers.find({
          where: [
            {
              tenantId: event.tenantId,
              type: 'record_event',
              key: event.eventKey,
              active: true
            },
            {
              tenantId: event.tenantId,
              type: 'form_submit',
              key: event.eventKey,
              active: true
            }
          ]
        });
        for (const trigger of matching) {
          const auth = await this.systemAuth(event.tenantId, event.createdByUserId ?? trigger.createdByUserId);
          await this.enqueue(
            auth,
            trigger.flowId,
            {
              input: this.eventInput(trigger, event),
              triggerType: trigger.type === 'form_submit' ? 'form' : 'event',
              triggerKey: trigger.key,
              triggerId: trigger.id,
              idempotencyKey: `event:${event.id}:trigger:${trigger.id}`
            },
            { skipResourceAccess: true }
          );
        }
        await this.outbox.update({ id: event.id }, { status: 'published', processedAt: new Date(), error: null });
        this.live.emit({
          tenantId: event.tenantId,
          type: 'flow.event.published',
          data: {
            eventId: event.id,
            eventKey: event.eventKey,
            triggers: matching.length
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Outbox dispatch failed';
        const maxAttempts = this.confisys.get<number>('flow.outbox.maxAttempts', 10);
        const attempts = event.attempts + 1;
        await this.outbox.update(
          { id: event.id },
          {
            status: attempts >= maxAttempts ? 'failed' : 'pending',
            availableAt: new Date(Date.now() + this.retryBackoff(attempts)),
            error: message
          }
        );
      }
    }
  }

  private async processJobs() {
    const now = new Date();
    const jobs = await this.jobs.find({
      where: { status: 'queued', availableAt: LessThanOrEqual(now) },
      order: { priority: 'DESC', createdAt: 'ASC' },
      take: this.batchSize()
    });
    for (const job of jobs) {
      const lockToken = randomUUID();
      const claim = await this.jobs.update(
        { id: job.id, status: 'queued', availableAt: LessThanOrEqual(now) },
        {
          status: 'running',
          attempts: job.attempts + 1,
          lockedAt: new Date(),
          lockToken,
          error: null
        }
      );
      if (!claim.affected) {
        continue;
      }
      await this.executeJob({ ...job, attempts: job.attempts + 1, lockToken });
    }
  }

  private async executeJob(job: FlowJob) {
    const lockToken = job.lockToken ?? '';
    this.live.emit({
      tenantId: job.tenantId,
      type: 'flow.job.running',
      flowId: job.flowId,
      jobId: job.id,
      data: { attempt: job.attempts }
    });
    try {
      const auth = await this.systemAuth(job.tenantId, job.createdByUserId);
      const run = await this.flows.execute(
        auth,
        job.flowId,
        {
          input: job.input,
          triggerType: job.triggerType,
          triggerKey: job.triggerKey
        },
        { skipResourceAccess: true }
      );
      if (run.status !== 'success') {
        const error = this.asRecord(run.error);
        throw new Error(typeof error['message'] === 'string' ? error['message'] : 'Flow execution failed');
      }
      await this.jobs.update(
        { id: job.id, lockToken },
        {
          status: 'success',
          runId: run.id,
          lockedAt: null,
          lockToken: null,
          error: null
        }
      );
      this.live.emit({
        tenantId: job.tenantId,
        type: 'flow.job.success',
        flowId: job.flowId,
        jobId: job.id,
        runId: run.id
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Flow job failed';
      if (job.attempts < job.maxAttempts) {
        await this.jobs.update(
          { id: job.id, lockToken },
          {
            status: 'queued',
            availableAt: new Date(Date.now() + this.retryBackoff(job.attempts)),
            lockedAt: null,
            lockToken: null,
            error: message
          }
        );
        this.live.emit({
          tenantId: job.tenantId,
          type: 'flow.job.retrying',
          flowId: job.flowId,
          jobId: job.id,
          data: {
            attempt: job.attempts,
            maxAttempts: job.maxAttempts,
            error: message
          }
        });
      } else {
        await this.jobs.update(
          { id: job.id, lockToken },
          { status: 'failed', lockedAt: null, lockToken: null, error: message }
        );
        this.live.emit({
          tenantId: job.tenantId,
          type: 'flow.job.failed',
          flowId: job.flowId,
          jobId: job.id,
          data: { error: message }
        });
      }
    }
  }

  private async recoverStaleJobs() {
    const staleMs = this.limit(this.confisys.get<number>('flow.worker.staleLockMs', 300000), 10000, 3600000);
    await this.jobs
      .createQueryBuilder()
      .update(FlowJob)
      .set({
        status: 'queued',
        lockToken: null,
        lockedAt: null,
        availableAt: new Date(),
        error: 'Recovered after stale worker lock'
      })
      .where('status = :status', { status: 'running' })
      .andWhere('lockedAt < :staleAt', {
        staleAt: new Date(Date.now() - staleMs)
      })
      .execute();
  }

  private async systemAuth(tenantId: string, preferredUserId?: string | null): Promise<AuthContext> {
    const tenant = await this.tenants.findOne({
      where: { id: tenantId, active: true }
    });
    if (!tenant) {
      throw new NotFoundException('Tenant for flow job is unavailable');
    }
    let membership = preferredUserId
      ? await this.memberships.findOne({
          where: { tenantId, userId: preferredUserId, active: true }
        })
      : null;
    if (!membership) {
      membership = await this.memberships.findOne({
        where: { tenantId, active: true },
        order: { primaryMembership: 'DESC', createdAt: 'ASC' }
      });
    }
    if (!membership) {
      throw new NotFoundException('Flow job has no active tenant membership');
    }
    const user = await this.users.findOne({
      where: { id: membership.userId, tenantId, active: true }
    });
    if (!user) {
      throw new NotFoundException('Flow job user is unavailable');
    }
    user.systemRole = membership.systemRole;
    return {
      tenant,
      user,
      membership,
      sessionId: `worker:${this.workerId}`,
      tokenId: `job:${randomUUID()}`,
      roles: [{ key: membership.systemRole, name: membership.systemRole }],
      permissions: ['flows.execute']
    };
  }

  private eventInput(trigger: FlowTrigger, event: FlowOutboxEvent) {
    const config = trigger.config ?? {};
    const mode = config['inputMode'];
    if (mode === 'envelope') {
      return {
        event: {
          id: event.id,
          key: event.eventKey,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          headers: event.headers
        }
      };
    }
    return event.payload;
  }

  private directTriggerInput(trigger: FlowTrigger, input: Record<string, unknown>) {
    return trigger.config?.['inputMode'] === 'envelope'
      ? { trigger: { key: trigger.key, type: trigger.type, input } }
      : input;
  }

  private matchesSecret(secret: string | undefined, expectedHash: string) {
    if (!secret) {
      return false;
    }
    const actual = Buffer.from(createHash('sha256').update(secret).digest('hex'));
    const expected = Buffer.from(expectedHash);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private nextScheduleDate(config: Record<string, unknown> | null | undefined, from: Date) {
    const intervalSeconds = this.limit(Number((config ?? {})['intervalSeconds']) || 60, 10, 86400 * 30);
    return new Date(from.getTime() + intervalSeconds * 1000);
  }

  private batchSize() {
    return this.limit(this.confisys.get<number>('flow.worker.batchSize', 10), 1, 100);
  }

  private retryBackoff(attempt: number) {
    const baseMs = this.limit(this.confisys.get<number>('flow.worker.retryBackoffMs', 1000), 100, 60000);
    return Math.min(baseMs * 2 ** Math.max(attempt - 1, 0), 300000);
  }

  private safeDate(value?: string | Date) {
    if (!value) {
      return new Date();
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('availableAt must be a valid date');
    }
    return date;
  }

  private cleanEventKey(value: string) {
    const key = value.trim().toLowerCase();
    if (!/^[a-z][a-z0-9_.:-]{2,179}$/.test(key)) {
      throw new BadRequestException('Event key must use letters, numbers, dot, colon, dash or underscore');
    }
    return key;
  }

  private cleanIdempotencyKey(value: string) {
    const key = value.trim();
    if (!key || key.length > 180) {
      throw new BadRequestException('idempotencyKey is required and must be at most 180 characters');
    }
    return key;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private limit(value: number, minimum: number, maximum: number) {
    const safe = Number.isFinite(value) ? Math.floor(value) : minimum;
    return Math.min(Math.max(safe, minimum), maximum);
  }
}

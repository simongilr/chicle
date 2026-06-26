import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { DynamicServicesService } from '../dynamic-services/dynamic-services.service';
import { FlowRun, FlowRunTriggerType } from './flow-run.entity';
import { FlowStepRun, FlowStepRunStatus } from './flow-step-run.entity';
import { FlowStep } from './flow-step.entity';
import { FlowVersion, FlowDefinition, FlowDefinitionStep, FlowStepType } from './flow-version.entity';
import { Flow, FlowRuntimeConfig } from './flow.entity';

const FLOW_STEP_TYPES: FlowStepType[] = [
  'start',
  'dynamic_service',
  'formula',
  'validation',
  'decision',
  'action',
  'response',
  'end'
];

export interface FlowUpsertRequest {
  key?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  status?: 'draft' | 'active' | 'paused';
  runtimeConfig?: FlowRuntimeConfig | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface FlowStepRequest {
  key?: string;
  name?: string;
  type?: FlowStepType;
  position?: number;
  config?: Record<string, unknown> | null;
  inputMap?: Record<string, unknown> | null;
  outputKey?: string | null;
  nextStepKey?: string | null;
  onSuccessStepKey?: string | null;
  onErrorStepKey?: string | null;
  onTimeoutStepKey?: string | null;
  onTrueStepKey?: string | null;
  onFalseStepKey?: string | null;
  runtimeConfig?: FlowRuntimeConfig | null;
  ui?: Record<string, unknown> | null;
}

export interface FlowExecuteRequest {
  input?: Record<string, unknown>;
  triggerType?: FlowRunTriggerType;
  triggerKey?: string | null;
}

interface FlowExecutionContext {
  tenant: AuthContext['tenant'];
  user: AuthContext['user'];
  input: Record<string, unknown>;
  steps: Record<string, unknown>;
}

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(Flow)
    private readonly flows: Repository<Flow>,
    @InjectRepository(FlowVersion)
    private readonly versions: Repository<FlowVersion>,
    @InjectRepository(FlowStep)
    private readonly steps: Repository<FlowStep>,
    @InjectRepository(FlowRun)
    private readonly runs: Repository<FlowRun>,
    @InjectRepository(FlowStepRun)
    private readonly stepRuns: Repository<FlowStepRun>,
    private readonly dynamicServices: DynamicServicesService,
    private readonly audit: AuditService
  ) {}

  async list(auth: AuthContext) {
    const flows = await this.flows.find({
      where: { tenantId: auth.tenant.id, trashedAt: IsNull() },
      order: { updatedAt: 'DESC' }
    });
    return this.withDetails(auth, flows);
  }

  async listTrashed(auth: AuthContext) {
    const flows = await this.flows
      .createQueryBuilder('flow')
      .where('flow.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .andWhere('flow.trashedAt IS NOT NULL')
      .orderBy('flow.trashedAt', 'DESC')
      .getMany();
    return this.withDetails(auth, flows);
  }

  async get(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    return (await this.withDetails(auth, [flow]))[0];
  }

  async create(auth: AuthContext, request: FlowUpsertRequest) {
    const key = this.normalizeKey(request.key);
    const name = this.cleanName(request.name);
    const flow = await this.flows.save(
      this.flows.create({
        tenantId: auth.tenant.id,
        key,
        name,
        description: request.description?.trim() || null,
        category: request.category?.trim() || null,
        status: request.status ?? 'draft',
        runtimeConfig: request.runtimeConfig ?? null,
        tags: this.cleanTags(request.tags),
        metadata: request.metadata ?? null
      })
    );

    await this.audit.record({
      auth,
      action: 'flow.created',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { key: flow.key, name: flow.name }
    });

    return this.get(auth, flow.id);
  }

  async update(auth: AuthContext, flowId: string, request: FlowUpsertRequest) {
    const flow = await this.requireFlow(auth, flowId);
    const saved = await this.flows.save(
      this.flows.merge(flow, {
        key: request.key ? this.normalizeKey(request.key) : flow.key,
        name: request.name ? this.cleanName(request.name) : flow.name,
        description: request.description !== undefined ? request.description?.trim() || null : flow.description,
        category: request.category !== undefined ? request.category?.trim() || null : flow.category,
        status: request.status ?? flow.status,
        runtimeConfig: request.runtimeConfig !== undefined ? request.runtimeConfig : flow.runtimeConfig,
        tags: request.tags !== undefined ? this.cleanTags(request.tags) : flow.tags,
        metadata: request.metadata !== undefined ? request.metadata : flow.metadata
      })
    );

    await this.audit.record({
      auth,
      action: 'flow.updated',
      resourceType: 'flow',
      resourceId: saved.id,
      metadata: { key: saved.key, status: saved.status }
    });

    return this.get(auth, saved.id);
  }

  async trash(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    if (flow.trashedAt) {
      return flow;
    }
    const saved = await this.flows.save(
      this.flows.merge(flow, {
        status: 'trashed',
        trashedAt: new Date(),
        trashedByUserId: auth.user.id
      })
    );

    await this.audit.record({
      auth,
      action: 'flow.trashed',
      resourceType: 'flow',
      resourceId: saved.id,
      metadata: { key: saved.key }
    });

    return saved;
  }

  async restore(auth: AuthContext, flowId: string) {
    const flow = await this.requireTrashedFlow(auth, flowId);
    const saved = await this.flows.save(
      this.flows.merge(flow, {
        status: 'draft',
        trashedAt: null,
        trashedByUserId: null
      })
    );

    await this.audit.record({
      auth,
      action: 'flow.restored',
      resourceType: 'flow',
      resourceId: saved.id,
      metadata: { key: saved.key }
    });

    return this.get(auth, saved.id);
  }

  async createStep(auth: AuthContext, flowId: string, request: FlowStepRequest) {
    const flow = await this.requireFlow(auth, flowId);
    const key = this.normalizeKey(request.key);
    await this.assertStepKeyAvailable(auth, flow.id, key);
    const step = await this.steps.save(
      this.steps.create({
        tenantId: auth.tenant.id,
        flowId: flow.id,
        versionId: null,
        key,
        name: this.cleanName(request.name ?? key),
        type: this.cleanStepType(request.type),
        position: this.cleanPosition(request.position),
        config: request.config ?? null,
        inputMap: request.inputMap ?? null,
        outputKey: request.outputKey?.trim() || null,
        nextStepKey: request.nextStepKey?.trim() || null,
        onSuccessStepKey: request.onSuccessStepKey?.trim() || null,
        onErrorStepKey: request.onErrorStepKey?.trim() || null,
        onTimeoutStepKey: request.onTimeoutStepKey?.trim() || null,
        onTrueStepKey: request.onTrueStepKey?.trim() || null,
        onFalseStepKey: request.onFalseStepKey?.trim() || null,
        runtimeConfig: request.runtimeConfig ?? null,
        ui: request.ui ?? null
      })
    );

    await this.audit.record({
      auth,
      action: 'flow.step.created',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { stepKey: step.key, stepType: step.type }
    });

    return this.get(auth, flow.id);
  }

  async updateStep(auth: AuthContext, flowId: string, stepId: string, request: FlowStepRequest) {
    const flow = await this.requireFlow(auth, flowId);
    const step = await this.requireStep(auth, flow.id, stepId);
    const nextKey = request.key ? this.normalizeKey(request.key) : step.key;
    if (nextKey !== step.key) {
      await this.assertStepKeyAvailable(auth, flow.id, nextKey);
    }

    await this.steps.save(
      this.steps.merge(step, {
        key: nextKey,
        name: request.name ? this.cleanName(request.name) : step.name,
        type: request.type ? this.cleanStepType(request.type) : step.type,
        position: request.position !== undefined ? this.cleanPosition(request.position) : step.position,
        config: request.config !== undefined ? request.config : step.config,
        inputMap: request.inputMap !== undefined ? request.inputMap : step.inputMap,
        outputKey: request.outputKey !== undefined ? request.outputKey?.trim() || null : step.outputKey,
        nextStepKey: request.nextStepKey !== undefined ? request.nextStepKey?.trim() || null : step.nextStepKey,
        onSuccessStepKey:
          request.onSuccessStepKey !== undefined ? request.onSuccessStepKey?.trim() || null : step.onSuccessStepKey,
        onErrorStepKey: request.onErrorStepKey !== undefined ? request.onErrorStepKey?.trim() || null : step.onErrorStepKey,
        onTimeoutStepKey:
          request.onTimeoutStepKey !== undefined ? request.onTimeoutStepKey?.trim() || null : step.onTimeoutStepKey,
        onTrueStepKey: request.onTrueStepKey !== undefined ? request.onTrueStepKey?.trim() || null : step.onTrueStepKey,
        onFalseStepKey: request.onFalseStepKey !== undefined ? request.onFalseStepKey?.trim() || null : step.onFalseStepKey,
        runtimeConfig: request.runtimeConfig !== undefined ? request.runtimeConfig : step.runtimeConfig,
        ui: request.ui !== undefined ? request.ui : step.ui
      })
    );

    await this.audit.record({
      auth,
      action: 'flow.step.updated',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { stepKey: nextKey }
    });

    return this.get(auth, flow.id);
  }

  async deleteStep(auth: AuthContext, flowId: string, stepId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const step = await this.requireStep(auth, flow.id, stepId);
    await this.steps.delete({ id: step.id, tenantId: auth.tenant.id, flowId: flow.id });

    await this.audit.record({
      auth,
      action: 'flow.step.deleted',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { stepKey: step.key }
    });

    return this.get(auth, flow.id);
  }

  async definition(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const steps = await this.listDraftSteps(auth, flow.id);
    return this.buildDefinition(flow, steps);
  }

  async listVersions(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    return this.versions.find({
      where: { tenantId: auth.tenant.id, flowId: flow.id },
      order: { version: 'DESC' }
    });
  }

  async createVersion(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const steps = await this.listDraftSteps(auth, flow.id);
    const definition = this.buildDefinition(flow, steps);
    const latest = await this.versions.findOne({
      where: { tenantId: auth.tenant.id, flowId: flow.id },
      order: { version: 'DESC' }
    });
    const version = await this.versions.save(
      this.versions.create({
        tenantId: auth.tenant.id,
        flowId: flow.id,
        version: (latest?.version ?? 0) + 1,
        status: 'draft',
        definition,
        inputSchema: definition.inputSchema ?? null,
        outputSchema: definition.outputSchema ?? null,
        runtimeConfig: definition.runtimeConfig ?? null,
        createdByUserId: auth.user.id
      })
    );

    await this.snapshotStepsForVersion(auth, flow.id, version.id, steps);
    await this.audit.record({
      auth,
      action: 'flow.version.created',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { version: version.version }
    });

    return version;
  }

  async publishVersion(auth: AuthContext, flowId: string, versionId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const version = await this.requireVersion(auth, flow.id, versionId);
    await this.versions.manager.transaction(async (manager) => {
      await manager.update(
        FlowVersion,
        { tenantId: auth.tenant.id, flowId: flow.id, status: 'published' },
        { status: 'archived' }
      );
      await manager.update(
        FlowVersion,
        { id: version.id, tenantId: auth.tenant.id },
        { status: 'published', publishedAt: new Date() }
      );
      await manager.update(
        Flow,
        { id: flow.id, tenantId: auth.tenant.id },
        { status: 'active', publishedVersionId: version.id }
      );
    });

    await this.audit.record({
      auth,
      action: 'flow.version.published',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { version: version.version }
    });

    return this.requireVersion(auth, flow.id, version.id);
  }

  async listRuns(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const runs = await this.runs.find({
      where: { tenantId: auth.tenant.id, flowId: flow.id },
      order: { createdAt: 'DESC' },
      take: 30
    });
    const runIds = runs.map((run) => run.id);
    const steps = runIds.length
      ? await this.stepRuns
          .createQueryBuilder('stepRun')
          .where('stepRun.tenantId = :tenantId', { tenantId: auth.tenant.id })
          .andWhere('stepRun.runId IN (:...runIds)', { runIds })
          .orderBy('stepRun.createdAt', 'ASC')
          .getMany()
      : [];
    const stepsByRun = new Map<string, FlowStepRun[]>();
    for (const step of steps) {
      stepsByRun.set(step.runId, [...(stepsByRun.get(step.runId) ?? []), step]);
    }
    return runs.map((run) => ({ ...run, steps: stepsByRun.get(run.id) ?? [] }));
  }

  async executeByKey(auth: AuthContext, flowKey: string, request: FlowExecuteRequest) {
    const flow = await this.requireFlowByKey(auth, this.normalizeKey(flowKey));
    return this.executePublishedFlow(auth, flow, request);
  }

  async execute(auth: AuthContext, flowId: string, request: FlowExecuteRequest) {
    const flow = await this.requireFlow(auth, flowId);
    return this.executePublishedFlow(auth, flow, request);
  }

  private async executePublishedFlow(auth: AuthContext, flow: Flow, request: FlowExecuteRequest) {
    if (flow.status !== 'active') {
      throw new BadRequestException('Flow must be active before execution');
    }

    const version = await this.versions.findOne({
      where: { tenantId: auth.tenant.id, flowId: flow.id, status: 'published' },
      order: { version: 'DESC' }
    });
    if (!version) {
      throw new BadRequestException('Publish a flow version before executing it');
    }

    const input = this.asRecord(request.input);
    const started = Date.now();
    const run = await this.runs.save(
      this.runs.create({
        tenantId: auth.tenant.id,
        flowId: flow.id,
        versionId: version.id,
        triggerType: request.triggerType ?? 'test',
        triggerKey: request.triggerKey?.trim() || null,
        status: 'running',
        input,
        startedAt: new Date(),
        createdByUserId: auth.user.id
      })
    );

    const context: FlowExecutionContext = {
      tenant: auth.tenant,
      user: auth.user,
      input,
      steps: {}
    };

    try {
      const output = await this.runDefinition(auth, flow, version, run.id, context);
      const finishedAt = new Date();
      await this.runs.update(
        { id: run.id, tenantId: auth.tenant.id },
        {
          status: 'success',
          output: this.asRecord(output) as any,
          contextSnapshot: { input, steps: context.steps },
          durationMs: Date.now() - started,
          finishedAt
        }
      );
      await this.audit.record({
        auth,
        action: 'flow.executed',
        resourceType: 'flow',
        resourceId: flow.id,
        metadata: { runId: run.id, version: version.version }
      });
      return this.runWithSteps(auth, run.id);
    } catch (error) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : 'Unknown flow execution error';
      await this.runs.update(
        { id: run.id, tenantId: auth.tenant.id },
        {
          status: 'failed',
          error: { message },
          contextSnapshot: { input, steps: context.steps },
          durationMs: Date.now() - started,
          finishedAt
        }
      );
      await this.audit.record({
        auth,
        action: 'flow.failed',
        resourceType: 'flow',
        resourceId: flow.id,
        metadata: { runId: run.id, version: version.version, error: message }
      });
      return this.runWithSteps(auth, run.id);
    }
  }

  private async runDefinition(
    auth: AuthContext,
    flow: Flow,
    version: FlowVersion,
    runId: string,
    context: FlowExecutionContext
  ) {
    const steps = version.definition.steps ?? [];
    if (!steps.length) {
      throw new BadRequestException('Published flow has no steps');
    }

    const byKey = new Map(steps.map((step) => [step.key, step]));
    let currentKey: string | undefined = steps.find((step) => step.type === 'start')?.key ?? steps[0]?.key;
    let output: unknown = { ok: true };
    const visited = new Set<string>();

    for (let guard = 0; currentKey && guard < 100; guard += 1) {
      if (visited.has(currentKey)) {
        throw new BadRequestException(`Flow loop detected at step ${currentKey}`);
      }
      visited.add(currentKey);
      const step = byKey.get(currentKey);
      if (!step) {
        throw new BadRequestException(`Step ${currentKey} not found`);
      }

      const result = await this.runStep(auth, flow, version, runId, step, context);
      if (result.output !== undefined) {
        output = result.output;
      }
      if (step.type === 'end') {
        return output;
      }
      currentKey = result.nextKey;
    }

    if (currentKey) {
      throw new BadRequestException('Flow exceeded max step guard');
    }
    return output;
  }

  private async runStep(
    auth: AuthContext,
    flow: Flow,
    version: FlowVersion,
    runId: string,
    step: FlowDefinitionStep,
    context: FlowExecutionContext
  ) {
    const started = Date.now();
    const input = this.renderRecord(step.inputMap ?? {}, context);
    const stepRun = await this.stepRuns.save(
      this.stepRuns.create({
        tenantId: auth.tenant.id,
        runId,
        flowId: flow.id,
        versionId: version.id,
        stepKey: step.key,
        stepName: step.name ?? step.key,
        stepType: step.type,
        status: 'running',
        input,
        startedAt: new Date()
      })
    );

    try {
      const result = await this.executeStep(auth, step, input, context);
      const outputKey = step.outputKey || step.key;
      if (result.output !== undefined) {
        context.steps[outputKey] = result.output;
      }
      await this.finishStepRun(auth, stepRun.id, 'success', started, { output: this.asRecordOrValue(result.output) });
      return {
        output: result.output,
        nextKey: result.nextKey ?? this.nextStepKey(step, true)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown step execution error';
      await this.finishStepRun(auth, stepRun.id, 'failed', started, { error: { message } });
      if (step.onError) {
        return { output: { ok: false, error: message }, nextKey: step.onError };
      }
      throw error;
    }
  }

  private async executeStep(
    auth: AuthContext,
    step: FlowDefinitionStep,
    input: Record<string, unknown>,
    context: FlowExecutionContext
  ): Promise<{ output?: unknown; nextKey?: string }> {
    switch (step.type) {
      case 'start':
        return { output: context.input, nextKey: step.next };
      case 'dynamic_service': {
        const serviceKey = step.serviceKey || this.stringConfig(step.config ?? {}, 'serviceKey');
        if (!serviceKey) {
          throw new BadRequestException(`Step ${step.key} requires serviceKey`);
        }
        const serviceRun = await this.dynamicServices.executeByKey(auth, serviceKey, {
          context: input
        });
        const ok = serviceRun.status === 'success';
        return {
          output: {
            ok,
            status: serviceRun.status,
            durationMs: serviceRun.durationMs,
            response: serviceRun.responseSnapshot ?? null,
            error: serviceRun.error ?? null
          },
          nextKey: ok ? this.nextStepKey(step, true) : (step.onError ?? this.nextStepKey(step, false))
        };
      }
      case 'response': {
        const config = step.config ?? {};
        return {
          output: {
            status: this.stringConfig(config, 'status') ?? 'success',
            body: this.renderValue(config['body'] ?? { ok: true, steps: '{{steps}}' }, context)
          },
          nextKey: step.next
        };
      }
      case 'end':
        return { output: { ok: true, steps: context.steps } };
      case 'formula':
      case 'validation':
      case 'decision':
      case 'action':
        return {
          output: {
            skipped: true,
            reason: `${step.type} runner is pending Expression Engine V1`,
            config: step.config ?? {}
          },
          nextKey: this.nextStepKey(step, true)
        };
    }
  }

  private nextStepKey(step: FlowDefinitionStep, success: boolean) {
    if (step.type === 'decision') {
      return success ? (step.onTrue ?? step.next) : (step.onFalse ?? step.next);
    }
    return success ? (step.onSuccess ?? step.next) : (step.onError ?? step.next);
  }

  private async finishStepRun(
    auth: AuthContext,
    stepRunId: string,
    status: FlowStepRunStatus,
    started: number,
    updates: Pick<FlowStepRun, 'output'> | Pick<FlowStepRun, 'error'>
  ) {
    await this.stepRuns.update(
      { id: stepRunId, tenantId: auth.tenant.id },
      {
        status,
        durationMs: Date.now() - started,
        finishedAt: new Date(),
        ...(updates as Record<string, unknown>)
      }
    );
  }

  private async runWithSteps(auth: AuthContext, runId: string) {
    const run = await this.runs.findOneOrFail({ where: { id: runId, tenantId: auth.tenant.id } });
    const steps = await this.stepRuns.find({
      where: { tenantId: auth.tenant.id, runId },
      order: { createdAt: 'ASC' }
    });
    return { ...run, steps };
  }

  private async withDetails(auth: AuthContext, flows: Flow[]) {
    const flowIds = flows.map((flow) => flow.id);
    const [versions, steps] = await Promise.all([
      flowIds.length
        ? this.versions
            .createQueryBuilder('version')
            .where('version.tenantId = :tenantId', { tenantId: auth.tenant.id })
            .andWhere('version.flowId IN (:...flowIds)', { flowIds })
            .orderBy('version.version', 'DESC')
            .getMany()
        : [],
      flowIds.length
        ? this.steps.find({
            where: flowIds.map((flowId) => ({ tenantId: auth.tenant.id, flowId, versionId: IsNull() })),
            order: { position: 'ASC', createdAt: 'ASC' }
          })
        : []
    ]);
    const latestByFlow = new Map<string, FlowVersion>();
    const publishedByFlow = new Map<string, FlowVersion>();
    const stepsByFlow = new Map<string, FlowStep[]>();

    for (const version of versions) {
      if (!latestByFlow.has(version.flowId)) {
        latestByFlow.set(version.flowId, version);
      }
      if (version.status === 'published' && !publishedByFlow.has(version.flowId)) {
        publishedByFlow.set(version.flowId, version);
      }
    }

    for (const step of steps) {
      stepsByFlow.set(step.flowId, [...(stepsByFlow.get(step.flowId) ?? []), step]);
    }

    return flows.map((flow) => ({
      ...flow,
      steps: stepsByFlow.get(flow.id) ?? [],
      latestVersion: latestByFlow.get(flow.id) ?? null,
      publishedVersion: publishedByFlow.get(flow.id) ?? null,
      definitionPreview: this.buildDefinition(flow, stepsByFlow.get(flow.id) ?? [])
    }));
  }

  private buildDefinition(flow: Flow, steps: FlowStep[]): FlowDefinition {
    const sorted = steps.slice().sort((a, b) => a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime());
    const definitionSteps = sorted.map((step, index) => this.toDefinitionStep(step, sorted[index + 1]?.key));
    const hasStart = definitionSteps.some((step) => step.type === 'start');
    const hasEnd = definitionSteps.some((step) => step.type === 'end');
    const firstStep = definitionSteps[0]?.key;
    const lastStep = definitionSteps[definitionSteps.length - 1]?.key;

    return {
      key: flow.key,
      name: flow.name,
      version: 0,
      description: flow.description ?? null,
      runtimeConfig: flow.runtimeConfig ?? undefined,
      steps: [
        ...(hasStart ? [] : [{ key: 'start', type: 'start' as const, next: firstStep ?? 'end' }]),
        ...definitionSteps,
        ...(hasEnd ? [] : [{ key: 'end', type: 'end' as const }])
      ].map((step) =>
        step.key === lastStep && step.type !== 'end' && !step.next && !step.onSuccess ? { ...step, next: 'end' } : step
      )
    };
  }

  private toDefinitionStep(step: FlowStep, nextKey?: string): FlowDefinitionStep {
    const config = step.config ?? {};
    return {
      key: step.key,
      name: step.name,
      type: step.type,
      serviceKey: this.stringConfig(config, 'serviceKey'),
      actionKey: this.stringConfig(config, 'actionKey'),
      expression: this.stringConfig(config, 'expression'),
      condition: this.stringConfig(config, 'condition'),
      inputMap: step.inputMap ?? undefined,
      outputKey: step.outputKey ?? undefined,
      config,
      runtimeConfig: step.runtimeConfig ?? undefined,
      next: step.nextStepKey ?? nextKey,
      onSuccess: step.onSuccessStepKey ?? undefined,
      onError: step.onErrorStepKey ?? undefined,
      onTimeout: step.onTimeoutStepKey ?? undefined,
      onTrue: step.onTrueStepKey ?? undefined,
      onFalse: step.onFalseStepKey ?? undefined,
      ui: step.ui ?? undefined
    };
  }

  private async snapshotStepsForVersion(auth: AuthContext, flowId: string, versionId: string, steps: FlowStep[]) {
    const snapshots = steps.map((step) =>
      this.steps.create({
        tenantId: auth.tenant.id,
        flowId,
        versionId,
        key: step.key,
        name: step.name,
        type: step.type,
        position: step.position,
        config: step.config,
        inputMap: step.inputMap,
        outputKey: step.outputKey,
        nextStepKey: step.nextStepKey,
        onSuccessStepKey: step.onSuccessStepKey,
        onErrorStepKey: step.onErrorStepKey,
        onTimeoutStepKey: step.onTimeoutStepKey,
        onTrueStepKey: step.onTrueStepKey,
        onFalseStepKey: step.onFalseStepKey,
        runtimeConfig: step.runtimeConfig,
        ui: step.ui
      })
    );
    await this.steps.save(snapshots);
  }

  private async requireFlow(auth: AuthContext, flowId: string) {
    const flow = await this.flows.findOne({ where: { id: flowId, tenantId: auth.tenant.id, trashedAt: IsNull() } });
    if (!flow) {
      throw new NotFoundException('Flow not found');
    }
    return flow;
  }

  private async requireFlowByKey(auth: AuthContext, key: string) {
    const flow = await this.flows.findOne({ where: { key, tenantId: auth.tenant.id, trashedAt: IsNull() } });
    if (!flow) {
      throw new NotFoundException('Flow not found');
    }
    return flow;
  }

  private async requireTrashedFlow(auth: AuthContext, flowId: string) {
    const flow = await this.flows
      .createQueryBuilder('flow')
      .where('flow.id = :flowId', { flowId })
      .andWhere('flow.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .andWhere('flow.trashedAt IS NOT NULL')
      .getOne();
    if (!flow) {
      throw new NotFoundException('Flow not found in trash');
    }
    return flow;
  }

  private async requireVersion(auth: AuthContext, flowId: string, versionId: string) {
    const version = await this.versions.findOne({ where: { id: versionId, tenantId: auth.tenant.id, flowId } });
    if (!version) {
      throw new NotFoundException('Flow version not found');
    }
    return version;
  }

  private async requireStep(auth: AuthContext, flowId: string, stepId: string) {
    const step = await this.steps.findOne({ where: { id: stepId, tenantId: auth.tenant.id, flowId, versionId: IsNull() } });
    if (!step) {
      throw new NotFoundException('Flow step not found');
    }
    return step;
  }

  private async listDraftSteps(auth: AuthContext, flowId: string) {
    return this.steps.find({
      where: { tenantId: auth.tenant.id, flowId, versionId: IsNull() },
      order: { position: 'ASC', createdAt: 'ASC' }
    });
  }

  private async assertStepKeyAvailable(auth: AuthContext, flowId: string, key: string) {
    const exists = await this.steps.exist({ where: { tenantId: auth.tenant.id, flowId, versionId: IsNull(), key } });
    if (exists) {
      throw new BadRequestException('Step key already exists');
    }
  }

  private normalizeKey(value?: string) {
    const key = (value ?? '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9_]{2,119}$/.test(key)) {
      throw new BadRequestException('Key must use snake_case and be 3-120 characters long');
    }
    return key;
  }

  private cleanName(value?: string) {
    const name = (value ?? '').trim();
    if (name.length < 3 || name.length > 180) {
      throw new BadRequestException('Name must be 3-180 characters long');
    }
    return name;
  }

  private cleanStepType(value?: FlowStepType) {
    if (!value || !FLOW_STEP_TYPES.includes(value)) {
      throw new BadRequestException('Invalid step type');
    }
    return value;
  }

  private cleanPosition(value?: number) {
    const position = Number(value ?? 0);
    return Number.isFinite(position) && position >= 0 ? Math.floor(position) : 0;
  }

  private cleanTags(tags?: string[] | null) {
    if (!tags) {
      return null;
    }
    return tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
  }

  private stringConfig(config: Record<string, unknown>, key: string) {
    const value = config[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private renderRecord(record: Record<string, unknown>, context: FlowExecutionContext) {
    return Object.entries(record).reduce<Record<string, unknown>>((rendered, [key, value]) => {
      rendered[key] = this.renderValue(value, context);
      return rendered;
    }, {});
  }

  private renderValue(value: unknown, context: FlowExecutionContext): unknown {
    if (typeof value === 'string') {
      const exact = value.match(/^{{\s*([^}]+)\s*}}$/);
      if (exact) {
        return this.resolvePath(context, exact[1]);
      }
      return value.replace(/{{\s*([^}]+)\s*}}/g, (_match, path: string) => {
        const resolved = this.resolvePath(context, path);
        return resolved === undefined || resolved === null ? '' : String(resolved);
      });
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.renderValue(item, context));
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((rendered, [key, item]) => {
        rendered[key] = this.renderValue(item, context);
        return rendered;
      }, {});
    }

    return value;
  }

  private resolvePath(context: FlowExecutionContext, rawPath: string) {
    const path = rawPath.trim();
    const root: Record<string, unknown> = {
      input: context.input,
      tenant: context.tenant,
      user: context.user,
      steps: context.steps
    };
    return path.split('.').reduce<unknown>((value, part) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (typeof value !== 'object') {
        return undefined;
      }
      return (value as Record<string, unknown>)[part];
    }, root);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private asRecordOrValue(value: unknown): Record<string, unknown> {
    return this.asRecord(value) === value ? (value as Record<string, unknown>) : { value };
  }
}

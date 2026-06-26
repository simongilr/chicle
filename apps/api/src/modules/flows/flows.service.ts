import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import { DynamicServicesService } from '../dynamic-services/dynamic-services.service';
import { FlowRun, FlowRunTriggerType } from './flow-run.entity';
import { FlowExpressionEngine } from './flow-expression-engine.service';
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

export interface FlowPreviewRequest extends FlowExecuteRequest {
  throughStepKey?: string | null;
}

interface FlowExecutionContext {
  tenant: AuthContext['tenant'];
  user: AuthContext['user'];
  input: Record<string, unknown>;
  steps: Record<string, unknown>;
  lastOutput?: unknown;
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
    private readonly expressions: FlowExpressionEngine,
    private readonly confisys: ConfisysService,
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
        metadata: this.cleanMetadata(request.metadata)
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
        metadata: request.metadata !== undefined ? this.cleanMetadata(request.metadata) : flow.metadata
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
    await this.validateDraftForVersion(auth, steps);
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

  async preview(auth: AuthContext, flowId: string, request: FlowPreviewRequest) {
    this.assertFlowEnabled();
    const flow = await this.requireFlow(auth, flowId);
    const draftSteps = await this.listDraftSteps(auth, flow.id);
    if (!draftSteps.length) {
      throw new BadRequestException('Add at least one step before testing the draft');
    }
    const definition = this.buildDefinition(flow, draftSteps);
    const throughStepKey = request.throughStepKey?.trim() || null;
    const byKey = new Map(definition.steps.map((step) => [step.key, step]));
    if (throughStepKey && !byKey.has(throughStepKey)) {
      throw new BadRequestException(`Step ${throughStepKey} not found in draft flow`);
    }

    const previewInput = this.asRecord(request.input);
    this.validateFlowInput(previewInput, definition.inputSchema);
    const context: FlowExecutionContext = {
      tenant: auth.tenant,
      user: auth.user,
      input: previewInput,
      steps: {}
    };
    const results: Array<Record<string, unknown>> = [];
    const visited = new Set<string>();
    const maxSteps = this.flowLimit(flow.runtimeConfig?.maxSteps, 'flow.maxSteps', 50, 1, 500);
    const maxDurationMs = this.flowLimit(flow.runtimeConfig?.maxDurationMs, 'flow.maxDurationMs', 30000, 100, 300000);
    const previewStarted = Date.now();
    let currentKey: string | undefined =
      definition.steps.find((step) => step.type === 'start')?.key ?? definition.steps[0]?.key;
    let output: unknown = { ok: true };

    for (let guard = 0; currentKey && guard < maxSteps; guard += 1) {
      if (Date.now() - previewStarted > maxDurationMs) {
        return this.failedPreview(results, context, output, `Draft exceeded ${maxDurationMs} ms`);
      }
      if (visited.has(currentKey)) {
        return this.failedPreview(results, context, output, `Flow loop detected at step ${currentKey}`);
      }
      visited.add(currentKey);
      const step = byKey.get(currentKey);
      if (!step) {
        return this.failedPreview(results, context, output, `Step ${currentKey} not found`);
      }

      const started = Date.now();
      const input = this.renderRecord(step.inputMap ?? {}, context);
      try {
        const result = await this.executeStep(auth, step, input, context);
        const outputKey = step.outputKey || step.key;
        if (result.output !== undefined) {
          output = result.output;
          context.lastOutput = result.output;
          context.steps[outputKey] = result.output;
        }
        results.push({
          stepKey: step.key,
          stepName: step.name ?? step.key,
          stepType: step.type,
          status: 'success',
          durationMs: Date.now() - started,
          input,
          output: this.asRecordOrValue(result.output)
        });

        if (step.key === throughStepKey || step.type === 'end') {
          return {
            status: 'success',
            throughStepKey: step.key,
            output: this.asRecordOrValue(output),
            context: { input: context.input, steps: context.steps },
            steps: results
          };
        }
        currentKey = result.nextKey ?? this.nextStepKey(step, true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown step execution error';
        results.push({
          stepKey: step.key,
          stepName: step.name ?? step.key,
          stepType: step.type,
          status: 'failed',
          durationMs: Date.now() - started,
          input,
          error: { message }
        });
        return this.failedPreview(results, context, output, message);
      }
    }

    if (currentKey) {
      return this.failedPreview(results, context, output, `Draft exceeded the maximum of ${maxSteps} steps`);
    }

    return {
      status: 'success',
      throughStepKey,
      output: this.asRecordOrValue(output),
      context: { input: context.input, steps: context.steps },
      steps: results
    };
  }

  private async executePublishedFlow(auth: AuthContext, flow: Flow, request: FlowExecuteRequest) {
    this.assertFlowEnabled();
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
    this.validateFlowInput(input, version.definition.inputSchema);
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
          output: this.asRecordOrValue(output) as any,
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
    const maxSteps = this.flowLimit(
      version.runtimeConfig?.maxSteps ?? flow.runtimeConfig?.maxSteps,
      'flow.maxSteps',
      50,
      1,
      500
    );
    const maxDurationMs = this.flowLimit(
      version.runtimeConfig?.maxDurationMs ?? flow.runtimeConfig?.maxDurationMs,
      'flow.maxDurationMs',
      30000,
      100,
      300000
    );
    const definitionStarted = Date.now();

    for (let guard = 0; currentKey && guard < maxSteps; guard += 1) {
      if (Date.now() - definitionStarted > maxDurationMs) {
        throw new BadRequestException(`Flow exceeded ${maxDurationMs} ms`);
      }
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
        context.lastOutput = result.output;
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
        const config = step.config ?? {};
        const serviceKey = step.serviceKey || this.stringConfig(step.config ?? {}, 'serviceKey');
        if (!serviceKey) {
          throw new BadRequestException(`Step ${step.key} requires serviceKey`);
        }
        const serviceRun = await this.executeDynamicServiceStep(auth, serviceKey, input, config);
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
        return {
          output: context.lastOutput ?? {
            ok: true,
            steps: context.steps
          }
        };
      case 'formula': {
        const config = step.config ?? {};
        const rule = config['rule'];
        const rawResult = this.expressions.evaluate(rule, this.expressionData(context));
        if (typeof rawResult === 'number' && !Number.isFinite(rawResult)) {
          throw new BadRequestException(`Step ${step.key} produced a non-finite number`);
        }
        const precision = Number(config['precision']);
        const result =
          Number.isFinite(precision) && typeof rawResult === 'number'
            ? Number(rawResult.toFixed(Math.min(Math.max(Math.floor(precision), 0), 10)))
            : rawResult;
        return {
          output: result,
          nextKey: this.nextStepKey(step, true)
        };
      }
      case 'validation': {
        const validation = this.expressions.validate(step.config ?? {}, this.expressionData(context));
        if (!validation.valid && !step.onFalse && !step.onError) {
          throw new BadRequestException(validation.message ?? `Step ${step.key} validation failed`);
        }
        return {
          output: validation,
          nextKey: validation.valid
            ? this.nextStepKey(step, true)
            : (step.onFalse ?? step.onError ?? this.nextStepKey(step, false))
        };
      }
      case 'decision': {
        const rule = (step.config ?? {})['rule'];
        const result = this.expressions.evaluateBoolean(rule, this.expressionData(context));
        return {
          output: { result },
          nextKey: result ? (step.onTrue ?? step.next) : (step.onFalse ?? step.next)
        };
      }
      case 'action': {
        const config = step.config ?? {};
        return {
          output: {
            action: this.stringConfig(config, 'action') ?? 'custom',
            payload: input,
            instruction: true
          },
          nextKey: this.nextStepKey(step, true)
        };
      }
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
      inputSchema: this.inputSchemaFromFlow(flow),
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

  private inputSchemaFromFlow(flow: Flow): Record<string, unknown> | undefined {
    const inputFields = this.asArray(flow.metadata?.['inputFields']);
    if (!inputFields.length) {
      return undefined;
    }
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const rawField of inputFields) {
      const field = this.asRecord(rawField);
      const key = typeof field['key'] === 'string' ? field['key'].trim() : '';
      if (!/^[a-z][a-z0-9_]{1,79}$/.test(key)) {
        continue;
      }
      const type = typeof field['type'] === 'string' ? field['type'] : 'text';
      properties[key] = {
        type: type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : 'string',
        ...(type === 'email' ? { format: 'email' } : {}),
        ...(type === 'date' ? { format: 'date' } : {}),
        title: typeof field['label'] === 'string' ? field['label'] : key
      };
      if (field['required'] === true) {
        required.push(key);
      }
    }
    return {
      type: 'object',
      properties,
      required,
      additionalProperties: true
    };
  }

  private validateFlowInput(input: Record<string, unknown>, schema?: Record<string, unknown>) {
    if (!schema) {
      return;
    }
    const properties = this.asRecord(schema['properties']);
    const required = this.asArray(schema['required']).filter((value): value is string => typeof value === 'string');
    const missing = required.find((key) => input[key] === undefined || input[key] === null || input[key] === '');
    if (missing) {
      throw new BadRequestException(`Flow input ${missing} is required`);
    }
    for (const [key, rawDefinition] of Object.entries(properties)) {
      const value = input[key];
      if (value === undefined || value === null) {
        continue;
      }
      const definition = this.asRecord(rawDefinition);
      const expectedType = definition['type'];
      if (expectedType === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
        throw new BadRequestException(`Flow input ${key} must be a number`);
      }
      if (expectedType === 'boolean' && typeof value !== 'boolean') {
        throw new BadRequestException(`Flow input ${key} must be boolean`);
      }
      if (expectedType === 'string' && typeof value !== 'string') {
        throw new BadRequestException(`Flow input ${key} must be text`);
      }
      if (
        definition['format'] === 'email' &&
        typeof value === 'string' &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        throw new BadRequestException(`Flow input ${key} must be a valid email`);
      }
      if (
        definition['format'] === 'date' &&
        typeof value === 'string' &&
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        throw new BadRequestException(`Flow input ${key} must use YYYY-MM-DD`);
      }
    }
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

  private async validateDraftForVersion(auth: AuthContext, steps: FlowStep[]) {
    if (!steps.length) {
      throw new BadRequestException('Add at least one step before creating a version');
    }

    const knownKeys = new Set(['start', 'end', ...steps.map((step) => step.key)]);
    for (const step of steps) {
      const targets = [
        step.nextStepKey,
        step.onSuccessStepKey,
        step.onErrorStepKey,
        step.onTimeoutStepKey,
        step.onTrueStepKey,
        step.onFalseStepKey
      ].filter((value): value is string => Boolean(value));
      const missingTarget = targets.find((target) => !knownKeys.has(target));
      if (missingTarget) {
        throw new BadRequestException(`Step ${step.key} points to missing step ${missingTarget}`);
      }
      if (step.type === 'decision') {
        if (!step.onTrueStepKey || !step.onFalseStepKey || step.onTrueStepKey === step.onFalseStepKey) {
          throw new BadRequestException(`Decision step ${step.key} requires different true and false targets`);
        }
        this.expressions.validateRule((step.config ?? {})['rule']);
      }
      if (step.type === 'formula') {
        this.expressions.validateRule((step.config ?? {})['rule']);
      }
      if (step.type === 'validation') {
        this.expressions.validateValidationConfig(step.config ?? {});
      }
    }

    const serviceSteps = steps.filter((step) => step.type === 'dynamic_service');
    if (serviceSteps.length) {
      const services = (await this.dynamicServices.list(auth)) as Array<{
        key: string;
        active: boolean;
        publishedVersion?: unknown;
      }>;
      const available = new Set(
        services.filter((service) => service.active && service.publishedVersion).map((service) => service.key)
      );
      const unavailable = serviceSteps.find(
        (step) => !available.has(this.stringConfig(step.config ?? {}, 'serviceKey') ?? '')
      );
      if (unavailable) {
        throw new BadRequestException(`Step ${unavailable.key} requires an active published service`);
      }
    }
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

  private cleanMetadata(metadata?: Record<string, unknown> | null) {
    if (!metadata) {
      return null;
    }
    const inputFields = metadata['inputFields'];
    if (inputFields === undefined) {
      return metadata;
    }
    if (!Array.isArray(inputFields) || inputFields.length > 100) {
      throw new BadRequestException('Flow inputFields must be an array with at most 100 items');
    }
    const cleanedFields = inputFields.map((rawField) => {
      const field = this.asRecord(rawField);
      const key = typeof field['key'] === 'string' ? field['key'].trim() : '';
      if (!/^[a-z][a-z0-9_]{1,79}$/.test(key)) {
        throw new BadRequestException(`Invalid flow input key: ${key || 'empty'}`);
      }
      const type = typeof field['type'] === 'string' ? field['type'] : 'text';
      if (!['text', 'number', 'boolean', 'email', 'date'].includes(type)) {
        throw new BadRequestException(`Invalid flow input type for ${key}`);
      }
      return {
        key,
        label: typeof field['label'] === 'string' ? field['label'].trim().slice(0, 120) || key : key,
        type,
        required: field['required'] === true,
        example:
          field['example'] === undefined || field['example'] === null
            ? ''
            : String(field['example']).slice(0, 500)
      };
    });
    if (new Set(cleanedFields.map((field) => field.key)).size !== cleanedFields.length) {
      throw new BadRequestException('Flow input keys must be unique');
    }
    return {
      ...metadata,
      inputFields: cleanedFields
    };
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

  private expressionData(context: FlowExecutionContext): Record<string, unknown> {
    return {
      input: context.input,
      tenant: context.tenant,
      user: context.user,
      steps: context.steps
    };
  }

  private async executeDynamicServiceStep(
    auth: AuthContext,
    serviceKey: string,
    input: Record<string, unknown>,
    config: Record<string, unknown>
  ) {
    const maxTimeoutMs = this.confisys.get<number>('flow.maxStepTimeoutMs', 60000);
    const defaultTimeoutMs = this.confisys.get<number>('flow.defaultStepTimeoutMs', 8000);
    const timeoutMs = Math.min(
      Math.max(Number(config['timeoutMs']) || defaultTimeoutMs, 100),
      Math.max(maxTimeoutMs, 100)
    );
    const retry = this.asRecord(config['retry']);
    const maxAttempts = this.confisys.get<number>('flow.maxRetryAttempts', 5);
    const attempts = Math.min(Math.max(Number(retry['attempts']) || 0, 0), Math.max(maxAttempts, 0));
    const backoffMs = Math.min(Math.max(Number(retry['backoffMs']) || 0, 0), 30000);
    let lastRun: Awaited<ReturnType<DynamicServicesService['executeByKey']>> | undefined;

    for (let attempt = 0; attempt <= attempts; attempt += 1) {
      lastRun = await this.withTimeout(
        this.dynamicServices.executeByKey(auth, serviceKey, { context: input }),
        timeoutMs,
        `Service ${serviceKey} exceeded ${timeoutMs} ms`
      );
      if (lastRun.status === 'success' || attempt === attempts) {
        return lastRun;
      }
      if (backoffMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    return lastRun!;
  }

  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new BadRequestException(message)), timeoutMs);
        })
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private flowLimit(
    configured: number | undefined,
    confisysKey: string,
    fallback: number,
    minimum: number,
    maximum: number
  ) {
    const value = Number(configured ?? this.confisys.get<number>(confisysKey, fallback));
    return Math.min(Math.max(Number.isFinite(value) ? Math.floor(value) : fallback, minimum), maximum);
  }

  private assertFlowEnabled() {
    if (!this.confisys.get<boolean>('flow.enabled', true)) {
      throw new BadRequestException('Flow Engine is disabled for this environment');
    }
  }

  private failedPreview(
    steps: Array<Record<string, unknown>>,
    context: FlowExecutionContext,
    output: unknown,
    message: string
  ) {
    return {
      status: 'failed',
      output: this.asRecordOrValue(output),
      error: { message },
      context: { input: context.input, steps: context.steps },
      steps
    };
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

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private asRecordOrValue(value: unknown): Record<string, unknown> {
    return this.asRecord(value) === value ? (value as Record<string, unknown>) : { value };
  }
}

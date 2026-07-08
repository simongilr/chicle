import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import { DynamicServicesService } from '../dynamic-services/dynamic-services.service';
import { RbacService } from '../rbac/rbac.service';
import { FlowLiveEventsService } from './flow-live-events.service';
import { FlowOutboxEvent } from './flow-outbox-event.entity';
import { FlowRun, FlowRunTriggerType } from './flow-run.entity';
import { FlowExpressionEngine } from './flow-expression-engine.service';
import { FlowStepRun, FlowStepRunStatus } from './flow-step-run.entity';
import { FlowStep } from './flow-step.entity';
import {
  FlowTestAssertion,
  FlowTestAssertionOperator,
  FlowTestCase,
  FlowTestExpectedStatus,
  FlowTestTarget
} from './flow-test-case.entity';
import { FlowTemplate } from './flow-template.entity';
import { FlowTrigger, FlowTriggerType } from './flow-trigger.entity';
import { FlowVersion, FlowDefinition, FlowDefinitionStep, FlowStepType } from './flow-version.entity';
import { Flow, FlowRuntimeConfig } from './flow.entity';

const FLOW_STEP_TYPES: FlowStepType[] = [
  'start',
  'dynamic_service',
  'parallel',
  'foreach',
  'subflow',
  'delay',
  'emit_event',
  'formula',
  'validation',
  'decision',
  'action',
  'response',
  'end'
];
const SYSTEM_FLOW_TEMPLATE_OWNER = '00000000-0000-0000-0000-000000000000';

const SYSTEM_FLOW_TEMPLATES: Array<Pick<FlowTemplate, 'key' | 'name' | 'description' | 'category' | 'definition'>> = [
  {
    key: 'validate_request',
    name: 'Validar una solicitud',
    description: 'Valida un dato obligatorio y responde de forma explícita.',
    category: 'operaciones',
    definition: {
      schemaVersion: 1,
      flow: {
        description: 'Validar una solicitud antes de continuar',
        category: 'operaciones'
      },
      entry: { mode: 'direct', key: 'direct', config: {} },
      inputFields: [
        {
          key: 'value',
          label: 'Valor',
          type: 'text',
          required: true,
          example: 'ABC-123'
        }
      ],
      steps: [
        {
          key: 'validar_valor',
          name: 'Validar valor',
          type: 'validation',
          position: 10,
          outputKey: 'validacion',
          nextStepKey: 'respuesta',
          config: {
            field: 'input.value',
            operator: 'required',
            message: 'El valor es obligatorio'
          }
        },
        {
          key: 'respuesta',
          name: 'Responder',
          type: 'response',
          position: 20,
          outputKey: 'respuesta',
          config: {
            status: 'success',
            body: { ok: true, value: '{{input.value}}' }
          }
        }
      ],
      output: { stepKey: 'respuesta', responseTo: 'caller' }
    }
  },
  {
    key: 'calculate_total',
    name: 'Calcular un total',
    description: 'Calcula precio por cantidad y devuelve el resultado.',
    category: 'operaciones',
    definition: {
      schemaVersion: 1,
      flow: {
        description: 'Calcular el total a partir de precio y cantidad',
        category: 'operaciones'
      },
      entry: { mode: 'direct', key: 'direct', config: {} },
      inputFields: [
        {
          key: 'price',
          label: 'Precio',
          type: 'number',
          required: true,
          example: 25
        },
        {
          key: 'quantity',
          label: 'Cantidad',
          type: 'number',
          required: true,
          example: 2
        }
      ],
      steps: [
        {
          key: 'calcular_total',
          name: 'Calcular total',
          type: 'formula',
          position: 10,
          outputKey: 'total',
          nextStepKey: 'respuesta',
          config: {
            language: 'json_logic',
            rule: { '*': [{ var: 'input.price' }, { var: 'input.quantity' }] }
          }
        },
        {
          key: 'respuesta',
          name: 'Responder',
          type: 'response',
          position: 20,
          outputKey: 'respuesta',
          config: {
            status: 'success',
            body: { ok: true, total: '{{steps.total}}' }
          }
        }
      ],
      output: { stepKey: 'respuesta', responseTo: 'caller' }
    }
  },
  {
    key: 'event_reaction',
    name: 'Reaccionar a un evento',
    description: 'Recibe un evento durable y deja listo el recorrido.',
    category: 'eventos',
    definition: {
      schemaVersion: 1,
      flow: {
        description: 'Procesar un evento del sistema',
        category: 'eventos'
      },
      entry: { mode: 'record_event', key: 'record.created', config: {} },
      inputFields: [
        {
          key: 'record_id',
          label: 'ID del registro',
          type: 'text',
          required: true,
          example: 'record-id'
        }
      ],
      steps: [
        {
          key: 'respuesta',
          name: 'Confirmar recepción',
          type: 'response',
          position: 10,
          outputKey: 'respuesta',
          config: {
            status: 'success',
            body: { accepted: true, recordId: '{{input.record_id}}' }
          }
        }
      ],
      output: { stepKey: 'respuesta', responseTo: 'caller' }
    }
  }
];

class FlowStepTimeoutError extends Error {}

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

export interface FlowDefinitionReplaceRequest {
  flow?: FlowUpsertRequest;
  entry?: {
    mode?: 'direct' | FlowTriggerType;
    key?: string;
    config?: Record<string, unknown> | null;
  };
  inputFields?: unknown[];
  steps?: FlowStepRequest[];
  output?: {
    stepKey?: string | null;
    responseTo?: 'caller';
  };
}

export interface FlowJsonAuthoringRequest {
  document?: FlowDefinitionReplaceRequest;
  definition?: FlowDefinitionReplaceRequest;
  publish?: boolean;
}

export interface FlowExecuteRequest {
  input?: Record<string, unknown>;
  triggerType?: FlowRunTriggerType;
  triggerKey?: string | null;
}

export interface FlowPreviewRequest extends FlowExecuteRequest {
  throughStepKey?: string | null;
}

export interface FlowTestCaseRequest {
  name?: string;
  input?: Record<string, unknown>;
  expectedOutput?: Record<string, unknown> | null;
  expectedStatus?: FlowTestExpectedStatus;
  target?: FlowTestTarget;
  throughStepKey?: string | null;
  assertions?: FlowTestAssertion[] | null;
  active?: boolean;
}

export interface FlowTriggerRequest {
  type?: FlowTriggerType;
  key?: string;
  config?: Record<string, unknown> | null;
  active?: boolean;
}

export interface FlowDuplicateRequest {
  key?: string;
  name?: string;
  versionId?: string | null;
}

export interface FlowTemplateCreateRequest {
  key?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
}

export interface FlowTemplateInstantiateRequest {
  key?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
}

export interface FlowMetricsQuery {
  status?: FlowRun['status'];
  triggerType?: FlowRunTriggerType;
  from?: string;
  to?: string;
  limit?: string | number;
}

interface FlowExecutionContext {
  tenant: AuthContext['tenant'];
  user: AuthContext['user'];
  input: Record<string, unknown>;
  steps: Record<string, unknown>;
  lastOutput?: unknown;
  flowStack: string[];
  compensations: Array<{
    serviceKey: string;
    input: Record<string, unknown>;
  }>;
}

interface FlowExecutionOptions {
  parentRunId?: string | null;
  rootRunId?: string | null;
  flowStack?: string[];
}

interface FlowStepExecutionMeta {
  mode: 'preview' | 'run';
  runId?: string;
  rootRunId?: string;
}

@Injectable()
export class FlowsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FlowsService.name);

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
    @InjectRepository(FlowTestCase)
    private readonly testCases: Repository<FlowTestCase>,
    @InjectRepository(FlowTemplate)
    private readonly templates: Repository<FlowTemplate>,
    @InjectRepository(FlowTrigger)
    private readonly triggers: Repository<FlowTrigger>,
    @InjectRepository(FlowOutboxEvent)
    private readonly outbox: Repository<FlowOutboxEvent>,
    private readonly dynamicServices: DynamicServicesService,
    private readonly expressions: FlowExpressionEngine,
    private readonly confisys: ConfisysService,
    private readonly audit: AuditService,
    private readonly live: FlowLiveEventsService,
    private readonly rbac: RbacService
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.seedSystemTemplates();
    } catch (error) {
      this.logger.warn(`Flow templates are not available yet: ${error instanceof Error ? error.message : error}`);
    }
  }

  async list(auth: AuthContext) {
    const flows = await this.flows.find({
      where: { tenantId: auth.tenant.id, trashedAt: IsNull() },
      order: { updatedAt: 'DESC' }
    });
    return this.withDetails(auth, flows);
  }

  async listAvailable(auth: AuthContext) {
    const flows = await this.flows.find({
      where: {
        tenantId: auth.tenant.id,
        status: 'active',
        trashedAt: IsNull()
      },
      order: { name: 'ASC' }
    });
    const published = flows.filter((flow) => Boolean(flow.publishedVersionId));
    const allowedIds = new Set(
      await this.rbac.filterAccessibleResourceIds(
        auth,
        'flow',
        published.map((flow) => flow.id)
      )
    );
    return published
      .filter((flow) => allowedIds.has(flow.id))
      .map((flow) => ({
        id: flow.id,
        key: flow.key,
        name: flow.name,
        description: flow.description,
        category: flow.category,
        publishedVersionId: flow.publishedVersionId
      }));
  }

  async listTemplates(auth: AuthContext) {
    await this.seedSystemTemplates();
    return this.templates.find({
      where: [
        { tenantId: IsNull(), scope: 'system', active: true },
        { tenantId: auth.tenant.id, scope: 'tenant', active: true }
      ],
      order: { scope: 'ASC', name: 'ASC' }
    });
  }

  async instantiateTemplate(auth: AuthContext, templateId: string, request: FlowTemplateInstantiateRequest) {
    const template = await this.requireTemplate(auth, templateId);
    const definition = this.asRecord(template.definition) as FlowDefinitionReplaceRequest;
    const flowDefinition = this.asRecord(definition.flow);
    const description =
      request.description !== undefined
        ? request.description
        : (this.optionalString(flowDefinition['description']) ?? template.description);
    const category =
      request.category !== undefined
        ? request.category
        : (this.optionalString(flowDefinition['category']) ?? template.category);
    const flow = await this.create(auth, {
      key: request.key,
      name: request.name,
      description,
      category,
      metadata: { templateId: template.id, templateKey: template.key }
    });

    try {
      const created = await this.replaceDefinition(auth, flow.id, {
        ...definition,
        flow: {
          ...definition.flow,
          name: request.name,
          description,
          category
        }
      });
      await this.audit.record({
        auth,
        action: 'flow.template.instantiated',
        resourceType: 'flow',
        resourceId: flow.id,
        metadata: { templateId: template.id, templateKey: template.key }
      });
      return created;
    } catch (error) {
      await this.flows.delete({ id: flow.id, tenantId: auth.tenant.id });
      throw error;
    }
  }

  async saveAsTemplate(auth: AuthContext, flowId: string, request: FlowTemplateCreateRequest) {
    const flow = await this.requireFlow(auth, flowId);
    const key = this.normalizeKey(request.key);
    const existing = await this.templates.findOne({
      where: { tenantId: auth.tenant.id, key }
    });
    if (existing) {
      throw new BadRequestException('Flow template key already exists');
    }
    const steps = await this.listDraftSteps(auth, flow.id);
    const template = await this.templates.save(
      this.templates.create({
        tenantId: auth.tenant.id,
        ownerKey: auth.tenant.id,
        key,
        name: this.cleanName(request.name),
        description: request.description?.trim() || flow.description || null,
        category: request.category?.trim() || flow.category || null,
        scope: 'tenant',
        definition: this.authoringDocumentForFlow(flow, steps),
        active: true,
        sourceFlowId: flow.id,
        createdByUserId: auth.user.id
      })
    );
    await this.audit.record({
      auth,
      action: 'flow.template.created',
      resourceType: 'flow_template',
      resourceId: template.id,
      metadata: { flowId: flow.id, key: template.key }
    });
    return template;
  }

  async deleteTemplate(auth: AuthContext, templateId: string) {
    const template = await this.templates.findOne({
      where: { id: templateId, tenantId: auth.tenant.id, scope: 'tenant' }
    });
    if (!template) {
      throw new NotFoundException('Flow template not found');
    }
    await this.templates.delete({ id: template.id, tenantId: auth.tenant.id });
    await this.audit.record({
      auth,
      action: 'flow.template.deleted',
      resourceType: 'flow_template',
      resourceId: template.id,
      metadata: { key: template.key }
    });
    return { deleted: true };
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

  async duplicate(auth: AuthContext, flowId: string, request: FlowDuplicateRequest) {
    const source = await this.requireFlow(auth, flowId);
    const key = this.normalizeKey(request.key);
    const name = this.cleanName(request.name);
    const sourceVersion = request.versionId ? await this.requireVersion(auth, source.id, request.versionId) : null;
    const sourceSteps = await this.steps.find({
      where: {
        tenantId: auth.tenant.id,
        flowId: source.id,
        versionId: sourceVersion ? sourceVersion.id : IsNull()
      },
      order: { position: 'ASC', createdAt: 'ASC' }
    });
    if (!sourceSteps.length) {
      throw new BadRequestException('The selected flow or version has no editable steps');
    }

    const duplicate = await this.flows.manager.transaction(async (manager) => {
      const created = await manager.save(
        Flow,
        manager.create(Flow, {
          tenantId: auth.tenant.id,
          key,
          name,
          description: sourceVersion?.definition.description ?? source.description,
          category: source.category,
          status: 'draft',
          publishedVersionId: null,
          runtimeConfig: sourceVersion?.runtimeConfig ?? source.runtimeConfig,
          tags: source.tags,
          metadata: {
            ...(source.metadata ?? {}),
            duplicatedFromFlowId: source.id,
            duplicatedFromVersionId: sourceVersion?.id ?? null
          }
        })
      );
      await manager.save(
        FlowStep,
        sourceSteps.map((step) =>
          manager.create(FlowStep, {
            tenantId: auth.tenant.id,
            flowId: created.id,
            versionId: null,
            ...this.copyStepValues(step)
          })
        )
      );
      return created;
    });

    await this.audit.record({
      auth,
      action: 'flow.duplicated',
      resourceType: 'flow',
      resourceId: duplicate.id,
      metadata: {
        sourceFlowId: source.id,
        sourceVersionId: sourceVersion?.id ?? null,
        key: duplicate.key
      }
    });
    return this.get(auth, duplicate.id);
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
        onErrorStepKey:
          request.onErrorStepKey !== undefined ? request.onErrorStepKey?.trim() || null : step.onErrorStepKey,
        onTimeoutStepKey:
          request.onTimeoutStepKey !== undefined ? request.onTimeoutStepKey?.trim() || null : step.onTimeoutStepKey,
        onTrueStepKey: request.onTrueStepKey !== undefined ? request.onTrueStepKey?.trim() || null : step.onTrueStepKey,
        onFalseStepKey:
          request.onFalseStepKey !== undefined ? request.onFalseStepKey?.trim() || null : step.onFalseStepKey,
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
    await this.steps.delete({
      id: step.id,
      tenantId: auth.tenant.id,
      flowId: flow.id
    });

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

  async replaceDefinition(auth: AuthContext, flowId: string, request: FlowDefinitionReplaceRequest) {
    const flow = await this.requireFlow(auth, flowId);
    const draftSteps = this.cleanAuthoringSteps(request.steps);
    const flowRequest = request.flow ?? {};
    const requestedEntryMode = request.entry?.mode ?? 'direct';
    const entryModes = ['direct', 'http', 'form_submit', 'record_event', 'schedule', 'manual'];
    if (!entryModes.includes(requestedEntryMode)) {
      throw new BadRequestException('Invalid authoring entry mode');
    }
    const entryMode = requestedEntryMode;
    const entryKey = entryMode === 'direct' ? 'direct' : this.cleanTriggerKey(request.entry?.key);
    const outputStepKey = request.output?.stepKey?.trim() || null;
    if (outputStepKey) {
      const outputStep = draftSteps.find((step) => step.key === outputStepKey);
      if (!outputStep || outputStep.type !== 'response') {
        throw new BadRequestException('Flow output must reference a response step');
      }
    }
    const { secret: _secret, secretHash: _secretHash, ...entryConfig } = request.entry?.config ?? {};
    const metadata = this.cleanMetadata({
      ...(flow.metadata ?? {}),
      inputFields: request.inputFields ?? flow.metadata?.['inputFields'] ?? [],
      authoringEntry: {
        mode: entryMode,
        key: entryKey,
        config: entryConfig
      },
      authoringOutput: {
        stepKey: outputStepKey,
        responseTo: 'caller'
      }
    });

    await this.flows.manager.transaction(async (manager) => {
      await manager.save(
        Flow,
        manager.merge(Flow, flow, {
          name: flowRequest.name ? this.cleanName(flowRequest.name) : flow.name,
          description:
            flowRequest.description !== undefined ? flowRequest.description?.trim() || null : flow.description,
          category: flowRequest.category !== undefined ? flowRequest.category?.trim() || null : flow.category,
          runtimeConfig:
            flowRequest.runtimeConfig !== undefined ? flowRequest.runtimeConfig : (flow.runtimeConfig ?? null),
          tags: flowRequest.tags !== undefined ? this.cleanTags(flowRequest.tags) : (flow.tags ?? null),
          metadata
        })
      );
      await manager.delete(FlowStep, {
        tenantId: auth.tenant.id,
        flowId: flow.id,
        versionId: IsNull()
      });
      if (draftSteps.length) {
        await manager.save(
          FlowStep,
          draftSteps.map((step) =>
            manager.create(FlowStep, {
              tenantId: auth.tenant.id,
              flowId: flow.id,
              versionId: null,
              ...step
            })
          )
        );
      }
    });

    await this.audit.record({
      auth,
      action: 'flow.definition.replaced',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: {
        steps: draftSteps.length,
        entryMode,
        outputStepKey: request.output?.stepKey ?? null
      }
    });

    return this.get(auth, flow.id);
  }

  async upsertFromJson(auth: AuthContext, request: FlowJsonAuthoringRequest) {
    const definition = request.document ?? request.definition;
    if (!definition?.flow) {
      throw new BadRequestException('document.flow is required');
    }
    const key = this.normalizeKey(definition.flow.key);
    const name = this.cleanName(definition.flow.name);
    const existing = await this.flows.findOne({
      where: { tenantId: auth.tenant.id, key }
    });
    const flow = existing
      ? await this.update(auth, existing.id, {
          ...definition.flow,
          key,
          name
        })
      : await this.create(auth, {
          ...definition.flow,
          key,
          name
        });
    const savedFlow = await this.replaceDefinition(auth, flow.id, definition);
    let version: FlowVersion | null = null;
    if (request.publish) {
      version = await this.createVersion(auth, flow.id);
      version = await this.publishVersion(auth, flow.id, version.id);
    }
    return {
      artifactType: 'flow',
      id: savedFlow.id,
      key: savedFlow.key,
      flow: savedFlow,
      version,
      published: Boolean(request.publish)
    };
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

  async restoreVersionDraft(auth: AuthContext, flowId: string, versionId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const version = await this.requireVersion(auth, flow.id, versionId);
    const snapshots = await this.steps.find({
      where: {
        tenantId: auth.tenant.id,
        flowId: flow.id,
        versionId: version.id
      },
      order: { position: 'ASC', createdAt: 'ASC' }
    });
    if (!snapshots.length) {
      throw new BadRequestException('Version snapshot has no steps');
    }
    const responseStep = version.definition.steps.find((step) => step.type === 'response');
    const metadata = this.cleanMetadata({
      ...(flow.metadata ?? {}),
      inputFields: this.inputFieldsFromSchema(version.inputSchema ?? version.definition.inputSchema),
      authoringOutput: {
        stepKey: responseStep?.key ?? null,
        responseTo: 'caller'
      },
      restoredFromVersionId: version.id,
      restoredFromVersion: version.version
    });

    await this.flows.manager.transaction(async (manager) => {
      await manager.delete(FlowStep, {
        tenantId: auth.tenant.id,
        flowId: flow.id,
        versionId: IsNull()
      });
      await manager.save(
        FlowStep,
        snapshots.map((step) =>
          manager.create(FlowStep, {
            tenantId: auth.tenant.id,
            flowId: flow.id,
            versionId: null,
            ...this.copyStepValues(step)
          })
        )
      );
      await manager.save(
        Flow,
        manager.merge(Flow, flow, {
          name: version.definition.name,
          description: version.definition.description ?? null,
          runtimeConfig: version.runtimeConfig ?? null,
          metadata
        })
      );
    });
    await this.audit.record({
      auth,
      action: 'flow.version.restored_to_draft',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { versionId: version.id, version: version.version }
    });
    return this.get(auth, flow.id);
  }

  async compareVersions(auth: AuthContext, flowId: string, versionId: string, otherVersionId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const [left, right] = await Promise.all([
      this.requireVersion(auth, flow.id, versionId),
      this.requireVersion(auth, flow.id, otherVersionId)
    ]);
    const changes = this.definitionChanges(left.definition, right.definition);
    const leftSteps = new Map(left.definition.steps.map((step) => [step.key, step]));
    const rightSteps = new Map(right.definition.steps.map((step) => [step.key, step]));
    return {
      left: { id: left.id, version: left.version, status: left.status },
      right: { id: right.id, version: right.version, status: right.status },
      summary: {
        changed: changes.length > 0,
        changeCount: changes.length,
        addedSteps: [...rightSteps.keys()].filter((key) => !leftSteps.has(key)),
        removedSteps: [...leftSteps.keys()].filter((key) => !rightSteps.has(key)),
        changedSteps: [...leftSteps.keys()].filter(
          (key) => rightSteps.has(key) && JSON.stringify(leftSteps.get(key)) !== JSON.stringify(rightSteps.get(key))
        )
      },
      changes
    };
  }

  async listRuns(auth: AuthContext, flowId: string, query: FlowMetricsQuery = {}) {
    const flow = await this.requireFlow(auth, flowId);
    const filters = this.cleanMetricsQuery(query);
    const builder = this.runs
      .createQueryBuilder('run')
      .where('run.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .andWhere('run.flowId = :flowId', { flowId: flow.id })
      .orderBy('run.createdAt', 'DESC')
      .take(filters.limit);
    this.applyRunFilters(builder, filters);
    const runs = await builder.getMany();
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

  async observability(auth: AuthContext, flowId: string, query: FlowMetricsQuery = {}) {
    const flow = await this.requireFlow(auth, flowId);
    const filters = this.cleanMetricsQuery({
      ...query,
      limit: Math.min(Number(query.limit) || 5000, 5000)
    });
    const builder = this.runs
      .createQueryBuilder('run')
      .where('run.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .andWhere('run.flowId = :flowId', { flowId: flow.id })
      .orderBy('run.createdAt', 'DESC')
      .take(filters.limit);
    this.applyRunFilters(builder, filters);
    const runs = await builder.getMany();
    const runIds = runs.map((run) => run.id);
    const stepRuns = runIds.length
      ? await this.stepRuns
          .createQueryBuilder('step')
          .where('step.tenantId = :tenantId', { tenantId: auth.tenant.id })
          .andWhere('step.runId IN (:...runIds)', { runIds })
          .getMany()
      : [];
    const durations = runs
      .map((run) => run.durationMs)
      .filter((value): value is number => typeof value === 'number')
      .sort((left, right) => left - right);
    const statuses = this.countBy(runs, (run) => run.status);
    const triggers = this.countBy(runs, (run) => run.triggerType);
    const stepGroups = new Map<string, FlowStepRun[]>();
    for (const step of stepRuns) {
      stepGroups.set(step.stepKey, [...(stepGroups.get(step.stepKey) ?? []), step]);
    }
    const steps = [...stepGroups.entries()]
      .map(([stepKey, items]) => {
        const stepDurations = items
          .map((item) => item.durationMs)
          .filter((value): value is number => typeof value === 'number')
          .sort((left, right) => left - right);
        const failed = items.filter((item) => item.status === 'failed' || item.status === 'timeout').length;
        return {
          stepKey,
          stepName: items[0]?.stepName ?? stepKey,
          stepType: items[0]?.stepType ?? 'unknown',
          executions: items.length,
          failed,
          failureRate: items.length ? Number(((failed / items.length) * 100).toFixed(2)) : 0,
          averageDurationMs: this.average(stepDurations),
          p95DurationMs: this.percentile(stepDurations, 95)
        };
      })
      .sort((left, right) => right.failureRate - left.failureRate || right.p95DurationMs - left.p95DurationMs);
    const successful = statuses['success'] ?? 0;
    return {
      flow: { id: flow.id, key: flow.key, name: flow.name },
      filters: {
        status: filters.status ?? null,
        triggerType: filters.triggerType ?? null,
        from: filters.from?.toISOString() ?? null,
        to: filters.to?.toISOString() ?? null,
        sampleLimit: filters.limit
      },
      summary: {
        total: runs.length,
        success: successful,
        failed: statuses['failed'] ?? 0,
        timeout: statuses['timeout'] ?? 0,
        cancelled: statuses['cancelled'] ?? 0,
        successRate: runs.length ? Number(((successful / runs.length) * 100).toFixed(2)) : 0,
        averageDurationMs: this.average(durations),
        p50DurationMs: this.percentile(durations, 50),
        p95DurationMs: this.percentile(durations, 95)
      },
      statuses,
      triggers,
      steps,
      recentErrors: runs
        .filter((run) => run.error)
        .slice(0, 20)
        .map((run) => ({
          runId: run.id,
          status: run.status,
          triggerType: run.triggerType,
          triggerKey: run.triggerKey,
          durationMs: run.durationMs,
          error: run.error,
          createdAt: run.createdAt
        }))
    };
  }

  async listTestCases(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    return this.testCases.find({
      where: { tenantId: auth.tenant.id, flowId: flow.id },
      order: { updatedAt: 'DESC' }
    });
  }

  async createTestCase(auth: AuthContext, flowId: string, request: FlowTestCaseRequest) {
    const flow = await this.requireFlow(auth, flowId);
    const testCase = await this.testCases.save(
      this.testCases.create({
        tenantId: auth.tenant.id,
        flowId: flow.id,
        versionId: null,
        name: this.cleanName(request.name),
        input: this.asRecord(request.input),
        expectedOutput:
          request.expectedOutput === undefined || request.expectedOutput === null
            ? null
            : this.asRecord(request.expectedOutput),
        expectedStatus: this.cleanTestExpectedStatus(request.expectedStatus),
        target: this.cleanTestTarget(request.target),
        throughStepKey: request.throughStepKey?.trim() || null,
        assertions: this.cleanTestAssertions(request.assertions),
        active: request.active ?? true
      })
    );

    await this.audit.record({
      auth,
      action: 'flow.test_case.created',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { testCaseId: testCase.id, name: testCase.name }
    });
    return testCase;
  }

  async updateTestCase(auth: AuthContext, flowId: string, testCaseId: string, request: FlowTestCaseRequest) {
    const flow = await this.requireFlow(auth, flowId);
    const testCase = await this.requireTestCase(auth, flow.id, testCaseId);
    const saved = await this.testCases.save(
      this.testCases.merge(testCase, {
        name: request.name !== undefined ? this.cleanName(request.name) : testCase.name,
        input: request.input !== undefined ? this.asRecord(request.input) : testCase.input,
        expectedOutput:
          request.expectedOutput !== undefined
            ? request.expectedOutput === null
              ? null
              : this.asRecord(request.expectedOutput)
            : testCase.expectedOutput,
        expectedStatus:
          request.expectedStatus !== undefined
            ? this.cleanTestExpectedStatus(request.expectedStatus)
            : testCase.expectedStatus,
        target: request.target !== undefined ? this.cleanTestTarget(request.target) : testCase.target,
        throughStepKey:
          request.throughStepKey !== undefined ? request.throughStepKey?.trim() || null : testCase.throughStepKey,
        assertions:
          request.assertions !== undefined ? this.cleanTestAssertions(request.assertions) : testCase.assertions,
        active: request.active ?? testCase.active
      })
    );

    await this.audit.record({
      auth,
      action: 'flow.test_case.updated',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { testCaseId: saved.id, name: saved.name }
    });
    return saved;
  }

  async deleteTestCase(auth: AuthContext, flowId: string, testCaseId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const testCase = await this.requireTestCase(auth, flow.id, testCaseId);
    await this.testCases.delete({
      id: testCase.id,
      tenantId: auth.tenant.id,
      flowId: flow.id
    });
    await this.audit.record({
      auth,
      action: 'flow.test_case.deleted',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { testCaseId: testCase.id, name: testCase.name }
    });
    return { ok: true };
  }

  async runTestCase(auth: AuthContext, flowId: string, testCaseId: string) {
    const flow = await this.requireFlow(auth, flowId);
    await this.assertResourceAccess(auth, flow.id);
    const testCase = await this.requireTestCase(auth, flow.id, testCaseId);
    const result = await this.executeTestCase(auth, flow, testCase);
    await this.testCases.update(
      { id: testCase.id, tenantId: auth.tenant.id },
      { lastResult: result as any, lastRunAt: new Date() }
    );
    return { testCaseId: testCase.id, testCaseName: testCase.name, ...result };
  }

  async runTestSuite(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    await this.assertResourceAccess(auth, flow.id);
    const testCases = await this.testCases.find({
      where: { tenantId: auth.tenant.id, flowId: flow.id, active: true },
      order: { createdAt: 'ASC' }
    });
    if (!testCases.length) {
      throw new BadRequestException('Add at least one active test case before running the suite');
    }

    const results = [];
    for (const testCase of testCases) {
      const result = await this.executeTestCase(auth, flow, testCase);
      await this.testCases.update(
        { id: testCase.id, tenantId: auth.tenant.id },
        { lastResult: result as any, lastRunAt: new Date() }
      );
      results.push({
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        ...result
      });
    }
    return {
      flowId: flow.id,
      total: results.length,
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length,
      results
    };
  }

  async listTriggers(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const triggers = await this.triggers.find({
      where: { tenantId: auth.tenant.id, flowId: flow.id },
      order: { createdAt: 'ASC' }
    });
    return triggers.map((trigger) => this.publicTrigger(trigger));
  }

  async createTrigger(auth: AuthContext, flowId: string, request: FlowTriggerRequest) {
    const flow = await this.requireFlow(auth, flowId);
    if (!flow.publishedVersionId || flow.status !== 'active') {
      throw new BadRequestException('Publish and activate the flow before creating triggers');
    }
    const type = this.cleanTriggerType(request.type);
    const key = this.cleanTriggerKey(request.key);
    await this.assertTriggerKeyAvailable(auth, type, key);
    const config = this.cleanTriggerConfig(type, request.config);
    const active = request.active ?? true;
    const trigger = await this.triggers.save(
      this.triggers.create({
        tenantId: auth.tenant.id,
        flowId: flow.id,
        versionId: flow.publishedVersionId ?? null,
        type,
        key,
        config,
        active,
        nextFireAt: active && type === 'schedule' ? this.nextTriggerDate(config) : null,
        lastFiredAt: null,
        createdByUserId: auth.user.id
      })
    );
    await this.audit.record({
      auth,
      action: 'flow.trigger.created',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { triggerId: trigger.id, type, key }
    });
    return this.publicTrigger(trigger);
  }

  async updateTrigger(auth: AuthContext, flowId: string, triggerId: string, request: FlowTriggerRequest) {
    const flow = await this.requireFlow(auth, flowId);
    const trigger = await this.requireTrigger(auth, flow.id, triggerId);
    const type = request.type ? this.cleanTriggerType(request.type) : trigger.type;
    const key = request.key ? this.cleanTriggerKey(request.key) : trigger.key;
    if ((type !== trigger.type || key !== trigger.key) && ['http', 'manual'].includes(type)) {
      await this.assertTriggerKeyAvailable(auth, type, key, trigger.id);
    }
    const config =
      request.config !== undefined ? this.cleanTriggerConfig(type, request.config, trigger.config) : trigger.config;
    const active = request.active ?? trigger.active;
    const saved = await this.triggers.save(
      this.triggers.merge(trigger, {
        type,
        key,
        config,
        active,
        versionId: flow.publishedVersionId ?? trigger.versionId,
        nextFireAt: type === 'schedule' && active ? (trigger.nextFireAt ?? this.nextTriggerDate(config)) : null
      })
    );
    await this.audit.record({
      auth,
      action: 'flow.trigger.updated',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: {
        triggerId: saved.id,
        type: saved.type,
        key: saved.key,
        active: saved.active
      }
    });
    return this.publicTrigger(saved);
  }

  async deleteTrigger(auth: AuthContext, flowId: string, triggerId: string) {
    const flow = await this.requireFlow(auth, flowId);
    const trigger = await this.requireTrigger(auth, flow.id, triggerId);
    await this.triggers.delete({
      id: trigger.id,
      tenantId: auth.tenant.id,
      flowId: flow.id
    });
    await this.audit.record({
      auth,
      action: 'flow.trigger.deleted',
      resourceType: 'flow',
      resourceId: flow.id,
      metadata: { triggerId: trigger.id, type: trigger.type, key: trigger.key }
    });
    return { ok: true };
  }

  async executeByKey(auth: AuthContext, flowKey: string, request: FlowExecuteRequest) {
    const flow = await this.requireFlowByKey(auth, this.normalizeKey(flowKey));
    await this.assertResourceAccess(auth, flow.id);
    return this.executePublishedFlow(auth, flow, request);
  }

  async assertCanExecute(auth: AuthContext, flowId: string) {
    const flow = await this.requireFlow(auth, flowId);
    await this.assertResourceAccess(auth, flow.id);
    return flow;
  }

  async execute(
    auth: AuthContext,
    flowId: string,
    request: FlowExecuteRequest,
    options: { skipResourceAccess?: boolean } = {}
  ) {
    const flow = await this.requireFlow(auth, flowId);
    if (!options.skipResourceAccess) {
      await this.assertResourceAccess(auth, flow.id);
    }
    return this.executePublishedFlow(auth, flow, request);
  }

  async preview(auth: AuthContext, flowId: string, request: FlowPreviewRequest) {
    this.assertFlowEnabled();
    const flow = await this.requireFlow(auth, flowId);
    await this.assertResourceAccess(auth, flow.id);
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
    return this.previewDefinition(auth, flow, definition, previewInput, throughStepKey, [flow.key]);
  }

  private async previewDefinition(
    auth: AuthContext,
    flow: Flow,
    definition: FlowDefinition,
    previewInput: Record<string, unknown>,
    throughStepKey: string | null,
    flowStack: string[]
  ) {
    const byKey = new Map<string, FlowDefinitionStep>(definition.steps.map((step) => [step.key, step]));
    const context: FlowExecutionContext = {
      tenant: auth.tenant,
      user: auth.user,
      input: previewInput,
      steps: {},
      flowStack,
      compensations: []
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
        const result = await this.executeStep(auth, step, input, context, {
          mode: 'preview'
        });
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
          status: result.status ?? 'success',
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
        const timedOut = error instanceof FlowStepTimeoutError;
        const branchKey = timedOut ? step.onTimeout : step.onError;
        const failureOutput = { ok: false, timeout: timedOut, error: message };
        context.lastOutput = failureOutput;
        context.steps[step.outputKey || step.key] = failureOutput;
        results.push({
          stepKey: step.key,
          stepName: step.name ?? step.key,
          stepType: step.type,
          status: timedOut ? 'timeout' : 'failed',
          durationMs: Date.now() - started,
          input,
          error: { message }
        });
        if (branchKey) {
          output = failureOutput;
          currentKey = branchKey;
          continue;
        }
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

  private async executePublishedFlow(
    auth: AuthContext,
    flow: Flow,
    request: FlowExecuteRequest,
    options: FlowExecutionOptions = {}
  ) {
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
        parentRunId: options.parentRunId ?? null,
        rootRunId: options.rootRunId ?? null,
        triggerType: request.triggerType ?? 'test',
        triggerKey: request.triggerKey?.trim() || null,
        status: 'running',
        input,
        startedAt: new Date(),
        createdByUserId: auth.user.id
      })
    );
    const rootRunId = options.rootRunId ?? run.id;
    if (!run.rootRunId) {
      await this.runs.update({ id: run.id, tenantId: auth.tenant.id }, { rootRunId });
      run.rootRunId = rootRunId;
    }
    this.live.emit({
      tenantId: auth.tenant.id,
      type: 'flow.run.running',
      flowId: flow.id,
      runId: run.id,
      data: {
        version: version.version,
        triggerType: run.triggerType,
        triggerKey: run.triggerKey
      }
    });

    const context: FlowExecutionContext = {
      tenant: auth.tenant,
      user: auth.user,
      input,
      steps: {},
      flowStack: options.flowStack ?? [flow.key],
      compensations: []
    };

    try {
      const output = await this.runDefinition(auth, flow, version, run.id, rootRunId, context);
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
      this.live.emit({
        tenantId: auth.tenant.id,
        type: 'flow.run.success',
        flowId: flow.id,
        runId: run.id,
        data: { durationMs: Date.now() - started }
      });
      return this.runWithSteps(auth, run.id);
    } catch (error) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : 'Unknown flow execution error';
      const compensation = await this.runCompensations(auth, context);
      await this.runs.update(
        { id: run.id, tenantId: auth.tenant.id },
        {
          status: 'failed',
          error: { message, compensation },
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
      this.live.emit({
        tenantId: auth.tenant.id,
        type: 'flow.run.failed',
        flowId: flow.id,
        runId: run.id,
        data: { durationMs: Date.now() - started, error: message }
      });
      return this.runWithSteps(auth, run.id);
    }
  }

  private async runDefinition(
    auth: AuthContext,
    flow: Flow,
    version: FlowVersion,
    runId: string,
    rootRunId: string,
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

      const result = await this.runStep(auth, flow, version, runId, rootRunId, step, context);
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
    rootRunId: string,
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
    this.live.emit({
      tenantId: auth.tenant.id,
      type: 'flow.step.running',
      flowId: flow.id,
      runId,
      data: {
        stepKey: step.key,
        stepName: step.name ?? step.key,
        stepType: step.type
      }
    });

    try {
      const result = await this.executeStep(auth, step, input, context, {
        mode: 'run',
        runId,
        rootRunId
      });
      const outputKey = step.outputKey || step.key;
      if (result.output !== undefined) {
        context.steps[outputKey] = result.output;
      }
      await this.finishStepRun(auth, stepRun.id, result.status ?? 'success', started, {
        output: this.asRecordOrValue(result.output)
      });
      this.live.emit({
        tenantId: auth.tenant.id,
        type: `flow.step.${result.status ?? 'success'}`,
        flowId: flow.id,
        runId,
        data: {
          stepKey: step.key,
          stepName: step.name ?? step.key,
          durationMs: Date.now() - started
        }
      });
      return {
        output: result.output,
        nextKey: result.nextKey ?? this.nextStepKey(step, true)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown step execution error';
      const timedOut = error instanceof FlowStepTimeoutError;
      await this.finishStepRun(auth, stepRun.id, timedOut ? 'timeout' : 'failed', started, { error: { message } });
      this.live.emit({
        tenantId: auth.tenant.id,
        type: timedOut ? 'flow.step.timeout' : 'flow.step.failed',
        flowId: flow.id,
        runId,
        data: {
          stepKey: step.key,
          stepName: step.name ?? step.key,
          durationMs: Date.now() - started,
          error: message
        }
      });
      const branchKey = timedOut ? step.onTimeout : step.onError;
      if (branchKey) {
        return {
          output: { ok: false, timeout: timedOut, error: message },
          nextKey: branchKey
        };
      }
      throw error;
    }
  }

  private async executeStep(
    auth: AuthContext,
    step: FlowDefinitionStep,
    input: Record<string, unknown>,
    context: FlowExecutionContext,
    execution: FlowStepExecutionMeta
  ): Promise<{
    output?: unknown;
    nextKey?: string;
    status?: FlowStepRunStatus;
  }> {
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
        if (!ok && !step.onError) {
          const message = serviceRun.error || `Service ${serviceKey} failed`;
          throw new BadRequestException(message);
        }
        const output = {
          ok,
          status: serviceRun.status,
          durationMs: serviceRun.durationMs,
          response: serviceRun.responseSnapshot ?? null,
          error: serviceRun.error ?? null
        };
        const compensationServiceKey = this.stringConfig(config, 'compensationServiceKey');
        if (ok && compensationServiceKey && execution.mode === 'run') {
          context.compensations.push({
            serviceKey: compensationServiceKey,
            input: {
              ...input,
              result: serviceRun.responseSnapshot ?? null
            }
          });
        }
        return {
          output,
          nextKey: ok ? this.nextStepKey(step, true) : step.onError,
          status: ok ? 'success' : 'failed'
        };
      }
      case 'parallel': {
        const output = await this.executeParallelStep(auth, step, input, context);
        if (!output.ok && !step.onError) {
          throw new BadRequestException(`Parallel step ${step.key} has failed branches`);
        }
        return {
          output,
          status: output.ok ? 'success' : 'failed',
          nextKey: output.ok ? this.nextStepKey(step, true) : step.onError
        };
      }
      case 'foreach': {
        const output = await this.executeForeachStep(auth, step, input, context);
        if (!output.ok && !step.onError) {
          throw new BadRequestException(`Foreach step ${step.key} has failed items`);
        }
        return {
          output,
          status: output.ok ? 'success' : 'failed',
          nextKey: output.ok ? this.nextStepKey(step, true) : step.onError
        };
      }
      case 'subflow': {
        const output = await this.executeSubflowStep(auth, step, input, context, execution);
        return { output, nextKey: this.nextStepKey(step, true) };
      }
      case 'delay': {
        const configuredMs = Number((step.config ?? {})['durationMs']) || 0;
        const maximum = this.confisys.get<number>('flow.maxDelayMs', 30000);
        const durationMs = Math.min(Math.max(Math.floor(configuredMs), 0), Math.max(maximum, 0));
        if (execution.mode === 'run' && durationMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, durationMs));
        }
        return {
          output: { durationMs, simulated: execution.mode === 'preview' },
          nextKey: this.nextStepKey(step, true)
        };
      }
      case 'emit_event': {
        const config = step.config ?? {};
        const eventKey = this.stringConfig(config, 'eventKey');
        if (!eventKey) {
          throw new BadRequestException(`Step ${step.key} requires eventKey`);
        }
        const payload = this.asRecord(this.renderValue(config['payload'] ?? input, context));
        if (execution.mode === 'run') {
          await this.saveOutboxEvent(auth, eventKey, payload, {
            idempotencyKey: `flow:${execution.runId}:${step.key}`,
            aggregateType: this.stringConfig(config, 'aggregateType') ?? 'flow_run',
            aggregateId: execution.runId ?? null
          });
        }
        return {
          output: {
            eventKey,
            payload,
            persisted: execution.mode === 'run'
          },
          nextKey: this.nextStepKey(step, true)
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
            : (step.onFalse ?? step.onError ?? this.nextStepKey(step, false)),
          status: validation.valid ? 'success' : 'failed'
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

  private async executeParallelStep(
    auth: AuthContext,
    step: FlowDefinitionStep,
    input: Record<string, unknown>,
    context: FlowExecutionContext
  ) {
    const config = step.config ?? {};
    const branches = Array.isArray(config['branches'])
      ? config['branches'].map((branch) => this.asRecord(branch)).slice(0, 20)
      : [];
    if (branches.length < 2) {
      throw new BadRequestException(`Parallel step ${step.key} requires at least two branches`);
    }
    const results = await Promise.all(
      branches.map(async (branch, index) => {
        const serviceKey = this.stringConfig(branch, 'serviceKey');
        if (!serviceKey) {
          throw new BadRequestException(`Parallel branch ${index + 1} requires serviceKey`);
        }
        const branchInputMap = this.asRecord(branch['inputMap']);
        const branchInput = Object.keys(branchInputMap).length ? this.renderRecord(branchInputMap, context) : input;
        const run = await this.executeDynamicServiceStep(auth, serviceKey, branchInput, branch);
        return {
          key: this.stringConfig(branch, 'key') ?? `branch_${index + 1}`,
          serviceKey,
          ok: run.status === 'success',
          status: run.status,
          response: run.responseSnapshot ?? null,
          error: run.error ?? null,
          durationMs: run.durationMs
        };
      })
    );
    return {
      ok: results.every((result) => result.ok),
      results
    };
  }

  private async executeForeachStep(
    auth: AuthContext,
    step: FlowDefinitionStep,
    input: Record<string, unknown>,
    context: FlowExecutionContext
  ) {
    const config = step.config ?? {};
    const itemsPath = this.stringConfig(config, 'itemsPath');
    const serviceKey = this.stringConfig(config, 'serviceKey');
    if (!itemsPath || !serviceKey) {
      throw new BadRequestException(`Foreach step ${step.key} requires itemsPath and serviceKey`);
    }
    const items = this.readPath(this.expressionData(context), itemsPath);
    if (!Array.isArray(items)) {
      throw new BadRequestException(`Foreach path ${itemsPath} must resolve to an array`);
    }
    const maximumItems = this.confisys.get<number>('flow.foreach.maxItems', 100);
    if (items.length > maximumItems) {
      throw new BadRequestException(`Foreach step exceeds the maximum of ${maximumItems} items`);
    }
    const concurrency = Math.min(
      Math.max(Number(config['concurrency']) || 4, 1),
      this.confisys.get<number>('flow.foreach.maxConcurrency', 10)
    );
    const itemInputKey = this.stringConfig(config, 'itemInputKey') ?? 'item';
    const baseInputMap = this.asRecord(config['inputMap']);
    const results: Array<Record<string, unknown>> = [];
    for (let offset = 0; offset < items.length; offset += concurrency) {
      const batch = items.slice(offset, offset + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (item, batchIndex) => {
          const index = offset + batchIndex;
          const serviceInput = {
            ...(Object.keys(baseInputMap).length ? this.renderRecord(baseInputMap, context) : input),
            [itemInputKey]: item,
            index
          };
          const run = await this.executeDynamicServiceStep(auth, serviceKey, serviceInput, config);
          return {
            index,
            item,
            ok: run.status === 'success',
            status: run.status,
            response: run.responseSnapshot ?? null,
            error: run.error ?? null
          };
        })
      );
      results.push(...batchResults);
    }
    return {
      ok: results.every((result) => result['ok'] === true),
      count: results.length,
      results
    };
  }

  private async executeSubflowStep(
    auth: AuthContext,
    step: FlowDefinitionStep,
    input: Record<string, unknown>,
    context: FlowExecutionContext,
    execution: FlowStepExecutionMeta
  ) {
    const flowKey = this.stringConfig(step.config ?? {}, 'flowKey');
    if (!flowKey) {
      throw new BadRequestException(`Subflow step ${step.key} requires flowKey`);
    }
    const child = await this.requireFlowByKey(auth, this.normalizeKey(flowKey));
    if (context.flowStack.includes(child.key)) {
      throw new BadRequestException(`Recursive subflow detected: ${[...context.flowStack, child.key].join(' -> ')}`);
    }
    const maxDepth = this.confisys.get<number>('flow.subflow.maxDepth', 5);
    if (context.flowStack.length >= maxDepth) {
      throw new BadRequestException(`Subflow depth exceeds the maximum of ${maxDepth}`);
    }
    const flowStack = [...context.flowStack, child.key];
    if (execution.mode === 'preview') {
      const version = await this.versions.findOne({
        where: {
          tenantId: auth.tenant.id,
          flowId: child.id,
          status: 'published'
        },
        order: { version: 'DESC' }
      });
      if (!version) {
        throw new BadRequestException(`Subflow ${child.key} has no published version`);
      }
      this.validateFlowInput(input, version.definition.inputSchema);
      const preview = await this.previewDefinition(auth, child, version.definition, input, null, flowStack);
      if (preview.status !== 'success') {
        const message =
          'error' in preview && typeof preview.error?.['message'] === 'string'
            ? preview.error['message']
            : `Subflow ${child.key} preview failed`;
        throw new BadRequestException(message);
      }
      return {
        flowKey: child.key,
        status: preview.status,
        output: preview.output,
        preview: true
      };
    }
    const run = await this.executePublishedFlow(
      auth,
      child,
      {
        input,
        triggerType: 'event',
        triggerKey: `subflow:${context.flowStack.at(-1)}`
      },
      {
        parentRunId: execution.runId,
        rootRunId: execution.rootRunId,
        flowStack
      }
    );
    if (run.status !== 'success') {
      const error = this.asRecord(run.error);
      throw new BadRequestException(
        typeof error['message'] === 'string' ? error['message'] : `Subflow ${child.key} failed`
      );
    }
    return {
      flowKey: child.key,
      status: run.status,
      runId: run.id,
      output: run.output
    };
  }

  private async saveOutboxEvent(
    auth: AuthContext,
    eventKey: string,
    payload: Record<string, unknown>,
    options: {
      idempotencyKey: string;
      aggregateType?: string | null;
      aggregateId?: string | null;
    }
  ) {
    const existing = await this.outbox.findOne({
      where: {
        tenantId: auth.tenant.id,
        idempotencyKey: options.idempotencyKey
      }
    });
    if (existing) {
      return existing;
    }
    return this.outbox.save(
      this.outbox.create({
        tenantId: auth.tenant.id,
        eventKey: eventKey.trim().toLowerCase(),
        aggregateType: options.aggregateType ?? null,
        aggregateId: options.aggregateId ?? null,
        idempotencyKey: options.idempotencyKey,
        payload,
        headers: { source: 'flow.emit_event' },
        status: 'pending',
        attempts: 0,
        availableAt: new Date(),
        createdByUserId: auth.user.id
      })
    );
  }

  private async runCompensations(auth: AuthContext, context: FlowExecutionContext) {
    const results: Array<Record<string, unknown>> = [];
    for (const compensation of [...context.compensations].reverse()) {
      try {
        const run = await this.executeDynamicServiceStep(auth, compensation.serviceKey, compensation.input, {});
        results.push({
          serviceKey: compensation.serviceKey,
          status: run.status,
          error: run.error ?? null
        });
      } catch (error) {
        results.push({
          serviceKey: compensation.serviceKey,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Compensation failed'
        });
      }
    }
    return {
      attempted: results.length,
      succeeded: results.filter((result) => result['status'] === 'success').length,
      results
    };
  }

  private nextStepKey(step: FlowDefinitionStep, success: boolean) {
    if (step.type === 'decision') {
      return success ? (step.onTrue ?? step.next) : (step.onFalse ?? step.next);
    }
    return success ? (step.onSuccess ?? step.next) : (step.onError ?? step.next);
  }

  private async executeTestCase(auth: AuthContext, flow: Flow, testCase: FlowTestCase) {
    let actual: Record<string, unknown>;
    let executionError: string | null = null;
    try {
      if (testCase.target === 'published') {
        const run = await this.executePublishedFlow(auth, flow, {
          input: testCase.input,
          triggerType: 'test',
          triggerKey: `test-case:${testCase.id}`
        });
        actual = {
          status: run.status,
          output: run.output ?? null,
          error: run.error ?? null,
          context: run.contextSnapshot ?? null,
          steps: run.steps ?? [],
          runId: run.id
        };
      } else {
        const preview = await this.preview(auth, flow.id, {
          input: testCase.input,
          throughStepKey: testCase.throughStepKey
        });
        actual = {
          status: preview.status,
          output: preview.output ?? null,
          error: 'error' in preview ? (preview.error ?? null) : null,
          context: preview.context,
          steps: preview.steps
        };
      }
    } catch (error) {
      executionError = error instanceof Error ? error.message : 'Test execution failed';
      actual = {
        status: 'failed',
        output: null,
        error: { message: executionError },
        context: null,
        steps: []
      };
    }

    const actualStatus: FlowTestExpectedStatus = actual['status'] === 'success' ? 'success' : 'failed';
    const statusPassed = !executionError && actualStatus === testCase.expectedStatus;
    const expectedOutputPassed =
      testCase.expectedOutput === null || testCase.expectedOutput === undefined
        ? true
        : this.deepContains(actual['output'], testCase.expectedOutput);
    const assertionResults = (testCase.assertions ?? []).map((assertion) =>
      this.evaluateTestAssertion(assertion, actual)
    );
    const passed = statusPassed && expectedOutputPassed && assertionResults.every((assertion) => assertion.passed);

    return {
      passed,
      target: testCase.target,
      expectedStatus: testCase.expectedStatus,
      actualStatus,
      statusPassed,
      expectedOutputPassed,
      assertionResults,
      executionError,
      actual
    };
  }

  private evaluateTestAssertion(assertion: FlowTestAssertion, actual: Record<string, unknown>) {
    const value = this.readPath(actual, assertion.path);
    let passed = false;
    switch (assertion.operator) {
      case 'equals':
        passed = this.deepEqual(value, assertion.expected);
        break;
      case 'not_equals':
        passed = !this.deepEqual(value, assertion.expected);
        break;
      case 'contains':
        passed =
          (typeof value === 'string' && value.includes(String(assertion.expected ?? ''))) ||
          (Array.isArray(value) && value.some((item) => this.deepEqual(item, assertion.expected)));
        break;
      case 'exists':
        passed = value !== undefined && value !== null;
        break;
      case 'truthy':
        passed = Boolean(value);
        break;
      case 'greater_than':
        passed = Number.isFinite(Number(value)) && Number(value) > Number(assertion.expected);
        break;
      case 'less_than':
        passed = Number.isFinite(Number(value)) && Number(value) < Number(assertion.expected);
        break;
    }
    return {
      path: assertion.path,
      operator: assertion.operator,
      expected: assertion.expected ?? null,
      actual: value ?? null,
      passed
    };
  }

  private readPath(source: unknown, path: string): unknown {
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean)
      .reduce<unknown>((value, segment) => {
        if (Array.isArray(value)) {
          const index = Number(segment);
          return Number.isInteger(index) ? value[index] : undefined;
        }
        if (value && typeof value === 'object') {
          return (value as Record<string, unknown>)[segment];
        }
        return undefined;
      }, source);
  }

  private deepContains(actual: unknown, expected: unknown): boolean {
    if (Array.isArray(expected)) {
      return (
        Array.isArray(actual) && expected.every((expectedItem, index) => this.deepContains(actual[index], expectedItem))
      );
    }
    if (expected && typeof expected === 'object') {
      if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
        return false;
      }
      return Object.entries(expected as Record<string, unknown>).every(([key, expectedValue]) =>
        this.deepContains((actual as Record<string, unknown>)[key], expectedValue)
      );
    }
    return this.deepEqual(actual, expected);
  }

  private deepEqual(left: unknown, right: unknown) {
    return JSON.stringify(left) === JSON.stringify(right);
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
    const run = await this.runs.findOneOrFail({
      where: { id: runId, tenantId: auth.tenant.id }
    });
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
            where: flowIds.map((flowId) => ({
              tenantId: auth.tenant.id,
              flowId,
              versionId: IsNull()
            })),
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
    const sorted = steps
      .slice()
      .sort((a, b) => a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime());
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
        ...(hasStart
          ? []
          : [
              {
                key: 'start',
                type: 'start' as const,
                next: firstStep ?? 'end'
              }
            ]),
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
      if (definition['format'] === 'email' && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new BadRequestException(`Flow input ${key} must be a valid email`);
      }
      if (definition['format'] === 'date' && typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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
    const flow = await this.flows.findOne({
      where: { id: flowId, tenantId: auth.tenant.id, trashedAt: IsNull() }
    });
    if (!flow) {
      throw new NotFoundException('Flow not found');
    }
    return flow;
  }

  private async requireFlowByKey(auth: AuthContext, key: string) {
    const flow = await this.flows.findOne({
      where: { key, tenantId: auth.tenant.id, trashedAt: IsNull() }
    });
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
    const version = await this.versions.findOne({
      where: { id: versionId, tenantId: auth.tenant.id, flowId }
    });
    if (!version) {
      throw new NotFoundException('Flow version not found');
    }
    return version;
  }

  private async requireStep(auth: AuthContext, flowId: string, stepId: string) {
    const step = await this.steps.findOne({
      where: {
        id: stepId,
        tenantId: auth.tenant.id,
        flowId,
        versionId: IsNull()
      }
    });
    if (!step) {
      throw new NotFoundException('Flow step not found');
    }
    return step;
  }

  private async requireTestCase(auth: AuthContext, flowId: string, testCaseId: string) {
    const testCase = await this.testCases.findOne({
      where: { id: testCaseId, tenantId: auth.tenant.id, flowId }
    });
    if (!testCase) {
      throw new NotFoundException('Flow test case not found');
    }
    return testCase;
  }

  private async requireTrigger(auth: AuthContext, flowId: string, triggerId: string) {
    const trigger = await this.triggers.findOne({
      where: { id: triggerId, tenantId: auth.tenant.id, flowId }
    });
    if (!trigger) {
      throw new NotFoundException('Flow trigger not found');
    }
    return trigger;
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

    const currentFlow = await this.requireFlow(auth, steps[0].flowId);
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
      if (step.type === 'parallel') {
        const branches = Array.isArray((step.config ?? {})['branches'])
          ? ((step.config ?? {})['branches'] as unknown[])
          : [];
        if (branches.length < 2 || branches.length > 20) {
          throw new BadRequestException(`Parallel step ${step.key} requires 2-20 branches`);
        }
      }
      if (step.type === 'foreach') {
        if (!this.stringConfig(step.config ?? {}, 'itemsPath') || !this.stringConfig(step.config ?? {}, 'serviceKey')) {
          throw new BadRequestException(`Foreach step ${step.key} requires itemsPath and serviceKey`);
        }
      }
      if (step.type === 'subflow') {
        const childKey = this.stringConfig(step.config ?? {}, 'flowKey');
        if (!childKey || childKey === currentFlow.key) {
          throw new BadRequestException(`Subflow step ${step.key} requires a different flow`);
        }
        const child = await this.requireFlowByKey(auth, this.normalizeKey(childKey));
        const published = await this.versions.exist({
          where: {
            tenantId: auth.tenant.id,
            flowId: child.id,
            status: 'published'
          }
        });
        if (!published) {
          throw new BadRequestException(`Subflow ${child.key} must be published`);
        }
      }
      if (step.type === 'emit_event' && !this.stringConfig(step.config ?? {}, 'eventKey')) {
        throw new BadRequestException(`Event step ${step.key} requires eventKey`);
      }
    }

    const requiredServiceKeys = steps.flatMap((step) => {
      const config = step.config ?? {};
      if (step.type === 'dynamic_service' || step.type === 'foreach') {
        return [this.stringConfig(config, 'serviceKey'), this.stringConfig(config, 'compensationServiceKey')].filter(
          (key): key is string => Boolean(key)
        );
      }
      if (step.type === 'parallel') {
        return (Array.isArray(config['branches']) ? config['branches'] : [])
          .map((branch) => this.stringConfig(this.asRecord(branch), 'serviceKey'))
          .filter((key): key is string => Boolean(key));
      }
      return [];
    });
    if (requiredServiceKeys.length) {
      const services = (await this.dynamicServices.list(auth)) as Array<{
        key: string;
        active: boolean;
        publishedVersion?: unknown;
      }>;
      const available = new Set(
        services.filter((service) => service.active && service.publishedVersion).map((service) => service.key)
      );
      const unavailable = requiredServiceKeys.find((key) => !available.has(key));
      if (unavailable) {
        throw new BadRequestException(`Flow requires active published service ${unavailable}`);
      }
    }
  }

  private async assertStepKeyAvailable(auth: AuthContext, flowId: string, key: string) {
    const exists = await this.steps.exist({
      where: { tenantId: auth.tenant.id, flowId, versionId: IsNull(), key }
    });
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

  private cleanAuthoringSteps(steps?: FlowStepRequest[]) {
    if (steps === undefined) {
      return [];
    }
    if (!Array.isArray(steps) || steps.length > 200) {
      throw new BadRequestException('Flow definition steps must be an array with at most 200 items');
    }
    const cleaned = steps.map((step, index) => ({
      key: this.normalizeKey(step.key),
      name: this.cleanName(step.name ?? step.key),
      type: this.cleanStepType(step.type),
      position: this.cleanPosition(step.position ?? (index + 1) * 10),
      config: step.config ?? null,
      inputMap: step.inputMap ?? null,
      outputKey: step.outputKey?.trim() || null,
      nextStepKey: step.nextStepKey?.trim() || null,
      onSuccessStepKey: step.onSuccessStepKey?.trim() || null,
      onErrorStepKey: step.onErrorStepKey?.trim() || null,
      onTimeoutStepKey: step.onTimeoutStepKey?.trim() || null,
      onTrueStepKey: step.onTrueStepKey?.trim() || null,
      onFalseStepKey: step.onFalseStepKey?.trim() || null,
      runtimeConfig: step.runtimeConfig ?? null,
      ui: step.ui ?? null
    }));
    const keys = cleaned.map((step) => step.key);
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException('Flow definition step keys must be unique');
    }
    const targets = new Set([...keys, 'end']);
    for (const step of cleaned) {
      const invalidTarget = [
        step.nextStepKey,
        step.onSuccessStepKey,
        step.onErrorStepKey,
        step.onTimeoutStepKey,
        step.onTrueStepKey,
        step.onFalseStepKey
      ].find((target) => target && !targets.has(target));
      if (invalidTarget) {
        throw new BadRequestException(`Flow step ${step.key} references missing target ${invalidTarget}`);
      }
    }
    return cleaned;
  }

  private cleanTestExpectedStatus(value?: FlowTestExpectedStatus): FlowTestExpectedStatus {
    if (value === undefined) {
      return 'success';
    }
    if (value !== 'success' && value !== 'failed') {
      throw new BadRequestException('Test expectedStatus must be success or failed');
    }
    return value;
  }

  private cleanTestTarget(value?: FlowTestTarget): FlowTestTarget {
    if (value === undefined) {
      return 'draft';
    }
    if (value !== 'draft' && value !== 'published') {
      throw new BadRequestException('Test target must be draft or published');
    }
    return value;
  }

  private cleanTestAssertions(assertions?: FlowTestAssertion[] | null) {
    if (!assertions) {
      return null;
    }
    if (!Array.isArray(assertions) || assertions.length > 50) {
      throw new BadRequestException('Test assertions must be an array with at most 50 items');
    }
    const operators: FlowTestAssertionOperator[] = [
      'equals',
      'not_equals',
      'contains',
      'exists',
      'truthy',
      'greater_than',
      'less_than'
    ];
    return assertions.map((assertion) => {
      const path = typeof assertion?.path === 'string' ? assertion.path.trim() : '';
      if (!/^[a-zA-Z][a-zA-Z0-9_.\[\]-]{0,239}$/.test(path)) {
        throw new BadRequestException(`Invalid test assertion path: ${path || 'empty'}`);
      }
      if (!operators.includes(assertion.operator)) {
        throw new BadRequestException(`Invalid test assertion operator for ${path}`);
      }
      return {
        path,
        operator: assertion.operator,
        expected: assertion.expected
      };
    });
  }

  private cleanTriggerType(value?: FlowTriggerType): FlowTriggerType {
    const types: FlowTriggerType[] = ['http', 'form_submit', 'record_event', 'schedule', 'manual'];
    if (!value || !types.includes(value)) {
      throw new BadRequestException('Invalid flow trigger type');
    }
    return value;
  }

  private cleanTriggerKey(value?: string) {
    const key = (value ?? '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9_.:-]{2,179}$/.test(key)) {
      throw new BadRequestException('Trigger key must use letters, numbers, dot, colon, dash or underscore');
    }
    return key;
  }

  private cleanTriggerConfig(
    type: FlowTriggerType,
    value?: Record<string, unknown> | null,
    previous?: Record<string, unknown> | null
  ) {
    const config = this.asRecord(value);
    if (type === 'schedule') {
      const intervalSeconds = Math.min(Math.max(Number(config['intervalSeconds']) || 60, 10), 86400 * 30);
      return {
        ...config,
        intervalSeconds,
        input: this.asRecord(config['input'])
      };
    }
    if (type === 'http') {
      const secret = typeof config['secret'] === 'string' ? config['secret'].trim() : '';
      const previousHash = typeof previous?.['secretHash'] === 'string' ? previous['secretHash'] : '';
      if (secret && secret.length < 16) {
        throw new BadRequestException('HTTP trigger secret must contain at least 16 characters');
      }
      const secretHash = secret ? createHash('sha256').update(secret).digest('hex') : previousHash;
      if (!secretHash) {
        throw new BadRequestException('HTTP trigger requires a webhook secret');
      }
      const { secret: _secret, ...safeConfig } = config;
      return {
        ...safeConfig,
        secretHash,
        inputMode: config['inputMode'] === 'envelope' ? 'envelope' : 'payload'
      };
    }
    return {
      ...config,
      inputMode: config['inputMode'] === 'envelope' ? 'envelope' : 'payload'
    };
  }

  private nextTriggerDate(config?: Record<string, unknown> | null) {
    const intervalSeconds = Math.min(Math.max(Number((config ?? {})['intervalSeconds']) || 60, 10), 86400 * 30);
    return new Date(Date.now() + intervalSeconds * 1000);
  }

  private async assertTriggerKeyAvailable(auth: AuthContext, type: FlowTriggerType, key: string, excludeId?: string) {
    if (!['http', 'manual'].includes(type)) {
      return;
    }
    const query = this.triggers
      .createQueryBuilder('trigger')
      .where('trigger.tenantId = :tenantId', { tenantId: auth.tenant.id })
      .andWhere('trigger.type = :type', { type })
      .andWhere('trigger.key = :key', { key });
    if (excludeId) {
      query.andWhere('trigger.id != :excludeId', { excludeId });
    }
    if (await query.getExists()) {
      throw new BadRequestException('Trigger key already exists for this tenant and type');
    }
  }

  private publicTrigger(trigger: FlowTrigger) {
    const config = { ...(trigger.config ?? {}) };
    delete config['secretHash'];
    return {
      ...trigger,
      config,
      secretConfigured: trigger.type === 'http' && typeof trigger.config?.['secretHash'] === 'string'
    };
  }

  private cleanTags(tags?: string[] | null) {
    if (!tags) {
      return null;
    }
    return tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 20);
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
          field['example'] === undefined || field['example'] === null ? '' : String(field['example']).slice(0, 500)
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

  private async seedSystemTemplates() {
    for (const item of SYSTEM_FLOW_TEMPLATES) {
      const exists = await this.templates.findOne({
        where: { tenantId: IsNull(), scope: 'system', key: item.key }
      });
      if (exists) {
        continue;
      }
      await this.templates.save(
        this.templates.create({
          tenantId: null,
          ownerKey: SYSTEM_FLOW_TEMPLATE_OWNER,
          ...item,
          scope: 'system',
          active: true,
          sourceFlowId: null,
          createdByUserId: null
        })
      );
    }
  }

  private async requireTemplate(auth: AuthContext, templateId: string) {
    const template = await this.templates
      .createQueryBuilder('template')
      .where('template.id = :templateId', { templateId })
      .andWhere('template.active = 1')
      .andWhere('(template.scope = :system OR template.tenantId = :tenantId)', {
        system: 'system',
        tenantId: auth.tenant.id
      })
      .getOne();
    if (!template) {
      throw new NotFoundException('Flow template not found');
    }
    return template;
  }

  private authoringDocumentForFlow(flow: Flow, steps: FlowStep[]): Record<string, unknown> {
    const entry = this.asRecord(flow.metadata?.['authoringEntry']);
    const output = this.asRecord(flow.metadata?.['authoringOutput']);
    return {
      schemaVersion: 1,
      flow: {
        name: flow.name,
        description: flow.description,
        category: flow.category,
        runtimeConfig: flow.runtimeConfig,
        tags: flow.tags
      },
      entry: {
        mode: this.optionalString(entry['mode']) ?? 'direct',
        key: this.optionalString(entry['key']) ?? 'direct',
        config: this.asRecord(entry['config'])
      },
      inputFields: this.asArray(flow.metadata?.['inputFields']),
      steps: steps.map((step) => ({
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
      })),
      output: {
        stepKey: this.optionalString(output['stepKey']) ?? steps.find((step) => step.type === 'response')?.key ?? null,
        responseTo: 'caller'
      }
    };
  }

  private copyStepValues(step: FlowStep) {
    return {
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
    };
  }

  private inputFieldsFromSchema(schema?: Record<string, unknown> | null) {
    const source = this.asRecord(schema);
    const properties = this.asRecord(source['properties']);
    const required = new Set(
      this.asArray(source['required']).filter((value): value is string => typeof value === 'string')
    );
    return Object.entries(properties).map(([key, rawDefinition]) => {
      const definition = this.asRecord(rawDefinition);
      const type =
        definition['format'] === 'email'
          ? 'email'
          : definition['format'] === 'date'
            ? 'date'
            : definition['type'] === 'number'
              ? 'number'
              : definition['type'] === 'boolean'
                ? 'boolean'
                : 'text';
      return {
        key,
        label: this.optionalString(definition['title']) ?? key,
        type,
        required: required.has(key),
        example: ''
      };
    });
  }

  private definitionChanges(left: unknown, right: unknown, path = '$'): Array<Record<string, unknown>> {
    if (JSON.stringify(left) === JSON.stringify(right)) {
      return [];
    }
    if (
      !left ||
      !right ||
      typeof left !== 'object' ||
      typeof right !== 'object' ||
      Array.isArray(left) !== Array.isArray(right)
    ) {
      return [{ path, before: left, after: right }];
    }
    if (Array.isArray(left) && Array.isArray(right)) {
      const changes: Array<Record<string, unknown>> = [];
      const length = Math.max(left.length, right.length);
      for (let index = 0; index < length; index += 1) {
        changes.push(...this.definitionChanges(left[index], right[index], `${path}[${index}]`));
      }
      return changes.slice(0, 500);
    }
    const leftRecord = this.asRecord(left);
    const rightRecord = this.asRecord(right);
    const keys = new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)]);
    const changes: Array<Record<string, unknown>> = [];
    for (const key of keys) {
      changes.push(...this.definitionChanges(leftRecord[key], rightRecord[key], `${path}.${key}`));
    }
    return changes.slice(0, 500);
  }

  private cleanMetricsQuery(query: FlowMetricsQuery) {
    const statuses: FlowRun['status'][] = ['queued', 'running', 'success', 'failed', 'timeout', 'cancelled'];
    const triggerTypes: FlowRunTriggerType[] = ['manual', 'http', 'form', 'event', 'schedule', 'test'];
    const parseDate = (value?: string) => {
      if (!value) {
        return undefined;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`Invalid metrics date: ${value}`);
      }
      return date;
    };
    const status = statuses.includes(query.status as FlowRun['status']) ? query.status : undefined;
    const triggerType = triggerTypes.includes(query.triggerType as FlowRunTriggerType) ? query.triggerType : undefined;
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    if (from && to && from > to) {
      throw new BadRequestException('Metrics from date must be before to date');
    }
    return {
      status,
      triggerType,
      from,
      to,
      limit: Math.min(Math.max(Number(query.limit) || 30, 1), 5000)
    };
  }

  private applyRunFilters(
    builder: SelectQueryBuilder<FlowRun>,
    filters: ReturnType<FlowsService['cleanMetricsQuery']>
  ) {
    if (filters.status) {
      builder.andWhere('run.status = :status', { status: filters.status });
    }
    if (filters.triggerType) {
      builder.andWhere('run.triggerType = :triggerType', {
        triggerType: filters.triggerType
      });
    }
    if (filters.from) {
      builder.andWhere('run.createdAt >= :from', { from: filters.from });
    }
    if (filters.to) {
      builder.andWhere('run.createdAt <= :to', { to: filters.to });
    }
  }

  private countBy<T>(items: T[], selector: (item: T) => string) {
    return items.reduce<Record<string, number>>((counts, item) => {
      const key = selector(item);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
  }

  private average(values: number[]) {
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  }

  private percentile(values: number[], percentile: number) {
    if (!values.length) {
      return 0;
    }
    const index = Math.min(Math.ceil((percentile / 100) * values.length) - 1, values.length - 1);
    return values[Math.max(index, 0)];
  }

  private optionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
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
        this.dynamicServices.executeByKey(auth, serviceKey, { context: input }, { skipResourceAccess: true }),
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

  private async assertResourceAccess(auth: AuthContext, flowId: string) {
    if (!(await this.rbac.canAccessResource(auth, 'flow', flowId))) {
      throw new ForbiddenException('This role cannot execute the requested flow');
    }
  }

  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new FlowStepTimeoutError(message)), timeoutMs);
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
      return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
        (rendered, [key, item]) => {
          rendered[key] = this.renderValue(item, context);
          return rendered;
        },
        {}
      );
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

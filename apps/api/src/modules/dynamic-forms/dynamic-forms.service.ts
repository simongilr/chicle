import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { DynamicServicesService } from '../dynamic-services/dynamic-services.service';
import { FlowsService } from '../flows/flows.service';
import { RecordsService } from '../records/records.service';
import { DynamicFormBinding } from './dynamic-form-binding.entity';
import { DynamicFormRun } from './dynamic-form-run.entity';
import { DynamicFormVersion } from './dynamic-form-version.entity';
import { DynamicFormWritePolicy } from './dynamic-form-write-policy.entity';
import { DynamicForm } from './dynamic-form.entity';

type FormActionType =
  | 'create_record'
  | 'execute_service'
  | 'execute_flow'
  | 'show_message'
  | 'navigate'
  | 'queue_offline'
  | 'upload_files'
  | 'set_field_value'
  | 'reset_form'
  | 'open_modal';

interface DynamicFormAction {
  type: FormActionType;
  serviceKey?: string;
  flowKey?: string;
  payloadMap?: Record<string, unknown>;
  resultKey?: string;
  recordType?: string;
}

interface DynamicFormCommand {
  key: string;
  label: string;
  placement: string;
  style: string;
  event: string;
  fieldKey?: string;
  action?: DynamicFormAction;
}

interface DynamicFormSchema {
  schemaVersion?: number;
  kind?: string;
  key?: string;
  title?: string;
  category?: string;
  runtime?: {
    submitLabel?: string;
    offline?: {
      idempotencyKey?: string;
    };
  };
  persistence?: {
    mode?: 'record' | 'service' | 'flow' | 'hybrid' | 'none' | 'submit_action';
    defaultTarget?: {
      type?: 'record' | 'dynamic_service' | 'flow';
      recordType?: string;
      serviceKey?: string;
      flowKey?: string;
    };
  };
  dataSources?: Array<Record<string, unknown>>;
  commands?: DynamicFormCommand[];
  steps?: Array<{
    key: string;
    title: string;
    fields: Array<Record<string, unknown>>;
  }>;
  fields?: Array<Record<string, unknown>>;
  actions?: Array<DynamicFormAction & { event?: string }>;
  tests?: Array<Record<string, unknown>>;
}

export interface CreateDynamicFormRequest {
  key?: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  schema?: Record<string, unknown>;
  published?: boolean;
}

export interface SubmitDynamicFormRequest {
  input?: Record<string, unknown>;
  commandKey?: string;
  idempotencyKey?: string;
}

@Injectable()
export class DynamicFormsService {
  constructor(
    @InjectRepository(DynamicForm)
    private readonly forms: Repository<DynamicForm>,
    @InjectRepository(DynamicFormVersion)
    private readonly versions: Repository<DynamicFormVersion>,
    @InjectRepository(DynamicFormBinding)
    private readonly bindings: Repository<DynamicFormBinding>,
    @InjectRepository(DynamicFormWritePolicy)
    private readonly writePolicies: Repository<DynamicFormWritePolicy>,
    @InjectRepository(DynamicFormRun)
    private readonly runs: Repository<DynamicFormRun>,
    private readonly records: RecordsService,
    private readonly dynamicServices: DynamicServicesService,
    private readonly flows: FlowsService
  ) {}

  findAll(auth: AuthContext) {
    return this.forms.find({
      where: { tenantId: auth.tenant.id },
      order: { key: 'ASC', version: 'DESC' }
    });
  }

  async findByKey(auth: AuthContext, key: string) {
    const form = await this.requireFormByKey(auth, key);
    return {
      ...form,
      bindings: await this.bindings.find({
        where: { tenantId: auth.tenant.id, formId: form.id, active: true },
        order: { createdAt: 'ASC' }
      })
    };
  }

  async runtimeByKey(auth: AuthContext, key: string) {
    const form = await this.requireFormByKey(auth, key);
    const version = await this.resolveRuntimeVersion(auth, form);
    const schema = version?.schema ?? form.schema;
    return {
      key: form.key,
      title: form.title,
      description: form.description,
      category: form.category,
      version: version?.version ?? form.version,
      versionId: version?.id ?? null,
      schema,
      bindings: await this.bindings.find({
        where: {
          tenantId: auth.tenant.id,
          formId: form.id,
          ...(version?.id ? { formVersionId: version.id } : { formVersionId: IsNull() }),
          active: true
        },
        order: { createdAt: 'ASC' }
      })
    };
  }

  async create(auth: AuthContext, body: CreateDynamicFormRequest) {
    const key = this.normalizeKey(body.key);
    const title = body.title?.trim();
    if (!key || !title || !body.schema) {
      throw new BadRequestException('key, title and schema are required');
    }
    const schema = this.normalizeSchema(body.schema, key, title);
    this.validateSchema(schema);

    const form = await this.forms.save(
      this.forms.create({
        tenantId: auth.tenant.id,
        key,
        title,
        description: body.description?.trim() || null,
        category: body.category?.trim() || this.asString(schema.category) || null,
        version: 1,
        schema: schema as unknown as Record<string, unknown>,
        published: body.published ?? false,
        status: body.published ? 'published' : 'draft',
        metadata: null,
        tags: null
      })
    );
    await this.replaceDraftBindings(auth, form, schema);
    return form;
  }

  async createVersion(auth: AuthContext, formId: string) {
    const form = await this.requireForm(auth, formId);
    const schema = this.normalizeSchema(form.schema, form.key, form.title);
    this.validateSchema(schema);
    const current = await this.versions.findOne({
      where: { tenantId: auth.tenant.id, formId: form.id },
      order: { version: 'DESC' }
    });
    const versionNumber = (current?.version ?? 0) + 1;
    const bindingsSnapshot = { bindings: this.extractBindings(schema) };
    const version = await this.versions.save(
      this.versions.create({
        tenantId: auth.tenant.id,
        formId: form.id,
        version: versionNumber,
        status: 'draft',
        schema: schema as unknown as Record<string, unknown>,
        bindingsSnapshot,
        createdByUserId: auth.user.id
      })
    );
    await this.replaceVersionBindings(auth, form, version, schema);
    return version;
  }

  async publishVersion(auth: AuthContext, formId: string, versionId: string) {
    const form = await this.requireForm(auth, formId);
    const version = await this.versions.findOne({
      where: { tenantId: auth.tenant.id, formId: form.id, id: versionId }
    });
    if (!version) {
      throw new NotFoundException('Form version not found');
    }
    this.validateSchema(this.normalizeSchema(version.schema, form.key, form.title));
    await this.versions.update(
      { tenantId: auth.tenant.id, formId: form.id, status: 'published' },
      { status: 'archived' }
    );
    await this.versions.update(version.id, {
      status: 'published',
      publishedAt: new Date()
    });
    await this.forms
      .createQueryBuilder()
      .update(DynamicForm)
      .set({
      version: version.version,
      schema: () => ':schema',
      published: true,
      status: 'published',
      publishedVersionId: version.id
      })
      .where('id = :id', { id: form.id })
      .setParameters({ schema: JSON.stringify(version.schema) })
      .execute();
    await this.replaceVersionBindings(auth, form, version, version.schema);
    return this.versions.findOneOrFail({ where: { id: version.id } });
  }

  async submitByKey(auth: AuthContext, key: string, request: SubmitDynamicFormRequest) {
    const startedAt = Date.now();
    const form = await this.requireFormByKey(auth, key);
    const version = await this.resolveRuntimeVersion(auth, form);
    const schema = this.normalizeSchema(version?.schema ?? form.schema, form.key, form.title);
    this.validateSchema(schema);
    const input = this.sanitizeInput(request.input ?? {});
    const idempotencyKey = this.resolveIdempotencyKey(schema, input, auth, request.idempotencyKey);
    const existing = await this.runs.findOne({
      where: { tenantId: auth.tenant.id, idempotencyKey }
    });
    if (existing) {
      return existing.output ?? existing;
    }

    try {
      const action = this.resolveSubmitAction(schema, request.commandKey);
      const output = this.toJsonObject(
        await this.executeAction(auth, form, version, schema, action, input, idempotencyKey)
      );
      const run = await this.runs.save(
        this.runs.create({
          tenantId: auth.tenant.id,
          formId: form.id,
          formVersionId: version?.id ?? null,
          version: version?.version ?? form.version,
          status: 'success',
          idempotencyKey,
          input,
          output,
          bindingsSnapshot: { bindings: this.extractBindings(schema) },
          durationMs: Date.now() - startedAt,
          actorUserId: auth.user.id
        })
      );
      return run.output;
    } catch (error) {
      await this.runs.save(
        this.runs.create({
          tenantId: auth.tenant.id,
          formId: form.id,
          formVersionId: version?.id ?? null,
          version: version?.version ?? form.version,
          status: 'failed',
          idempotencyKey,
          input,
          error: {
            message: error instanceof Error ? error.message : 'Form submit failed'
          },
          bindingsSnapshot: { bindings: this.extractBindings(schema) },
          durationMs: Date.now() - startedAt,
          actorUserId: auth.user.id
        })
      );
      throw error;
    }
  }

  private async executeAction(
    auth: AuthContext,
    form: DynamicForm,
    version: DynamicFormVersion | null,
    schema: DynamicFormSchema,
    action: DynamicFormAction,
    input: Record<string, unknown>,
    idempotencyKey: string
  ) {
    if (action.type === 'execute_service') {
      const serviceKey = action.serviceKey?.trim();
      if (!serviceKey) {
        throw new BadRequestException('serviceKey is required');
      }
      const context = this.resolveMap(action.payloadMap ?? { input: '{{input}}' }, input, auth);
      return this.dynamicServices.executeByKey(auth, serviceKey, { context });
    }

    if (action.type === 'execute_flow') {
      const flowKey = action.flowKey?.trim();
      if (!flowKey) {
        throw new BadRequestException('flowKey is required');
      }
      const mappedInput = this.resolveMap(action.payloadMap ?? { input: '{{input}}' }, input, auth);
      return this.flows.executeByKey(auth, flowKey, {
        input: mappedInput,
        triggerType: 'form',
        triggerKey: form.key
      });
    }

    if (action.type === 'create_record' || action.type === 'queue_offline') {
      return this.createRecord(auth, form, version, schema, action, input, idempotencyKey);
    }

    const mode = schema.persistence?.mode;
    if (!action.type && (mode === 'record' || mode === 'hybrid')) {
      return this.createRecord(auth, form, version, schema, action, input, idempotencyKey);
    }

    throw new BadRequestException(`Unsupported form action: ${action.type}`);
  }

  private createRecord(
    auth: AuthContext,
    form: DynamicForm,
    version: DynamicFormVersion | null,
    schema: DynamicFormSchema,
    action: DynamicFormAction,
    input: Record<string, unknown>,
    idempotencyKey: string
  ) {
    const recordType =
      action.recordType?.trim() ||
      schema.persistence?.defaultTarget?.recordType?.trim() ||
      form.key;
    return this.records.create(auth, {
      recordType,
      formKey: form.key,
      formVersion: version?.version ?? form.version,
      idempotencyKey,
      data: input,
      metadata: {
        formId: form.id,
        formVersionId: version?.id ?? null,
        source: 'dynamic_forms.submit'
      }
    });
  }

  private resolveSubmitAction(schema: DynamicFormSchema, commandKey?: string): DynamicFormAction {
    if (commandKey) {
      const command = (schema.commands ?? []).find((item) => item.key === commandKey);
      if (!command?.action) {
        throw new BadRequestException('Command action not found');
      }
      return command.action;
    }
    const submitAction = (schema.actions ?? []).find((action) => action.event === 'onSubmit');
    if (submitAction) {
      return submitAction;
    }
    if (schema.persistence?.mode === 'flow' && schema.persistence.defaultTarget?.flowKey) {
      return { type: 'execute_flow', flowKey: schema.persistence.defaultTarget.flowKey, payloadMap: { input: '{{input}}' } };
    }
    if (schema.persistence?.mode === 'service' && schema.persistence.defaultTarget?.serviceKey) {
      return {
        type: 'execute_service',
        serviceKey: schema.persistence.defaultTarget.serviceKey,
        payloadMap: { input: '{{input}}' }
      };
    }
    return { type: 'create_record' };
  }

  private async resolveRuntimeVersion(auth: AuthContext, form: DynamicForm) {
    if (form.publishedVersionId) {
      return this.versions.findOne({
        where: { tenantId: auth.tenant.id, formId: form.id, id: form.publishedVersionId, status: 'published' }
      });
    }
    return this.versions.findOne({
      where: { tenantId: auth.tenant.id, formId: form.id, status: 'published' },
      order: { version: 'DESC' }
    });
  }

  private async requireFormByKey(auth: AuthContext, key: string) {
    const form = await this.forms.findOne({
      where: { tenantId: auth.tenant.id, key: this.normalizeKey(key) },
      order: { version: 'DESC' }
    });
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  private async requireForm(auth: AuthContext, formId: string) {
    const form = await this.forms.findOne({
      where: { tenantId: auth.tenant.id, id: formId }
    });
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  private normalizeKey(value?: string) {
    const key = value?.trim().toLowerCase();
    if (!key) {
      return '';
    }
    if (!/^[a-z][a-z0-9_.-]{1,119}$/.test(key)) {
      throw new BadRequestException('key contains invalid characters');
    }
    return key;
  }

  private normalizeSchema(schema: Record<string, unknown>, key: string, title: string): DynamicFormSchema {
    const normalized = { ...schema } as DynamicFormSchema;
    normalized.schemaVersion = Number(normalized.schemaVersion ?? 1);
    normalized.kind = normalized.kind ?? 'dynamic_form';
    normalized.key = normalized.key ?? key;
    normalized.title = normalized.title ?? title;
    normalized.steps = normalized.steps?.length
      ? normalized.steps
      : [
          {
            key: 'form',
            title,
            fields: Array.isArray(normalized.fields) ? normalized.fields : []
          }
        ];
    normalized.commands = Array.isArray(normalized.commands) ? normalized.commands : [];
    normalized.actions = Array.isArray(normalized.actions) ? normalized.actions : [];
    normalized.tests = Array.isArray(normalized.tests) ? normalized.tests : [];
    normalized.dataSources = Array.isArray(normalized.dataSources) ? normalized.dataSources : [];
    return normalized;
  }

  private validateSchema(schema: DynamicFormSchema) {
    if (schema.kind !== 'dynamic_form') {
      throw new BadRequestException('schema.kind must be dynamic_form');
    }
    if (!schema.key || !schema.title || !Array.isArray(schema.steps) || !schema.steps.length) {
      throw new BadRequestException('schema key, title and steps are required');
    }
    const stepKeys = new Set<string>();
    for (const step of schema.steps) {
      if (!step.key || stepKeys.has(step.key)) {
        throw new BadRequestException(`Invalid or duplicated step key: ${step.key}`);
      }
      stepKeys.add(step.key);
      if (!Array.isArray(step.fields)) {
        throw new BadRequestException(`Step ${step.key} fields must be an array`);
      }
      const fieldKeys = new Set<string>();
      for (const field of step.fields) {
        const key = this.asString(field['key'] ?? field['name']);
        const type = this.asString(field['type']);
        const label = this.asString(field['label']);
        if (!key || !type || !label) {
          throw new BadRequestException(`Step ${step.key} contains an invalid field`);
        }
        if (fieldKeys.has(key)) {
          throw new BadRequestException(`Duplicated field key ${key} in step ${step.key}`);
        }
        fieldKeys.add(key);
      }
    }
    for (const command of schema.commands ?? []) {
      if (!command.key || !command.label || !command.placement || !command.style || !command.event) {
        throw new BadRequestException('Every command requires key, label, placement, style and event');
      }
      if (!command.action?.type) {
        throw new BadRequestException(`Command ${command.key} requires an action`);
      }
    }
  }

  private extractBindings(schema: DynamicFormSchema) {
    const bindings: Array<Partial<DynamicFormBinding>> = [];
    for (const source of schema.dataSources ?? []) {
      if (source['type'] === 'dynamic_service' && typeof source['serviceKey'] === 'string') {
        bindings.push({
          bindingType: 'options',
          event: 'onLoad',
          targetType: 'dynamic_service',
          targetKey: source['serviceKey'],
          payloadMap: this.asObject(source['payloadMap']),
          cachePolicy: this.asObject(source['cache']),
          timeoutMs: this.asNumber(source['timeoutMs'])
        });
      }
    }
    for (const step of schema.steps ?? []) {
      for (const field of step.fields ?? []) {
        const fieldKey = this.asString(field['key'] ?? field['name']);
        const dataSource = this.asObject(field['dataSource']);
        if (dataSource?.['type'] === 'dynamic_service' && typeof dataSource['serviceKey'] === 'string') {
          bindings.push({
            fieldKey,
            bindingType: this.asBindingType(dataSource['bindingType']) ?? 'options',
            event: this.asBindingEvent(dataSource['event']) ?? 'onOpen',
            targetType: 'dynamic_service',
            targetKey: dataSource['serviceKey'],
            payloadMap: this.asObject(dataSource['payloadMap']),
            cachePolicy: this.asObject(dataSource['cache']),
            timeoutMs: this.asNumber(dataSource['timeoutMs'])
          });
        }
      }
    }
    for (const command of schema.commands ?? []) {
      const action = command.action;
      if (action?.type === 'execute_service' && action.serviceKey) {
        bindings.push({
          fieldKey: command.fieldKey ?? null,
          bindingType: 'command',
          event: 'onClick',
          targetType: 'dynamic_service',
          targetKey: action.serviceKey,
          payloadMap: action.payloadMap ?? null
        });
      }
      if (action?.type === 'execute_flow' && action.flowKey) {
        bindings.push({
          fieldKey: command.fieldKey ?? null,
          bindingType: 'command',
          event: 'onClick',
          targetType: 'flow',
          targetKey: action.flowKey,
          payloadMap: action.payloadMap ?? null
        });
      }
    }
    for (const action of schema.actions ?? []) {
      if (action.type === 'execute_service' && action.serviceKey) {
        bindings.push({
          bindingType: 'submit',
          event: 'onSubmit',
          targetType: 'dynamic_service',
          targetKey: action.serviceKey,
          payloadMap: action.payloadMap ?? null
        });
      }
      if (action.type === 'execute_flow' && action.flowKey) {
        bindings.push({
          bindingType: 'submit',
          event: 'onSubmit',
          targetType: 'flow',
          targetKey: action.flowKey,
          payloadMap: action.payloadMap ?? null
        });
      }
    }
    return bindings;
  }

  private async replaceDraftBindings(auth: AuthContext, form: DynamicForm, schema: DynamicFormSchema) {
    await this.bindings.delete({ tenantId: auth.tenant.id, formId: form.id, formVersionId: IsNull() });
    await this.saveBindings(auth, form, null, schema);
  }

  private async replaceVersionBindings(
    auth: AuthContext,
    form: DynamicForm,
    version: Pick<DynamicFormVersion, 'id'>,
    schema: DynamicFormSchema
  ) {
    await this.bindings.delete({ tenantId: auth.tenant.id, formId: form.id, formVersionId: version.id });
    await this.saveBindings(auth, form, version.id, schema);
  }

  private async saveBindings(auth: AuthContext, form: DynamicForm, versionId: string | null, schema: DynamicFormSchema) {
    const bindings = this.extractBindings(schema);
    if (!bindings.length) {
      return;
    }
    await this.bindings.save(
      bindings.map((binding) =>
        this.bindings.create({
          tenantId: auth.tenant.id,
          formId: form.id,
          formVersionId: versionId,
          fieldKey: binding.fieldKey ?? null,
          bindingType: binding.bindingType ?? 'submit',
          event: binding.event ?? 'onSubmit',
          targetType: binding.targetType ?? 'static',
          targetKey: binding.targetKey ?? null,
          targetVersionId: null,
          operation: binding.operation ?? null,
          payloadMap: binding.payloadMap ?? null,
          responseMap: binding.responseMap ?? null,
          cachePolicy: binding.cachePolicy ?? null,
          timeoutMs: binding.timeoutMs ?? null,
          required: binding.required ?? false,
          active: true
        })
      )
    );
  }

  private resolveMap(map: Record<string, unknown>, input: Record<string, unknown>, auth: AuthContext): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(map).map(([key, value]) => [key, this.resolveValue(value, input, auth)])
    );
  }

  private resolveValue(value: unknown, input: Record<string, unknown>, auth: AuthContext): unknown {
    if (typeof value === 'string') {
      const exact = value.match(/^{{\s*([^}]+)\s*}}$/);
      if (exact) {
        return this.resolvePath(exact[1].trim(), input, auth);
      }
      return value.replace(/{{\s*([^}]+)\s*}}/g, (_match, path: string) =>
        String(this.resolvePath(path.trim(), input, auth) ?? '')
      );
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, input, auth));
    }
    if (value && typeof value === 'object') {
      return this.resolveMap(value as Record<string, unknown>, input, auth);
    }
    return value;
  }

  private resolvePath(path: string, input: Record<string, unknown>, auth: AuthContext) {
    if (path === 'input') {
      return input;
    }
    const roots: Record<string, unknown> = {
      input,
      tenant: auth.tenant,
      user: auth.user
    };
    return path.split('.').reduce<unknown>((current, part) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[part];
      }
      return undefined;
    }, roots);
  }

  private resolveIdempotencyKey(
    schema: DynamicFormSchema,
    input: Record<string, unknown>,
    auth: AuthContext,
    provided?: string
  ) {
    const explicit = provided?.trim();
    if (explicit) {
      return explicit.slice(0, 180);
    }
    const template = schema.runtime?.offline?.idempotencyKey;
    if (template) {
      const resolved = this.resolveValue(template, input, auth);
      const key = String(resolved ?? '').trim();
      if (key) {
        return key.slice(0, 180);
      }
    }
    return `form:${schema.key}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`.slice(0, 180);
  }

  private sanitizeInput(input: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(input));
  }

  private toJsonObject(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    }
    return { result: value };
  }

  private asString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private asNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private asBindingType(value: unknown): DynamicFormBinding['bindingType'] | null {
    const allowed = ['options', 'default_value', 'validation', 'calculation', 'enrichment', 'submit', 'command'];
    return typeof value === 'string' && allowed.includes(value) ? (value as DynamicFormBinding['bindingType']) : null;
  }

  private asBindingEvent(value: unknown): DynamicFormBinding['event'] | null {
    const allowed = ['onLoad', 'onOpen', 'onChange', 'onBlur', 'onClick', 'onSubmit'];
    return typeof value === 'string' && allowed.includes(value) ? (value as DynamicFormBinding['event']) : null;
  }
}

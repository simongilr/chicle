import { BadRequestException } from '@nestjs/common';
import { DynamicFormsService } from './dynamic-forms.service';

const auth = {
  tenant: { id: 'tenant-1', slug: 'demo' },
  user: { id: 'user-1', email: 'owner@example.com' }
} as any;

const baseSchema = {
  schemaVersion: 1,
  kind: 'dynamic_form',
  key: 'onboarding_cliente',
  title: 'Onboarding cliente',
  runtime: {
    offline: {
      idempotencyKey: '{{input.email}}'
    }
  },
  persistence: {
    mode: 'record',
    defaultTarget: { type: 'record', recordType: 'cliente' }
  },
  steps: [
    {
      key: 'principal',
      title: 'Principal',
      fields: [
        { key: 'nombre', type: 'text', label: 'Nombre' },
        { key: 'email', type: 'email', label: 'Email' }
      ]
    }
  ],
  commands: [],
  actions: [{ event: 'onSubmit', type: 'create_record', recordType: 'cliente', payloadMap: { input: '{{input}}' } }],
  dataSources: []
};

function createRepo<T extends Record<string, unknown> = Record<string, unknown>>() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    exist: jest.fn(),
    create: jest.fn((value: T) => value),
    merge: jest.fn((target: T, source: T) => ({ ...target, ...source })),
    save: jest.fn(async (value: T) => ({ id: value['id'] ?? 'saved-id', ...value })),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn()
  };
}

function createService() {
  const forms = createRepo();
  const versions = createRepo();
  const bindings = createRepo();
  const writePolicies = createRepo();
  const runs = createRepo();
  const records = { create: jest.fn(async (_auth, body) => ({ id: 'record-1', ...body })) };
  const dynamicServices = { executeByKey: jest.fn() };
  const flows = { executeByKey: jest.fn() };
  const users = { create: jest.fn(async (_auth, body) => ({ id: 'user-2', ...body, active: true })) };
  const service = new DynamicFormsService(
    forms as any,
    versions as any,
    bindings as any,
    writePolicies as any,
    runs as any,
    records as any,
    dynamicServices as any,
    flows as any,
    users as any
  ) as any;

  return { service, forms, versions, bindings, writePolicies, runs, records, dynamicServices, flows, users };
}

describe('DynamicFormsService schema contract', () => {
  const service = Object.create(DynamicFormsService.prototype) as any;

  it('normalizes flat fields into a valid first step and fills default arrays', () => {
    const schema = service.normalizeSchema(
      {
        key: 'simple',
        title: 'Simple',
        fields: [{ key: 'serial', type: 'text', label: 'Serial' }]
      },
      'simple',
      'Simple'
    );

    expect(schema).toMatchObject({
      schemaVersion: 1,
      kind: 'dynamic_form',
      key: 'simple',
      title: 'Simple',
      steps: [{ key: 'form', fields: [{ key: 'serial', type: 'text', label: 'Serial' }] }],
      commands: [],
      actions: [],
      tests: [],
      dataSources: []
    });
    expect(() => service.validateSchema(schema)).not.toThrow();
  });

  it('rejects invalid schemas, duplicated steps, duplicated fields and commands without actions', () => {
    expect(() => service.validateSchema({ ...baseSchema, kind: 'other' })).toThrow('schema.kind must be dynamic_form');
    expect(() =>
      service.validateSchema({
        ...baseSchema,
        steps: [
          { key: 'principal', title: 'A', fields: [] },
          { key: 'principal', title: 'B', fields: [] }
        ]
      })
    ).toThrow('Invalid or duplicated step key');
    expect(() =>
      service.validateSchema({
        ...baseSchema,
        steps: [
          {
            key: 'principal',
            title: 'Principal',
            fields: [
              { key: 'email', type: 'email', label: 'Email' },
              { key: 'email', type: 'text', label: 'Email duplicado' }
            ]
          }
        ]
      })
    ).toThrow('Duplicated field key email');
    expect(() =>
      service.validateSchema({
        ...baseSchema,
        steps: [
          { key: 'datos', title: 'Datos', fields: [{ key: 'email', type: 'email', label: 'Email' }] },
          { key: 'confirmacion', title: 'Confirmación', fields: [{ key: 'email', type: 'text', label: 'Email repetido' }] }
        ]
      })
    ).toThrow('Duplicated field key email');
    expect(() =>
      service.validateSchema({
        ...baseSchema,
        commands: [{ key: 'aprobar', label: 'Aprobar', placement: 'toolbar', style: 'primary', event: 'onClick' }]
      })
    ).toThrow('Command aprobar requires an action');
  });

  it('extracts datasource, command and submit bindings from the same JSON contract', () => {
    const schema = service.normalizeSchema(
      {
        ...baseSchema,
        dataSources: [
          {
            type: 'dynamic_service',
            serviceKey: 'listar_estados',
            payloadMap: { q: '{{input.q}}' },
            cache: { ttlSeconds: 60 },
            timeoutMs: 7000
          }
        ],
        steps: [
          {
            key: 'principal',
            title: 'Principal',
            fields: [
              {
                key: 'estado',
                type: 'select',
                label: 'Estado',
                dataSource: {
                  type: 'dynamic_service',
                  serviceKey: 'listar_estados',
                  bindingType: 'options',
                  event: 'onOpen'
                }
              }
            ]
          }
        ],
        commands: [
          {
            key: 'aprobar',
            label: 'Aprobar',
            placement: 'form_toolbar',
            style: 'primary',
            event: 'onClick',
            action: { type: 'execute_flow', flowKey: 'flow_aprobar', payloadMap: { input: '{{input}}' } }
          }
        ],
        actions: [
          { event: 'onSubmit', type: 'execute_service', serviceKey: 'guardar_formulario' },
          { event: 'onSubmit', type: 'execute_flow', flowKey: 'flow_post_submit' }
        ]
      },
      'formulario',
      'Formulario'
    );

    expect(service.extractBindings(schema)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bindingType: 'options', event: 'onLoad', targetKey: 'listar_estados' }),
        expect.objectContaining({ fieldKey: 'estado', bindingType: 'options', event: 'onOpen', targetKey: 'listar_estados' }),
        expect.objectContaining({ bindingType: 'command', event: 'onClick', targetType: 'flow', targetKey: 'flow_aprobar' }),
        expect.objectContaining({ bindingType: 'submit', targetType: 'dynamic_service', targetKey: 'guardar_formulario' }),
        expect.objectContaining({ bindingType: 'submit', targetType: 'flow', targetKey: 'flow_post_submit' })
      ])
    );
  });

  it('resolves templates from input, tenant and user inside nested maps and arrays', () => {
    expect(
      service.resolveMap(
        {
          email: '{{input.email}}',
          tenantSlug: '{{tenant.slug}}',
          actor: '{{user.email}}',
          label: 'cliente {{input.name}}',
          list: ['{{input.email}}', '{{tenant.id}}'],
          nested: { id: '{{input.id}}' }
        },
        { id: 'client-1', email: 'client@example.com', name: 'Simon' },
        auth
      )
    ).toEqual({
      email: 'client@example.com',
      tenantSlug: 'demo',
      actor: 'owner@example.com',
      label: 'cliente Simon',
      list: ['client@example.com', 'tenant-1'],
      nested: { id: 'client-1' }
    });
  });
});

describe('DynamicFormsService runtime submit', () => {
  it('executes create_record submits and stores successful runs with deterministic idempotency', async () => {
    const { service, forms, versions, runs, records } = createService();
    const form = { id: 'form-1', tenantId: 'tenant-1', key: 'onboarding_cliente', title: 'Onboarding', version: 1, schema: baseSchema };
    forms.findOne.mockResolvedValue(form);
    versions.findOne.mockResolvedValue(null);
    runs.findOne.mockResolvedValue(null);

    const output = await service.submitByKey(auth, 'onboarding_cliente', {
      input: { nombre: 'Simon', email: 'simon@example.com' }
    });

    expect(records.create).toHaveBeenCalledWith(
      auth,
      expect.objectContaining({
        recordType: 'cliente',
        formKey: 'onboarding_cliente',
        idempotencyKey: 'simon@example.com',
        data: { nombre: 'Simon', email: 'simon@example.com' }
      })
    );
    expect(runs.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', idempotencyKey: 'simon@example.com' }));
    expect(output).toMatchObject({ id: 'record-1', recordType: 'cliente' });
  });

  it('returns an existing run for repeated idempotency keys without executing actions again', async () => {
    const { service, forms, versions, runs, records, dynamicServices, flows } = createService();
    forms.findOne.mockResolvedValue({ id: 'form-1', tenantId: 'tenant-1', key: 'onboarding_cliente', title: 'Onboarding', version: 1, schema: baseSchema });
    versions.findOne.mockResolvedValue(null);
    runs.findOne.mockResolvedValue({ id: 'run-1', output: { ok: true, cached: true } });

    await expect(
      service.submitByKey(auth, 'onboarding_cliente', {
        input: { email: 'simon@example.com' },
        idempotencyKey: 'same-key'
      })
    ).resolves.toEqual({ ok: true, cached: true });
    expect(records.create).not.toHaveBeenCalled();
    expect(dynamicServices.executeByKey).not.toHaveBeenCalled();
    expect(flows.executeByKey).not.toHaveBeenCalled();
    expect(runs.save).not.toHaveBeenCalled();
  });

  it('executes service-backed submits with resolved payload maps', async () => {
    const { service, forms, versions, runs, dynamicServices } = createService();
    const schema = {
      ...baseSchema,
      persistence: { mode: 'service', defaultTarget: { type: 'dynamic_service', serviceKey: 'validar_cliente' } },
      actions: [{ event: 'onSubmit', type: 'execute_service', serviceKey: 'validar_cliente', payloadMap: { serial: '{{input.serial}}' } }]
    };
    forms.findOne.mockResolvedValue({ id: 'form-1', tenantId: 'tenant-1', key: 'consulta', title: 'Consulta', version: 1, schema });
    versions.findOne.mockResolvedValue(null);
    runs.findOne.mockResolvedValue(null);
    dynamicServices.executeByKey.mockResolvedValue({ status: 'success', responseSnapshot: { result: { valid: true } } });

    await service.submitByKey(auth, 'consulta', { input: { serial: 'ABC-123' }, idempotencyKey: 'service-run' });

    expect(dynamicServices.executeByKey).toHaveBeenCalledWith(auth, 'validar_cliente', {
      context: { serial: 'ABC-123' }
    });
    expect(runs.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        output: { status: 'success', responseSnapshot: { result: { valid: true } } }
      })
    );
  });

  it('marks submit as failed when the dynamic service run fails internally', async () => {
    const { service, forms, versions, runs, dynamicServices } = createService();
    const schema = {
      ...baseSchema,
      persistence: { mode: 'service', defaultTarget: { type: 'dynamic_service', serviceKey: 'guardar_cliente' } },
      actions: [{ event: 'onSubmit', type: 'execute_service', serviceKey: 'guardar_cliente', payloadMap: { nombre: '{{input.nombre}}' } }]
    };
    forms.findOne.mockResolvedValue({ id: 'form-1', tenantId: 'tenant-1', key: 'cliente', title: 'Cliente', version: 1, schema });
    versions.findOne.mockResolvedValue(null);
    runs.findOne.mockResolvedValue(null);
    dynamicServices.executeByKey.mockResolvedValue({
      status: 'failed',
      error: 'Incorrect integer value'
    });

    await expect(
      service.submitByKey(auth, 'cliente', { input: { nombre: 'Simon' }, idempotencyKey: 'service-failed-run' })
    ).rejects.toThrow('Incorrect integer value');
    expect(runs.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        idempotencyKey: 'service-failed-run',
        error: { message: 'Incorrect integer value' }
      })
    );
  });

  it('executes flow-backed submits and passes form trigger metadata', async () => {
    const { service, forms, versions, runs, flows } = createService();
    const schema = {
      ...baseSchema,
      persistence: { mode: 'flow', defaultTarget: { type: 'flow', flowKey: 'flow_aprobar' } },
      actions: [{ event: 'onSubmit', type: 'execute_flow', flowKey: 'flow_aprobar', payloadMap: { decision: '{{input.decision}}' } }]
    };
    forms.findOne.mockResolvedValue({ id: 'form-1', tenantId: 'tenant-1', key: 'aprobacion', title: 'Aprobación', version: 1, schema });
    versions.findOne.mockResolvedValue(null);
    runs.findOne.mockResolvedValue(null);
    flows.executeByKey.mockResolvedValue({ status: 'success', output: { approved: true } });

    await service.submitByKey(auth, 'aprobacion', { input: { decision: 'aprobar' }, idempotencyKey: 'flow-run' });

    expect(flows.executeByKey).toHaveBeenCalledWith(auth, 'flow_aprobar', {
      input: { decision: 'aprobar' },
      triggerType: 'form',
      triggerKey: 'aprobacion'
    });
  });

  it('executes secure user creation submits instead of writing password hashes directly', async () => {
    const { service, forms, versions, runs, users } = createService();
    const schema = {
      ...baseSchema,
      key: 'form_users',
      persistence: { mode: 'submit_action' },
      actions: [
        {
          event: 'onSubmit',
          type: 'create_user',
          payloadMap: {
            email: '{{input.email}}',
            name: '{{input.name}}',
            password: '{{input.password}}',
            roles: ['{{input.role}}']
          }
        }
      ]
    };
    forms.findOne.mockResolvedValue({ id: 'form-1', tenantId: 'tenant-1', key: 'form_users', title: 'Users', version: 1, schema });
    versions.findOne.mockResolvedValue(null);
    runs.findOne.mockResolvedValue(null);

    const output = await service.submitByKey(auth, 'form_users', {
      input: { email: 'viewer@example.com', name: 'Viewer', password: 'CambiaEstaClave123', role: 'viewer' },
      idempotencyKey: 'viewer@example.com'
    });

    expect(users.create).toHaveBeenCalledWith(auth, {
      email: 'viewer@example.com',
      name: 'Viewer',
      password: 'CambiaEstaClave123',
      roles: ['viewer']
    });
    expect(output).toMatchObject({ id: 'user-2', email: 'viewer@example.com', active: true });
  });

  it('executes command actions instead of onSubmit actions when commandKey is provided', async () => {
    const { service, forms, versions, runs, flows, records } = createService();
    const schema = {
      ...baseSchema,
      commands: [
        {
          key: 'aprobar',
          label: 'Aprobar',
          placement: 'form_toolbar',
          style: 'primary',
          event: 'onClick',
          action: { type: 'execute_flow', flowKey: 'flow_aprobar', payloadMap: { decision: 'approved', input: '{{input}}' } }
        }
      ],
      actions: [{ event: 'onSubmit', type: 'create_record', recordType: 'solicitud' }]
    };
    forms.findOne.mockResolvedValue({ id: 'form-1', tenantId: 'tenant-1', key: 'aprobacion', title: 'Aprobación', version: 1, schema });
    versions.findOne.mockResolvedValue(null);
    runs.findOne.mockResolvedValue(null);
    flows.executeByKey.mockResolvedValue({ status: 'success', output: { approved: true } });

    await service.submitByKey(auth, 'aprobacion', {
      commandKey: 'aprobar',
      input: { id: 'sol-1' },
      idempotencyKey: 'command-run'
    });

    expect(flows.executeByKey).toHaveBeenCalledWith(auth, 'flow_aprobar', {
      input: { decision: 'approved', input: { id: 'sol-1' } },
      triggerType: 'form',
      triggerKey: 'aprobacion'
    });
    expect(records.create).not.toHaveBeenCalled();
  });

  it('stores failed runs and rethrows action errors', async () => {
    const { service, forms, versions, runs, dynamicServices } = createService();
    const schema = {
      ...baseSchema,
      actions: [{ event: 'onSubmit', type: 'execute_service', serviceKey: 'servicio_roto' }]
    };
    forms.findOne.mockResolvedValue({ id: 'form-1', tenantId: 'tenant-1', key: 'consulta', title: 'Consulta', version: 1, schema });
    versions.findOne.mockResolvedValue(null);
    runs.findOne.mockResolvedValue(null);
    dynamicServices.executeByKey.mockRejectedValue(new Error('boom'));

    await expect(service.submitByKey(auth, 'consulta', { input: {}, idempotencyKey: 'failed-run' })).rejects.toThrow('boom');
    expect(runs.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        idempotencyKey: 'failed-run',
        error: { message: 'boom' }
      })
    );
  });
});

describe('DynamicFormsService JSON authoring lifecycle', () => {
  it('creates a form from JSON and stores draft bindings', async () => {
    const { service, forms, bindings } = createService();
    forms.findOne.mockResolvedValue(null);

    const response = await service.upsertFromJson(auth, {
      document: {
        ...baseSchema,
        actions: [{ event: 'onSubmit', type: 'execute_service', serviceKey: 'guardar_cliente' }]
      },
      publish: false
    });

    expect(response).toMatchObject({ artifactType: 'dynamic_form', key: 'onboarding_cliente', published: false });
    expect(forms.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        key: 'onboarding_cliente',
        title: 'Onboarding cliente',
        status: 'draft'
      })
    );
    expect(bindings.delete).toHaveBeenCalledWith({ tenantId: 'tenant-1', formId: 'saved-id', formVersionId: expect.anything() });
    expect(bindings.save).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ targetType: 'dynamic_service', targetKey: 'guardar_cliente' })])
    );
  });

  it('releases a trashed form key before creating a fresh JSON draft', async () => {
    const { service, forms } = createService();
    forms.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'form-1', tenantId: 'tenant-1', key: 'onboarding_cliente', trashedAt: new Date() })
      .mockResolvedValueOnce(null);

    const response = await service.upsertFromJson(auth, { document: baseSchema });

    expect(response).toMatchObject({ artifactType: 'dynamic_form', key: 'onboarding_cliente' });
    expect(forms.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'form-1',
        key: expect.stringMatching(/^onboarding_cliente__trashed_/),
        metadata: expect.objectContaining({ trash: { originalKey: 'onboarding_cliente' } })
      })
    );
    expect(forms.save).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'onboarding_cliente',
        title: 'Onboarding cliente'
      })
    );
  });

  it('publishes JSON-only forms by creating a version and marking the form published', async () => {
    const { service, forms, versions, bindings } = createService();
    const publishSchema = {
      ...baseSchema,
      actions: [{ event: 'onSubmit', type: 'execute_service', serviceKey: 'guardar_cliente' }]
    };
    const form = {
      id: 'form-1',
      tenantId: 'tenant-1',
      key: 'onboarding_cliente',
      title: 'Onboarding cliente',
      version: 1,
      schema: publishSchema,
      published: false,
      status: 'draft'
    };
    forms.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(form)
      .mockResolvedValueOnce(form);
    forms.save.mockResolvedValue(form);
    versions.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'version-1', tenantId: 'tenant-1', formId: 'form-1', version: 1, status: 'draft', schema: publishSchema });
    versions.save.mockResolvedValue({ id: 'version-1', tenantId: 'tenant-1', formId: 'form-1', version: 1, status: 'draft', schema: publishSchema });
    versions.findOneOrFail.mockResolvedValue({ id: 'version-1', version: 1, status: 'published', schema: publishSchema });
    const execute = jest.fn(async () => undefined);
    forms.createQueryBuilder.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      execute
    });

    const response = await service.upsertFromJson(auth, { document: publishSchema, publish: true });

    expect(response).toMatchObject({ artifactType: 'dynamic_form', key: 'onboarding_cliente', published: true });
    expect(versions.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        formId: 'form-1',
        version: 1,
        status: 'draft',
        createdByUserId: 'user-1'
      })
    );
    expect(versions.update).toHaveBeenCalledWith(
      { tenantId: 'tenant-1', formId: 'form-1', status: 'published' },
      { status: 'archived' }
    );
    expect(execute).toHaveBeenCalled();
    expect(bindings.save).toHaveBeenCalled();
  });
});

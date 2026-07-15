import { BadRequestException } from '@nestjs/common';
import { Flow } from './flow.entity';
import { FlowExpressionEngine } from './flow-expression-engine.service';
import { FlowsService } from './flows.service';

describe('FlowsService input contract', () => {
  const service = Object.create(FlowsService.prototype) as any;

  const flow = {
    metadata: {
      inputFields: [
        { key: 'email', label: 'Correo', type: 'email', required: true },
        { key: 'total', label: 'Total', type: 'number', required: false }
      ]
    }
  } as unknown as Flow;

  it('builds a versionable input schema from visual fields', () => {
    expect(service.inputSchemaFromFlow(flow)).toMatchObject({
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
        total: { type: 'number' }
      }
    });
  });

  it('rejects missing or invalid inputs before running a flow', () => {
    const schema = service.inputSchemaFromFlow(flow);
    expect(() => service.validateFlowInput({}, schema)).toThrow(BadRequestException);
    expect(() => service.validateFlowInput({ email: 'invalid' }, schema)).toThrow(BadRequestException);
    expect(() => service.validateFlowInput({ email: 'person@example.com', total: '12' }, schema)).toThrow(
      BadRequestException
    );
    expect(() => service.validateFlowInput({ email: 'person@example.com', total: 12 }, schema)).not.toThrow();
  });

  it('rejects duplicate visual input keys', () => {
    expect(() =>
      service.cleanMetadata({
        inputFields: [
          { key: 'email', type: 'email' },
          { key: 'email', type: 'text' }
        ]
      })
    ).toThrow(BadRequestException);
  });

  it('evaluates assertions against nested flow output', () => {
    const actual = {
      status: 'success',
      output: {
        body: {
          ok: true,
          role: 'owner',
          total: 125
        }
      }
    };

    expect(
      service.evaluateTestAssertion({ path: 'output.body.role', operator: 'equals', expected: 'owner' }, actual).passed
    ).toBe(true);
    expect(
      service.evaluateTestAssertion({ path: 'output.body.total', operator: 'greater_than', expected: 100 }, actual)
        .passed
    ).toBe(true);
    expect(service.evaluateTestAssertion({ path: 'output.body.missing', operator: 'exists' }, actual).passed).toBe(
      false
    );
  });

  it('matches expected output as a partial object', () => {
    expect(
      service.deepContains(
        { status: 'success', body: { ok: true, role: 'owner', extra: 1 } },
        { body: { ok: true, role: 'owner' } }
      )
    ).toBe(true);
    expect(service.deepContains({ status: 'success', body: { ok: false } }, { body: { ok: true } })).toBe(false);
  });

  it('hashes webhook secrets and never returns the hash to the client', () => {
    const config = service.cleanTriggerConfig('http', {
      secret: 'super-secret-value',
      inputMode: 'payload'
    });
    expect(config.secret).toBeUndefined();
    expect(config.secretHash).toHaveLength(64);

    const publicTrigger = service.publicTrigger({
      type: 'http',
      config
    });
    expect(publicTrigger.config.secretHash).toBeUndefined();
    expect(publicTrigger.secretConfigured).toBe(true);
  });

  it('rejects weak webhook secrets', () => {
    expect(() => service.cleanTriggerConfig('http', { secret: 'short-secret' })).toThrow(BadRequestException);
  });

  it('validates an editable authoring definition before replacing draft steps', () => {
    expect(
      service.cleanAuthoringSteps([
        {
          key: 'consultar_usuario',
          name: 'Consultar usuario',
          type: 'dynamic_service',
          nextStepKey: 'respuesta'
        },
        {
          key: 'respuesta',
          name: 'Responder al front',
          type: 'response'
        }
      ])
    ).toHaveLength(2);

    expect(() =>
      service.cleanAuthoringSteps([
        {
          key: 'consultar_usuario',
          name: 'Consultar usuario',
          type: 'dynamic_service',
          nextStepKey: 'paso_inexistente'
        }
      ])
    ).toThrow(BadRequestException);
  });

  it('compares nested immutable definitions with precise paths', () => {
    const changes = service.definitionChanges(
      {
        name: 'Version 1',
        steps: [{ key: 'validate', config: { required: true } }]
      },
      {
        name: 'Version 2',
        steps: [{ key: 'validate', config: { required: false } }, { key: 'response' }]
      }
    );

    expect(changes.map((change: { path: string }) => change.path)).toEqual(
      expect.arrayContaining(['$.name', '$.steps[0].config.required', '$.steps[1]'])
    );
  });

  it('reconstructs visual inputs from an immutable version schema', () => {
    expect(
      service.inputFieldsFromSchema({
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', title: 'Correo' },
          active: { type: 'boolean', title: 'Activo' }
        }
      })
    ).toEqual([
      {
        key: 'email',
        label: 'Correo',
        type: 'email',
        required: true,
        example: ''
      },
      {
        key: 'active',
        label: 'Activo',
        type: 'boolean',
        required: false,
        example: ''
      }
    ]);
  });

  it('bounds observability filters and rejects inverted ranges', () => {
    expect(service.cleanMetricsQuery({ status: 'success', limit: 99999 })).toMatchObject({
      status: 'success',
      limit: 5000
    });
    expect(() =>
      service.cleanMetricsQuery({
        from: '2026-07-02T12:00:00.000Z',
        to: '2026-07-01T12:00:00.000Z'
      })
    ).toThrow(BadRequestException);
  });
});

describe('FlowsService runtime recipes', () => {
  const auth = {
    tenant: { id: 'tenant-1', slug: 'demo' },
    user: { id: 'user-1', email: 'owner@example.com' }
  };

  const flow = {
    id: 'flow-1',
    key: 'validate_user',
    name: 'Validate user',
    status: 'active',
    runtimeConfig: {}
  } as Flow;

  function createRuntimeService() {
    const dynamicServices = {
      executeByKey: jest.fn(),
      list: jest.fn()
    };
    const confisys = {
      get: jest.fn((_key: string, fallback: unknown) => fallback)
    };
    const outbox = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'event-1', ...value }))
    };
    const service = Object.create(FlowsService.prototype) as any;
    service.dynamicServices = dynamicServices;
    service.expressions = new FlowExpressionEngine(confisys as never);
    service.confisys = confisys;
    service.outbox = outbox;
    service.flows = { findOne: jest.fn() };
    service.versions = { findOne: jest.fn(), exist: jest.fn() };
    return { service, dynamicServices, confisys, outbox };
  }

  it('previews a complete flow that reuses a dynamic service, validates, calculates, decides and responds', async () => {
    const { service, dynamicServices } = createRuntimeService();
    dynamicServices.executeByKey.mockResolvedValue({
      status: 'success',
      durationMs: 7,
      responseSnapshot: {
        result: {
          email: 'person@example.com',
          active: true,
          score: 91
        }
      }
    });

    const preview = await service.previewDefinition(
      auth,
      flow,
      {
        key: 'validate_user',
        name: 'Validate user',
        version: 1,
        inputSchema: {
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } }
        },
        steps: [
          { key: 'start', type: 'start', next: 'lookup_user' },
          {
            key: 'lookup_user',
            type: 'dynamic_service',
            serviceKey: 'buscar_usuario',
            inputMap: { email: '{{input.email}}' },
            outputKey: 'lookup',
            next: 'validate_user'
          },
          {
            key: 'validate_user',
            type: 'validation',
            config: { field: 'steps.lookup.response.result.active', operator: 'equals', value: true },
            next: 'score_user',
            onFalse: 'denied'
          },
          {
            key: 'score_user',
            type: 'formula',
            config: { rule: { '+': [{ var: 'steps.lookup.response.result.score' }, 1] } },
            outputKey: 'score',
            next: 'decide'
          },
          {
            key: 'decide',
            type: 'decision',
            config: { rule: { '>=': [{ var: 'steps.score' }, 90] } },
            onTrue: 'allowed',
            onFalse: 'denied'
          },
          {
            key: 'allowed',
            type: 'response',
            config: {
              status: 'success',
              body: {
                ok: true,
                email: '{{steps.lookup.response.result.email}}',
                score: '{{steps.score}}'
              }
            }
          },
          {
            key: 'denied',
            type: 'response',
            config: { status: 'denied', body: { ok: false } }
          }
        ]
      },
      { email: 'person@example.com' },
      null,
      ['validate_user']
    );

    expect(preview.status).toBe('success');
    expect(preview.output.body).toEqual({
      ok: true,
      email: 'person@example.com',
      score: 92
    });
    expect(preview.steps.map((step: { stepKey: string }) => step.stepKey)).toEqual([
      'start',
      'lookup_user',
      'validate_user',
      'score_user',
      'decide',
      'allowed'
    ]);
    expect(dynamicServices.executeByKey).toHaveBeenCalledWith(
      auth,
      'buscar_usuario',
      { context: { email: 'person@example.com' } },
      { skipResourceAccess: true }
    );
  });

  it('runs parallel branches with different published services and aggregates branch outputs', async () => {
    const { service, dynamicServices } = createRuntimeService();
    dynamicServices.executeByKey.mockImplementation(async (_auth, serviceKey: string) => ({
      status: 'success',
      durationMs: serviceKey === 'consultar_usuario' ? 5 : 8,
      responseSnapshot: { serviceKey }
    }));

    const result = await service.executeStep(
      auth,
      {
        key: 'consultas_paralelas',
        type: 'parallel',
        config: {
          branches: [
            { key: 'usuario', serviceKey: 'consultar_usuario', inputMap: { email: '{{input.email}}' } },
            { key: 'roles', serviceKey: 'consultar_roles', inputMap: { email: '{{input.email}}' } }
          ]
        }
      },
      { email: 'person@example.com' },
      {
        tenant: auth.tenant,
        user: auth.user,
        input: { email: 'person@example.com' },
        steps: {},
        flowStack: ['parent'],
        compensations: []
      },
      { mode: 'preview' }
    );

    expect(result.output).toMatchObject({
      ok: true,
      results: [
        { key: 'usuario', serviceKey: 'consultar_usuario', ok: true, response: { serviceKey: 'consultar_usuario' } },
        { key: 'roles', serviceKey: 'consultar_roles', ok: true, response: { serviceKey: 'consultar_roles' } }
      ]
    });
  });

  it('iterates foreach items with bounded concurrency and maps each item into a service input', async () => {
    const { service, dynamicServices } = createRuntimeService();
    dynamicServices.executeByKey.mockImplementation(async (_auth, serviceKey: string, request: any) => ({
      status: 'success',
      responseSnapshot: {
        serviceKey,
        received: request.context
      }
    }));

    const result = await service.executeStep(
      auth,
      {
        key: 'notificar_items',
        type: 'foreach',
        config: {
          itemsPath: 'input.items',
          serviceKey: 'notificar_item',
          itemInputKey: 'record',
          concurrency: 2,
          inputMap: { tenant: '{{tenant.slug}}' }
        }
      },
      {},
      {
        tenant: auth.tenant,
        user: auth.user,
        input: { items: [{ id: 'a' }, { id: 'b' }] },
        steps: {},
        flowStack: ['parent'],
        compensations: []
      },
      { mode: 'preview' }
    );

    expect(result.output).toMatchObject({
      ok: true,
      count: 2,
      results: [
        { index: 0, item: { id: 'a' }, ok: true },
        { index: 1, item: { id: 'b' }, ok: true }
      ]
    });
    expect(dynamicServices.executeByKey).toHaveBeenNthCalledWith(
      1,
      auth,
      'notificar_item',
      { context: { tenant: 'demo', record: { id: 'a' }, index: 0 } },
      { skipResourceAccess: true }
    );
  });

  it('previews a published subflow and blocks recursive calls', async () => {
    const { service } = createRuntimeService();
    service.flows.findOne.mockResolvedValue({
      id: 'child-1',
      key: 'child_flow',
      name: 'Child flow',
      status: 'active',
      runtimeConfig: {}
    });
    service.versions.findOne.mockResolvedValue({
      id: 'version-1',
      definition: {
        key: 'child_flow',
        name: 'Child flow',
        version: 1,
        steps: [
          { key: 'start', type: 'start', next: 'respond' },
          { key: 'respond', type: 'response', config: { body: { child: true, value: '{{input.value}}' } } }
        ]
      }
    });

    await expect(
      service.executeStep(
        auth,
        { key: 'child', type: 'subflow', config: { flowKey: 'child_flow' } },
        { value: 42 },
        {
          tenant: auth.tenant,
          user: auth.user,
          input: {},
          steps: {},
          flowStack: ['parent_flow'],
          compensations: []
        },
        { mode: 'preview' }
      )
    ).resolves.toMatchObject({
      output: {
        flowKey: 'child_flow',
        preview: true,
        output: { body: { child: true, value: 42 } }
      }
    });

    await expect(
      service.executeStep(
        auth,
        { key: 'recursive', type: 'subflow', config: { flowKey: 'child_flow' } },
        {},
        {
          tenant: auth.tenant,
          user: auth.user,
          input: {},
          steps: {},
          flowStack: ['parent_flow', 'child_flow'],
          compensations: []
        },
        { mode: 'preview' }
      )
    ).rejects.toThrow('Recursive subflow detected');
  });

  it('persists emit_event only during real runs and uses an idempotency key per run and step', async () => {
    const { service, outbox } = createRuntimeService();
    outbox.findOne.mockResolvedValue(null);

    const result = await service.executeStep(
      auth,
      {
        key: 'emitir',
        type: 'emit_event',
        config: {
          eventKey: 'user.validated',
          aggregateType: 'user',
          payload: { email: '{{input.email}}', result: '{{steps.lookup.ok}}' }
        }
      },
      { email: 'person@example.com' },
      {
        tenant: auth.tenant,
        user: auth.user,
        input: { email: 'person@example.com' },
        steps: { lookup: { ok: true } },
        flowStack: ['parent'],
        compensations: []
      },
      { mode: 'run', runId: 'run-1', rootRunId: 'run-1' }
    );

    expect(result.output).toMatchObject({
      eventKey: 'user.validated',
      payload: { email: 'person@example.com', result: true },
      persisted: true
    });
    expect(outbox.findOne).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', idempotencyKey: 'flow:run-1:emitir' }
    });
    expect(outbox.save).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'user.validated',
        aggregateType: 'user',
        aggregateId: 'run-1',
        idempotencyKey: 'flow:run-1:emitir'
      })
    );
  });

  it('retries a transient dynamic service failure with bounded retry settings', async () => {
    const { service, dynamicServices } = createRuntimeService();
    dynamicServices.executeByKey
      .mockResolvedValueOnce({ status: 'failed', error: 'temporary' })
      .mockResolvedValueOnce({ status: 'success', responseSnapshot: { ok: true }, durationMs: 3 });

    await expect(
      service.executeDynamicServiceStep(auth, 'servicio_inestable', { value: 1 }, { retry: { attempts: 1 } })
    ).resolves.toMatchObject({
      status: 'success',
      responseSnapshot: { ok: true }
    });
    expect(dynamicServices.executeByKey).toHaveBeenCalledTimes(2);
  });
});

describe('FlowsService version validation', () => {
  const auth = {
    tenant: { id: 'tenant-1', slug: 'demo' },
    user: { id: 'user-1' }
  };

  function createValidationService() {
    const service = Object.create(FlowsService.prototype) as any;
    service.flows = {
      findOne: jest.fn(async ({ where }: any) => {
        if (where.key === 'published_child') {
          return { id: 'child-1', key: 'published_child' };
        }
        return { id: where.id ?? 'parent-1', key: 'parent_flow' };
      })
    };
    service.versions = { exist: jest.fn(async () => true) };
    service.dynamicServices = {
      list: jest.fn(async () => [
        { key: 'buscar_usuario', active: true, publishedVersion: { version: 1 } },
        { key: 'buscar_roles', active: true, publishedVersion: { version: 1 } },
        { key: 'notificar_item', active: true, publishedVersion: { version: 1 } }
      ])
    };
    service.expressions = new FlowExpressionEngine({
      get: (_key: string, fallback: unknown) => fallback
    } as never);
    return service;
  }

  it('accepts a draft that mixes services, branches, foreach, subflow and event emission', async () => {
    const service = createValidationService();
    const steps = [
      {
        flowId: 'parent-1',
        key: 'buscar',
        type: 'dynamic_service',
        config: { serviceKey: 'buscar_usuario' },
        nextStepKey: 'paralelo'
      },
      {
        flowId: 'parent-1',
        key: 'paralelo',
        type: 'parallel',
        config: {
          branches: [
            { serviceKey: 'buscar_usuario' },
            { serviceKey: 'buscar_roles' }
          ]
        },
        nextStepKey: 'foreach'
      },
      {
        flowId: 'parent-1',
        key: 'foreach',
        type: 'foreach',
        config: { itemsPath: 'input.items', serviceKey: 'notificar_item' },
        nextStepKey: 'child'
      },
      {
        flowId: 'parent-1',
        key: 'child',
        type: 'subflow',
        config: { flowKey: 'published_child' },
        nextStepKey: 'event'
      },
      {
        flowId: 'parent-1',
        key: 'event',
        type: 'emit_event',
        config: { eventKey: 'flow.finished' }
      }
    ];

    await expect(service.validateDraftForVersion(auth, steps)).resolves.toBeUndefined();
  });

  it('rejects drafts that reference unavailable dynamic services', async () => {
    const service = createValidationService();

    await expect(
      service.validateDraftForVersion(auth, [
        {
          flowId: 'parent-1',
          key: 'missing_service',
          type: 'dynamic_service',
          config: { serviceKey: 'servicio_no_publicado' }
        }
      ])
    ).rejects.toThrow('Flow requires active published service servicio_no_publicado');
  });

  it('rejects invalid branching definitions before versioning', async () => {
    const service = createValidationService();

    await expect(
      service.validateDraftForVersion(auth, [
        {
          flowId: 'parent-1',
          key: 'decision',
          type: 'decision',
          config: { rule: { var: 'input.ok' } },
          onTrueStepKey: 'end',
          onFalseStepKey: 'end'
        }
      ])
    ).rejects.toThrow('requires different true and false targets');

    await expect(
      service.validateDraftForVersion(auth, [
        {
          flowId: 'parent-1',
          key: 'paralelo',
          type: 'parallel',
          config: { branches: [{ serviceKey: 'buscar_usuario' }] }
        }
      ])
    ).rejects.toThrow('requires 2-20 branches');
  });
});

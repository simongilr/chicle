import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantRequest } from './ai-assistant.types';
import { DynamicFormsService } from '../dynamic-forms/dynamic-forms.service';

const service = Object.create(AiAssistantService.prototype) as any;
const formValidator = Object.create(DynamicFormsService.prototype) as any;
const auth = {
  user: { systemRole: 'owner' },
  roles: [],
  permissions: []
} as any;

const serviceTables = [
  {
    name: 'users',
    columns: ['id', 'tenantId', 'email', 'name', 'passwordHash', 'systemRole', 'active', 'createdAt', 'updatedAt']
  },
  {
    name: 'user_roles',
    columns: ['id', 'tenantId', 'userId', 'roleId', 'createdAt']
  },
  {
    name: 'roles',
    columns: ['id', 'tenantId', 'key', 'name', 'description', 'builtIn', 'createdAt', 'updatedAt']
  },
  {
    name: 'confisys',
    columns: ['id', 'key', 'value', 'description']
  },
  {
    name: 'menus',
    columns: ['id', 'tenantId', 'key', 'label', 'route', 'enabled']
  },
  {
    name: 'records',
    columns: ['id', 'tenantId', 'recordType', 'formKey', 'data', 'metadata']
  },
  {
    name: 'dynamic_services',
    columns: ['id', 'tenantId', 'key', 'name', 'description', 'active']
  }
];

function request(prompt: string, conversation: AiAssistantRequest['conversation'] = []): AiAssistantRequest {
  return {
    prompt,
    scope: 'services',
    route: '/services',
    conversation,
    screenState: {
      availableTables: serviceTables
    }
  };
}

function flowRequest(prompt: string, conversation: AiAssistantRequest['conversation'] = []): AiAssistantRequest {
  return {
    prompt,
    scope: 'flows',
    route: '/flows',
    conversation,
    screenState: {
      availableServices: [
        { key: 'buscar_usuario', name: 'Buscar usuario', hasPublishedVersion: true },
        { key: 'buscar_roles', name: 'Buscar roles', hasPublishedVersion: true },
        { key: 'notificar_item', name: 'Notificar item', hasPublishedVersion: true }
      ],
      availableFlows: [{ key: 'validar_cliente', name: 'Validar cliente', hasPublishedVersion: true }]
    }
  };
}

function formRequest(prompt: string, conversation: AiAssistantRequest['conversation'] = []): AiAssistantRequest {
  return {
    prompt,
    scope: 'forms',
    route: '/forms',
    conversation,
    screenState: {
      availableServices: [
        { key: 'buscar_usuario', name: 'Buscar usuario', hasPublishedVersion: true },
        { key: 'validar_cliente', name: 'Validar cliente', hasPublishedVersion: true },
        { key: 'guardar_evidencia', name: 'Guardar evidencia', hasPublishedVersion: true }
      ],
      availableFlows: [{ key: 'flow_validar_cliente', name: 'Validar cliente', hasPublishedVersion: true }],
      tables: [
        {
          name: 'custom_clients',
          scope: 'tenant',
          columns: [
            { name: 'id', type: 'varchar', nullable: false, primary: true },
            { name: 'tenantId', type: 'varchar', nullable: false, primary: false },
            { name: 'name', type: 'varchar', nullable: false, primary: false },
            { name: 'email', type: 'varchar', nullable: false, primary: false },
            { name: 'phone', type: 'varchar', nullable: true, primary: false },
            { name: 'active', type: 'tinyint', nullable: false, primary: false },
            { name: 'createdAt', type: 'datetime', nullable: false, primary: false }
          ]
        },
        {
          name: 'users',
          scope: 'tenant',
          columns: [
            { name: 'id', type: 'varchar', nullable: false, primary: true },
            { name: 'tenantId', type: 'varchar', nullable: false, primary: false },
            { name: 'email', type: 'varchar', nullable: false, primary: false },
            { name: 'name', type: 'varchar', nullable: true, primary: false },
            { name: 'passwordHash', type: 'varchar', nullable: false, primary: false },
            { name: 'systemRole', type: 'varchar', nullable: false, primary: false },
            { name: 'active', type: 'tinyint', nullable: false, primary: false },
            { name: 'createdAt', type: 'datetime', nullable: false, primary: false },
            { name: 'updatedAt', type: 'datetime', nullable: false, primary: false }
          ]
        },
        {
          name: 'roles',
          scope: 'tenant',
          columns: [
            { name: 'id', type: 'varchar', nullable: false, primary: true },
            { name: 'tenantId', type: 'varchar', nullable: false, primary: false },
            { name: 'key', type: 'varchar', nullable: false, primary: false },
            { name: 'name', type: 'varchar', nullable: false, primary: false },
            { name: 'description', type: 'text', nullable: true, primary: false },
            { name: 'builtIn', type: 'tinyint', nullable: false, primary: false },
            { name: 'createdAt', type: 'datetime', nullable: false, primary: false },
            { name: 'updatedAt', type: 'datetime', nullable: false, primary: false }
          ]
        },
        {
          name: 'custom_assignments',
          scope: 'tenant',
          columns: [
            { name: 'id', type: 'varchar', nullable: false, primary: true },
            { name: 'tenantId', type: 'varchar', nullable: false, primary: false },
            { name: 'title', type: 'varchar', nullable: false, primary: false },
            { name: 'roleId', type: 'varchar', nullable: false, primary: false },
            { name: 'active', type: 'tinyint', nullable: false, primary: false },
            { name: 'createdAt', type: 'datetime', nullable: false, primary: false }
          ]
        }
      ]
    }
  };
}

function databaseRequest(prompt: string): AiAssistantRequest {
  return {
    prompt,
    scope: 'database',
    route: '/database',
    screenState: {
      tables: [
        {
          name: 'custom_test',
          scope: 'tenant',
          source: 'schema',
          designable: true,
          columns: [
            { name: 'id', type: 'varchar', nullable: false, primary: true, editable: false },
            { name: 'tenantId', type: 'varchar', nullable: false, primary: false, editable: false },
            { name: 'nombre', type: 'varchar', nullable: true, primary: false, editable: true }
          ]
        }
      ]
    }
  };
}

function validateGeneratedForm(document: Record<string, unknown>) {
  const normalized = formValidator.normalizeSchema(document, document['key'], document['title']);
  formValidator.validateSchema(normalized);
  return {
    schema: normalized,
    bindings: formValidator.extractBindings(normalized)
  };
}

describe('AiAssistantService service authoring', () => {
  it('creates one-of-many user filters as optional filters so either input can execute', () => {
    const action = service.serviceDraftFromPrompt('necesito listar usuarios por nombre o email');

    expect(action.document.dataTarget).toMatchObject({
      primaryTable: 'users',
      matchMode: 'any',
      filters: [
        {
          field: 'name',
          inputKey: 'name',
          required: false
        },
        {
          field: 'email',
          inputKey: 'email',
          required: false
        }
      ]
    });
    expect(action.document.query).toEqual({
      name: '{{input.name}}',
      email: '{{input.email}}'
    });
  });

  it('creates confisys exact and plural key services with the expected result shape', () => {
    const exact = service.serviceDraftFromPrompt('necesito consultar confisys por key exacta');
    const plural = service.serviceDraftFromPrompt('necesito listar parámetros confisys por keys');

    expect(exact).toMatchObject({
      key: 'consultar_confisys_por_key',
      document: {
        resultKind: 'single',
        dataTarget: {
          primaryTable: 'confisys',
          filters: [{ field: 'key', operator: 'equals', inputKey: 'key' }]
        }
      }
    });
    expect(plural).toMatchObject({
      key: 'consultar_confisys_por_keys',
      document: {
        resultKind: 'list',
        dataTarget: {
          primaryTable: 'confisys',
          filters: [{ field: 'key', operator: 'contains', inputKey: 'key' }]
        }
      }
    });
  });

  it('creates generic internal-table drafts for menus and records without special code per service', () => {
    const menus = service.serviceDraftFromPrompt('servicio para listar menús por key');
    const records = service.serviceDraftFromPrompt('servicio para consultar records por formKey');

    expect(menus).toMatchObject({
      key: 'listar_menus_por_key',
      document: {
        url: 'internal://table/menus',
        dataTarget: {
          primaryTable: 'menus',
          filters: [{ field: 'key', operator: 'contains', inputKey: 'key' }]
        }
      }
    });
    expect(records).toMatchObject({
      key: 'listar_records_por_formKey',
      document: {
        url: 'internal://table/records',
        dataTarget: {
          primaryTable: 'records',
          filters: [{ field: 'formKey', operator: 'contains', inputKey: 'formKey' }]
        }
      }
    });
  });

  it('advances with a selected result kind instead of asking the same question again', () => {
    const response = service.progressiveServiceAuthoringResponse(
      'services',
      request('lista', [
        { role: 'user', text: 'necesito un servicio para consultar usuarios por nombre' },
        {
          role: 'assistant',
          text: 'Necesito saber si esperas lista, un registro o sí/no. Elige una opción para continuar.'
        }
      ])
    );

    expect(response).toContain('Resultado esperado: list');
    expect(response).toContain('Tabla principal: users');
    expect(response).toContain('Filtros: name contains input.name');
    expect(response).not.toContain('Necesito saber si esperas lista');
  });

  it('keeps the original role-membership intent while short answers fill later decisions', () => {
    const action = service.advancedCompositeServiceAction(
      'services',
      request('crear draft', [
        { role: 'user', text: 'necesito un servicio que devuelva los usuarios que tienen asignado un role' },
        { role: 'assistant', text: 'Siguiente paso: confirma si esta interpretación es correcta.' },
        { role: 'user', text: 'correcto' },
        { role: 'assistant', text: 'Siguiente paso: confirma si estas tablas y relación son correctas.' },
        { role: 'user', text: 'tablas correctas' },
        { role: 'assistant', text: 'Siguiente paso: elige el campo que recibirá el servicio.' },
        { role: 'user', text: 'roles.name' },
        { role: 'assistant', text: 'Siguiente paso: si esto es correcto, pulsa crear draft.' },
        { role: 'user', text: 'lista' }
      ])
    );

    expect(action).toMatchObject({
      type: 'apply_dynamic_service_json',
      key: 'listar_usuarios_por_roleName',
      document: {
        source: 'internal_table',
        resultKind: 'list',
        dataTarget: {
          queryMode: 'multi_table',
          primaryTable: 'users',
          involvedTables: ['user_roles', 'roles'],
          filters: [
            {
              field: 'r.name',
              operator: 'equals',
              inputKey: 'roleName',
              required: true
            }
          ]
        },
        query: {
          roleName: '{{input.roleName}}'
        }
      }
    });
  });

  it('uses the latest explicit user role-field selection, not assistant text suggestions', () => {
    const action = service.advancedCompositeServiceAction(
      'services',
      request('crear draft', [
        { role: 'user', text: 'necesito listar usuarios que tengan un rol asignado' },
        { role: 'assistant', text: 'Opciones: roles.key, roles.id, roles.name.' },
        { role: 'user', text: 'roles.id' },
        { role: 'assistant', text: 'Configuración propuesta con roles.id. crear draft para continuar.' }
      ])
    );

    expect(action.document.dataTarget.filters[0]).toMatchObject({
      field: 'r.id',
      inputKey: 'roleId',
      operator: 'equals'
    });
    expect(action.document.query).toEqual({ roleId: '{{input.roleId}}' });
  });

  it('only offers role filter fields that exist in the current table catalog', () => {
    const limitedRequest = request('tablas correctas', [
      { role: 'user', text: 'necesito un servicio que devuelva usuarios por role' },
      { role: 'assistant', text: 'Siguiente paso: confirma si estas tablas y relación son correctas.' }
    ]);
    limitedRequest.screenState = {
      availableTables: [
        { name: 'users', columns: ['id', 'email'] },
        { name: 'user_roles', columns: ['userId', 'roleId'] },
        { name: 'roles', columns: ['id', 'key'] }
      ]
    };

    const response = service.userRoleMembershipGuideResponse('services', limitedRequest);

    expect(response?.suggestions).toEqual(['roles.key', 'roles.id']);
    expect(response?.message).not.toContain('roles.name');
  });

  it('does not turn a role-membership answer into a simple roles-table service', () => {
    const action = service.advancedCompositeServiceAction(
      'services',
      request('crear draft', [
        { role: 'user', text: 'necesito un servicio que consulte usuarios y traiga los roles asignados' },
        { role: 'assistant', text: 'Siguiente paso: elige el campo que recibirá el servicio.' },
        { role: 'user', text: 'roles.key' },
        { role: 'assistant', text: 'Siguiente paso: pulsa crear draft para aplicar el JSON compuesto.' }
      ])
    );

    expect(action.document.dataTarget.primaryTable).toBe('users');
    expect(action.document.dataTarget.joins).toHaveLength(2);
    expect(action.document.url).toBe('internal://query/users_roles');
  });

  it('repairs the currently open service with catalog validation and an applicable action', () => {
    const statefulRequest = request('corrige este servicio para consultar usuarios por email exacto');
    statefulRequest.screenState = {
      draft: {
        key: 'buscar_usuario',
        name: 'Buscar usuario'
      },
      definition: {
        source: 'internal_table',
        resultKind: 'list',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'users',
          filters: [{ field: 'name', operator: 'contains', valueSource: 'input', inputKey: 'name' }]
        },
        method: 'GET',
        url: 'internal://table/users',
        query: {
          name: '{{input.name}}'
        }
      },
      availableTables: serviceTables
    };

    const response = service.buildScreenAwareResponse('services', statefulRequest);

    expect(response?.message).toContain('Ajusté el servicio');
    expect(response?.actions?.[0]).toMatchObject({
      key: 'buscar_usuario',
      document: {
        dataTarget: {
          primaryTable: 'users',
          filters: [{ field: 'email', operator: 'equals', inputKey: 'email' }]
        },
        query: {
          name: '{{input.name}}',
          email: '{{input.email}}'
        }
      }
    });
  });

  it('rejects repair requests that use fields missing from the selected table catalog', () => {
    const statefulRequest = request('corrige este servicio por slug');
    statefulRequest.screenState = {
      definition: {
        source: 'internal_table',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'users'
        },
        method: 'GET',
        url: 'internal://table/users'
      },
      availableTables: serviceTables
    };

    const response = service.buildScreenAwareResponse('services', statefulRequest);

    expect(response?.message).toContain('El campo slug no aparece en la tabla users');
    expect(response?.actions).toBeUndefined();
  });

  it('guides trash and restore flows without destructive automatic actions', () => {
    const trash = service.serviceLifecycleResponse('services', {
      ...request('eliminar el servicio buscar_usuario'),
      screenState: {
        selected: {
          key: 'buscar_usuario'
        }
      }
    });
    const restore = service.serviceLifecycleResponse('services', request('restaurar buscar_usuario'));

    expect(trash).toContain('papelera');
    expect(trash).toContain('buscar_usuario');
    expect(restore).toContain('restaurar');
  });

  it('chat applies a confirmed generic draft instead of repeating the preflight', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(auth, {
      prompt: 'crear draft',
      scope: 'services',
      route: '/services',
      conversation: [
        { role: 'user', text: 'necesito listar usuarios por nombre o email' },
        {
          role: 'assistant',
          text: 'Si esta interpretación es correcta, responde "continúa" o "genera el draft".'
        }
      ],
      screenState: {
        availableTables: serviceTables
      }
    });

    expect(response.actions).toHaveLength(1);
    expect(response.actions?.[0]).toMatchObject({
      key: 'filtrar_usuarios',
      document: {
        dataTarget: {
          primaryTable: 'users',
          matchMode: 'any',
          filters: [
            { field: 'name', inputKey: 'name', required: false },
            { field: 'email', inputKey: 'email', required: false }
          ]
        }
      }
    });
    expect(response.message).toContain('draft visual');
  });

  it('adjusts an open service definition without recreating it from scratch', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const serviceRequest = request('cambia timeout a 15000, activa paginación por página 25 y devuelve lista');
    serviceRequest.screenState = {
      ...(serviceRequest.screenState as Record<string, unknown>),
      selected: { key: 'listar_menus', name: 'Listar menus', hasPublishedVersion: true },
      draft: { key: 'listar_menus', name: 'Listar menus', description: 'Lista menus' },
      definition: {
        intent: 'query',
        source: 'internal_table',
        resultKind: 'single',
        method: 'GET',
        url: 'internal://table/menus',
        timeoutMs: 8000,
        pagination: { enabled: false },
        dataTarget: { queryMode: 'single_table', primaryTable: 'menus', filters: [] }
      }
    };

    const response = await chatService.chat(
      { ...auth, permissions: ['services.read', 'services.manage'] } as any,
      serviceRequest
    );
    const action = response.actions?.[0] as any;

    expect(action).toMatchObject({
      type: 'apply_dynamic_service_json',
      key: 'listar_menus',
      document: {
        timeoutMs: 15000,
        resultKind: 'list',
        pagination: { enabled: true, pageSize: 25 },
        dataTarget: { primaryTable: 'menus' }
      }
    });
    expect(response.message).toContain('Ajusté el servicio actual');
  });

  it('chat applies confirmed confisys and records drafts through the same JSON action path', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const confisys = await chatService.chat(auth, {
      prompt: 'crear draft',
      scope: 'services',
      route: '/services',
      conversation: [
        { role: 'user', text: 'necesito listar parámetros confisys por keys' },
        { role: 'assistant', text: 'Si esta interpretación es correcta, genera el draft.' }
      ],
      screenState: { availableTables: serviceTables }
    });
    const records = await chatService.chat(auth, {
      prompt: 'crear draft',
      scope: 'services',
      route: '/services',
      conversation: [
        { role: 'user', text: 'servicio para consultar records por formKey' },
        { role: 'assistant', text: 'Si esta interpretación es correcta, genera el draft.' }
      ],
      screenState: { availableTables: serviceTables }
    });

    expect(confisys.actions?.[0]).toMatchObject({
      key: 'consultar_confisys_por_keys',
      document: {
        dataTarget: {
          primaryTable: 'confisys',
          filters: [{ field: 'key', operator: 'contains' }]
        }
      }
    });
    expect(records.actions?.[0]).toMatchObject({
      key: 'listar_records_por_formKey',
      document: {
        dataTarget: {
          primaryTable: 'records',
          filters: [{ field: 'formKey', operator: 'contains' }]
        }
      }
    });
  });

  it('starts a fresh service context when a new complete request arrives in an old chat', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const staleRoleConversation: AiAssistantRequest['conversation'] = [
      { role: 'user', text: 'necesito un servicio que devuelva los usuarios que tienen asignado un role' },
      { role: 'assistant', text: 'Siguiente paso: confirma si esta interpretación es correcta.' },
      { role: 'user', text: 'correcto' },
      { role: 'assistant', text: 'Siguiente paso: confirma si estas tablas y relación son correctas.' },
      { role: 'user', text: 'tablas correctas' },
      { role: 'assistant', text: 'Siguiente paso: elige el campo que recibirá el servicio.' },
      { role: 'user', text: 'roles.name' },
      { role: 'assistant', text: 'Siguiente paso: pulsa crear draft para aplicar el JSON compuesto.' }
    ];

    const response = await chatService.chat(auth, {
      prompt: 'necesito listar menus por route',
      scope: 'services',
      route: '/services',
      conversation: staleRoleConversation,
      screenState: { availableTables: serviceTables }
    });

    expect(response.message).toContain('Tabla principal: menus');
    expect(response.message).toContain('Filtros: route contains input.route');
    expect(response.message).not.toContain('usuarios que tienen asignado');
    expect(response.message).not.toContain('user_roles');
  });

  it('continues from the latest complete request when creating a draft after a stale chat reset', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const conversation: AiAssistantRequest['conversation'] = [
      { role: 'user', text: 'necesito un servicio que devuelva los usuarios que tienen asignado un role' },
      { role: 'assistant', text: 'Siguiente paso: confirma si esta interpretación es correcta.' },
      { role: 'user', text: 'roles.name' },
      { role: 'assistant', text: 'Siguiente paso: pulsa crear draft para aplicar el JSON compuesto.' },
      { role: 'user', text: 'necesito listar menus por route' },
      {
        role: 'assistant',
        text: 'Tabla principal: menus. Resultado esperado: list. Filtros: route contains input.route. Si esta interpretación es correcta, genera el draft.'
      }
    ];

    const response = await chatService.chat(auth, {
      prompt: 'crear draft',
      scope: 'services',
      route: '/services',
      conversation,
      screenState: { availableTables: serviceTables }
    });

    expect(response.actions?.[0]).toMatchObject({
      key: 'listar_menus_por_route',
      document: {
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'menus',
          filters: [{ field: 'route', operator: 'contains', inputKey: 'route' }]
        },
        query: {
          route: '{{input.route}}'
        }
      }
    });
  });
});

describe('AiAssistantService flow authoring', () => {
  it('preflights a flow request before applying a JSON draft', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, tenant: { slug: 'demo' }, permissions: ['flows.read', 'flows.create'] } as any,
      flowRequest('necesito un flow manual que ejecute buscar usuario por email y responda al front')
    );

    expect(response.message).toContain('Interpretación: quieres crear el flow');
    expect(response.message).toContain('manual');
    expect(response.message).toContain('ejecutar_servicio');
    expect(response.suggestions).toContain('crear draft');
    expect(response.actions).toBeUndefined();
  });

  it('applies a confirmed single-service flow draft using available published services', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, tenant: { slug: 'demo' }, permissions: ['flows.read', 'flows.create'] } as any,
      flowRequest('crear draft', [
        {
          role: 'user',
          text: 'necesito un flow manual que ejecute buscar usuario por email y responda al front'
        },
        {
          role: 'assistant',
          text: 'Interpretación: quieres crear el flow Ejecutar Servicio. Revisión: entrada manual:flow_ejecutar_servicio.manual; pasos ejecutar_servicio (dynamic_service) -> respuesta (response).'
        }
      ])
    );

    expect(response.actions?.[0]).toMatchObject({
      type: 'apply_flow_json',
      key: 'flow_ejecutar_servicio',
      document: {
        schemaVersion: 1,
        entry: { mode: 'manual' },
        inputFields: [{ key: 'email', type: 'email', required: true }],
        steps: [
          {
            key: 'ejecutar_servicio',
            type: 'dynamic_service',
            config: { serviceKey: 'buscar_usuario' },
            inputMap: { email: '{{input.email}}' },
            nextStepKey: 'respuesta'
          },
          { key: 'respuesta', type: 'response' }
        ],
        output: { stepKey: 'respuesta', responseTo: 'caller' }
      }
    });
  });

  it('adjusts the current flow document instead of creating another flow', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const current = service.flowDraftFromPrompt(
      'flow manual que ejecute buscar usuario y responda al front',
      flowRequest('')
    ).document;
    const requestWithDocument = flowRequest('cambia este flow a webhook y timeout 12000 para el servicio buscar_roles');
    requestWithDocument.screenState = {
      ...(requestWithDocument.screenState as Record<string, unknown>),
      selected: { key: current.flow.key, name: current.flow.name, hasPublishedVersion: false },
      currentDocument: current
    };

    const response = await chatService.chat(
      { ...auth, permissions: ['flows.read', 'flows.manage'] } as any,
      requestWithDocument
    );
    const action = response.actions?.[0] as any;

    expect(action).toMatchObject({
      type: 'apply_flow_json',
      key: current.flow.key,
      document: {
        entry: { mode: 'http' },
        output: { responseTo: 'caller' }
      }
    });
    expect(action.document.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'dynamic_service',
          config: expect.objectContaining({ timeoutMs: 12000, serviceKey: 'buscar_roles' })
        })
      ])
    );
    expect(response.message).toContain('Ajusté el flow actual');
  });

  it('creates a chained-services flow draft instead of limiting the process to two fixed UI slots', () => {
    const action = service.flowDraftFromPrompt(
      'flow directo que primero ejecute buscar usuario por email y luego buscar roles con el resultado',
      flowRequest('')
    );

    expect(action).toMatchObject({
      type: 'apply_flow_json',
      key: 'flow_encadenar_servicios',
      document: {
        entry: { mode: 'direct' },
        steps: [
          {
            key: 'ejecutar_servicio',
            type: 'dynamic_service',
            config: { serviceKey: 'buscar_usuario' },
            nextStepKey: 'ejecutar_segundo_servicio'
          },
          {
            key: 'ejecutar_segundo_servicio',
            type: 'dynamic_service',
            config: { serviceKey: 'buscar_roles' },
            inputMap: { previous: '{{steps.servicio.response}}' },
            nextStepKey: 'respuesta'
          },
          { key: 'respuesta', type: 'response' }
        ]
      }
    });
  });

  it('creates validation and decision branches with an explicit rejected response path', () => {
    const action = service.flowDraftFromPrompt('flow para validar un servicio y decidir si responde aprobado o rechazo', flowRequest(''));

    expect(action.document.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'validar_resultado',
          type: 'decision',
          onTrueStepKey: 'respuesta',
          onFalseStepKey: 'respuesta_rechazada'
        }),
        expect.objectContaining({
          key: 'respuesta_rechazada',
          type: 'response',
          config: expect.objectContaining({ status: 'rejected' })
        })
      ])
    );
  });

  it('creates parallel, foreach, subflow, event and formula flow drafts with executable step types', () => {
    const parallel = service.flowDraftFromPrompt('flow que ejecute dos servicios en paralelo y consolide la respuesta', flowRequest(''));
    const foreach = service.flowDraftFromPrompt('flow por cada item de una lista ejecutar notificar item', flowRequest(''));
    const subflow = service.flowDraftFromPrompt('flow que llame un subflow publicado para validar cliente', flowRequest(''));
    const event = service.flowDraftFromPrompt('flow de evento record created que emita evento al terminar', flowRequest(''));
    const formula = service.flowDraftFromPrompt('flow para calcular total con iva desde amount', flowRequest(''));

    expect(parallel.document.steps[0]).toMatchObject({
      key: 'consultas_paralelas',
      type: 'parallel',
      config: {
        branches: [
          { serviceKey: 'buscar_usuario' },
          { serviceKey: 'buscar_roles' }
        ]
      }
    });
    expect(foreach.document.steps[0]).toMatchObject({
      key: 'procesar_items',
      type: 'foreach',
      config: { itemsPath: 'input.items', serviceKey: 'buscar_usuario' }
    });
    expect(subflow.document.steps[0]).toMatchObject({
      key: 'ejecutar_subflow',
      type: 'subflow',
      config: { flowKey: 'validar_cliente' }
    });
    expect(event.document).toMatchObject({
      entry: { mode: 'record_event', key: 'record.created' }
    });
    expect(event.document.steps).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'emitir_evento', type: 'emit_event' })])
    );
    expect(formula.document.steps[0]).toMatchObject({
      key: 'calcular_valor',
      type: 'formula',
      config: { rule: { '*': [{ var: 'input.amount' }, 1.19] } }
    });
  });

  it('detects webhook and schedule entries without publishing automatically', () => {
    const webhook = service.flowDraftFromPrompt('flow webhook que ejecute un servicio y responda', flowRequest(''));
    const schedule = service.flowDraftFromPrompt('flow programado cada hora para ejecutar un servicio', flowRequest(''));

    expect(webhook).toMatchObject({
      publish: false,
      document: { entry: { mode: 'http', key: 'flow_ejecutar_servicio.webhook' } }
    });
    expect(schedule).toMatchObject({
      publish: false,
      document: { entry: { mode: 'schedule', config: { intervalSeconds: 3600 } } }
    });
  });
});

describe('AiAssistantService database authoring', () => {
  it('prepares schema changes from the database designer without applying destructive operations automatically', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const create = await chatService.chat(
      { ...auth, user: { systemRole: 'owner' }, permissions: [] } as any,
      databaseRequest('crear tabla test3 con campos nombre texto, email email, activo boolean')
    );
    const createAction = create.actions?.find((action: any) => action.type === 'apply_schema_change') as any;
    expect(createAction).toMatchObject({
      tableName: 'custom_test3',
      operation: 'create_table',
      apply: false,
      request: {
        operation: 'create_table',
        tableName: 'custom_test3',
        columns: expect.arrayContaining([
          expect.objectContaining({ name: 'nombre' }),
          expect.objectContaining({ name: 'email' }),
          expect.objectContaining({ name: 'activo', type: 'boolean' })
        ])
      }
    });

    const drop = await chatService.chat(
      { ...auth, user: { systemRole: 'owner' }, roles: [], permissions: [] } as any,
      databaseRequest('eliminar tabla test')
    );
    const dropAction = drop.actions?.find((action: any) => action.type === 'apply_schema_change') as any;
    expect(dropAction).toMatchObject({
      tableName: 'custom_test',
      operation: 'drop_table',
      apply: false,
      request: {
        operation: 'drop_table',
        confirmation: 'DROP TABLE custom_test'
      }
    });
  });

  it('blocks drop table proposals for admin users because only owner can do it', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, user: { systemRole: 'admin' }, roles: [], permissions: [] } as any,
      databaseRequest('eliminar tabla test')
    );

    expect(response.message).toContain('solo está disponible para usuarios owner');
    expect(response.actions).toBeUndefined();
  });
});

describe('AiAssistantService dynamic form authoring', () => {
  it('creates a CRUD form and companion create service from one prompt using real table columns', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage', 'services.manage'] } as any,
      formRequest('necesito un formulario CRUD a la tabla custom_clients')
    );
    const serviceAction = response.actions?.find((action: any) => action.type === 'apply_dynamic_service_json') as any;
    const serviceKeys = response.actions
      ?.filter((action: any) => action.type === 'apply_dynamic_service_json')
      .map((action: any) => action.key);
    const formAction = response.actions?.find((action: any) => action.type === 'apply_dynamic_form_json') as any;

    expect(serviceKeys).toEqual(
      expect.arrayContaining([
        'crear_custom_clients',
        'listar_custom_clients',
        'actualizar_custom_clients',
        'eliminar_custom_clients'
      ])
    );
    expect(serviceAction).toMatchObject({
      key: 'crear_custom_clients',
      publish: true,
      document: {
        intent: 'create',
        source: 'internal_table',
        dataTarget: {
          primaryTable: 'custom_clients',
          writeMap: {
            name: '{{input.name}}',
            email: '{{input.email}}',
            phone: '{{input.phone}}',
            active: '{{input.active}}'
          }
        }
      }
    });
    expect(formAction).toMatchObject({
      key: 'form_custom_clients',
      document: {
        persistence: { mode: 'service', defaultTarget: { serviceKey: 'crear_custom_clients' } },
        actions: [{ type: 'execute_service', serviceKey: 'crear_custom_clients' }]
      }
    });
    const fields = formAction.document.steps.flatMap((step: any) => step.fields);
    expect(fields.map((field: any) => field.key)).toEqual(expect.arrayContaining(['name', 'email', 'phone', 'active']));
    expect(fields.map((field: any) => field.key)).not.toEqual(expect.arrayContaining(['id', 'tenantId', 'createdAt']));
    expect(() => validateGeneratedForm(formAction.document)).not.toThrow();
  });

  it('creates a new custom table schema change, CRUD services and connected form from one prompt', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage', 'services.manage'] } as any,
      formRequest('formulario CRUD a tabla test con campos nombre texto, email email, activo boolean')
    );
    const schemaAction = response.actions?.find((action: any) => action.type === 'apply_schema_change') as any;
    const serviceKeys = response.actions
      ?.filter((action: any) => action.type === 'apply_dynamic_service_json')
      .map((action: any) => action.key);
    const formAction = response.actions?.find((action: any) => action.type === 'apply_dynamic_form_json') as any;

    expect(schemaAction).toMatchObject({
      tableName: 'custom_test',
      operation: 'create_table',
      request: {
        operation: 'create_table',
        tableName: 'custom_test',
        columns: expect.arrayContaining([
          expect.objectContaining({ name: 'nombre', type: 'string' }),
          expect.objectContaining({ name: 'email', type: 'string', length: 180 }),
          expect.objectContaining({ name: 'activo', type: 'boolean', defaultValue: true, nullable: false })
        ])
      }
    });
    expect(serviceKeys).toEqual(
      expect.arrayContaining(['crear_custom_test', 'listar_custom_test', 'actualizar_custom_test', 'eliminar_custom_test'])
    );
    expect(formAction).toMatchObject({
      key: 'form_custom_test',
      document: {
        persistence: { mode: 'service', defaultTarget: { serviceKey: 'crear_custom_test' } },
        actions: [{ type: 'execute_service', serviceKey: 'crear_custom_test' }]
      }
    });
    expect(() => validateGeneratedForm(formAction.document)).not.toThrow();
  });

  it('understands named custom tables and field lists in natural Spanish CRUD prompts', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage', 'services.manage'] } as any,
      formRequest(
        'necesito un crud a una tabla que llamaremos custom_test con los campo fecha, nombre, direccion, apellido, cedula un comentario y guardar con un boton verde'
      )
    );
    const schemaAction = response.actions?.find((action: any) => action.type === 'apply_schema_change') as any;
    const formAction = response.actions?.find((action: any) => action.type === 'apply_dynamic_form_json') as any;

    expect(schemaAction).toMatchObject({
      tableName: 'custom_test',
      request: {
        columns: expect.arrayContaining([
          expect.objectContaining({ name: 'fecha', type: 'date' }),
          expect.objectContaining({ name: 'nombre', type: 'string' }),
          expect.objectContaining({ name: 'direccion', type: 'string' }),
          expect.objectContaining({ name: 'apellido', type: 'string' }),
          expect.objectContaining({ name: 'cedula', type: 'string' }),
          expect.objectContaining({ name: 'comentario', type: 'text' })
        ])
      }
    });
    expect(schemaAction.request.columns.map((column: any) => column.name)).not.toContain('guardar');
    expect(formAction.document.presentation.tokens.buttonPrimary.background).toBe('success');
    expect(formAction.document.runtime.submitLabel).toBe('Guardar');
    expect(() => validateGeneratedForm(formAction.document)).not.toThrow();
  });

  it('splits natural field lists after "campos son" without creating a field named son', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage', 'services.manage'] } as any,
      formRequest('necesito un crud a una nueva tabla llamada test los campos son nombre fecha direccion cedula y un boton guardar verde')
    );
    const schemaAction = response.actions?.find((action: any) => action.type === 'apply_schema_change') as any;
    const columns = schemaAction.request.columns;
    const formAction = response.actions?.find((action: any) => action.type === 'apply_dynamic_form_json') as any;

    expect(schemaAction.tableName).toBe('custom_test');
    expect(columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'nombre', type: 'string' }),
        expect.objectContaining({ name: 'fecha', type: 'date' }),
        expect.objectContaining({ name: 'direccion', type: 'string' }),
        expect.objectContaining({ name: 'cedula', type: 'string' })
      ])
    );
    expect(columns.map((column: any) => column.name)).not.toContain('son');
    expect(columns.map((column: any) => column.name)).not.toContain('guardar');
    expect(formAction.document.presentation.tokens.buttonPrimary.background).toBe('success');
    expect(() => validateGeneratedForm(formAction.document)).not.toThrow();
  });

  it('does not confuse layout or button words with fields in new table CRUD prompts', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage', 'services.manage'] } as any,
      formRequest(
        'necesito un crud a la tabla test que los campos nombres usuario correo fecha cedula campos a lo ancho y un boto verde de guardar'
      )
    );
    const schemaAction = response.actions?.find((action: any) => action.type === 'apply_schema_change') as any;
    const columns = schemaAction.request.columns;
    const formAction = response.actions?.find((action: any) => action.type === 'apply_dynamic_form_json') as any;
    const fieldNames = formAction.document.steps.flatMap((step: any) => step.fields.map((field: any) => field.key));

    expect(schemaAction.tableName).toBe('custom_test');
    expect(columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'nombres', type: 'string' }),
        expect.objectContaining({ name: 'usuario', type: 'string' }),
        expect.objectContaining({ name: 'correo', type: 'string' }),
        expect.objectContaining({ name: 'fecha', type: 'date' }),
        expect.objectContaining({ name: 'cedula', type: 'string' })
      ])
    );
    expect(columns.map((column: any) => column.name)).not.toEqual(expect.arrayContaining(['boto', 'boton', 'campos', 'ancho']));
    expect(fieldNames).toEqual(expect.arrayContaining(['nombres', 'usuario', 'correo', 'fecha', 'cedula']));
    expect(fieldNames).not.toEqual(expect.arrayContaining(['boto', 'boton', 'campos', 'ancho']));
    expect(formAction.document.layout.desktop.fieldColumns).toBe(1);
    expect(formAction.document.steps[0].fields.every((field: any) => field.layout.desktop === 'full')).toBe(true);
    expect(formAction.document.presentation.tokens.buttonPrimary.background).toBe('success');
    expect(() => validateGeneratedForm(formAction.document)).not.toThrow();
  });

  it('does not build a CRUD form on top of an existing incompatible custom table', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const requestWithBadTable = formRequest(
      'necesito un crud a la tabla test que los campos nombres usuario correo fecha cedula campos a lo ancho y un boto verde de guardar'
    );
    (requestWithBadTable.screenState as any).tables.push({
      name: 'custom_test',
      scope: 'tenant',
      columns: [
        { name: 'id', type: 'varchar', nullable: false, primary: true },
        { name: 'tenantId', type: 'varchar', nullable: false, primary: false },
        { name: 'nombres', type: 'date', nullable: true, primary: false },
        { name: 'boto', type: 'varchar', nullable: true, primary: false },
        { name: 'createdAt', type: 'datetime', nullable: false, primary: false }
      ]
    });

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage', 'services.manage'] } as any,
      requestWithBadTable
    );

    expect(response.message).toContain('esa tabla ya existe');
    expect(response.message).toContain('Faltan columnas: usuario, correo, fecha, cedula');
    expect(response.message).toContain('nombres: existe date, pedido string');
    expect(response.actions).toBeUndefined();
  });

  it('routes users CRUD forms through secure user creation instead of direct passwordHash writes', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage', 'services.manage'] } as any,
      formRequest('formulario CRUD a la tabla users')
    );
    const formAction = response.actions?.find((action: any) => action.type === 'apply_dynamic_form_json') as any;
    const fields = formAction.document.steps.flatMap((step: any) => step.fields);
    const role = fields.find((field: any) => field.key === 'role');

    expect(response.actions?.filter((action: any) => action.type === 'apply_dynamic_service_json')).toEqual([]);
    expect(fields.map((field: any) => field.key)).not.toContain('passwordHash');
    expect(fields.map((field: any) => field.key)).toEqual(expect.arrayContaining(['email', 'name', 'password', 'role']));
    expect(role).toMatchObject({
      type: 'select',
      options: expect.arrayContaining([
        { label: 'Owner', value: 'owner' },
        { label: 'Viewer', value: 'viewer' },
        { label: 'Cliente app', value: 'client' }
      ]),
      config: { defaultValue: 'viewer' }
    });
    expect(formAction.document.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'create_user',
          payloadMap: { email: '{{input.email}}', name: '{{input.name}}', password: '{{input.password}}', roles: ['{{input.role}}'] }
        })
      ])
    );
    expect(() => validateGeneratedForm(formAction.document)).not.toThrow();
  });

  it('maps inherited roleId columns to dynamic select options backed by a companion service', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage', 'services.manage'] } as any,
      formRequest('formulario CRUD a la tabla custom_assignments')
    );
    const serviceKeys = response.actions
      ?.filter((action: any) => action.type === 'apply_dynamic_service_json')
      .map((action: any) => action.key);
    const formAction = response.actions?.find((action: any) => action.type === 'apply_dynamic_form_json') as any;
    const fields = formAction.document.steps.flatMap((step: any) => step.fields);
    const roleId = fields.find((field: any) => field.key === 'roleId');

    expect(serviceKeys).toEqual(expect.arrayContaining(['crear_custom_assignments', 'listar_roles']));
    expect(roleId).toMatchObject({
      type: 'select',
      dataSource: {
        type: 'dynamic_service',
        bindingType: 'options',
        serviceKey: 'listar_roles',
        sourceTable: 'roles',
        labelPath: 'name',
        valuePath: 'id'
      }
    });
    expect(formAction.document.dataSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'dynamic_service', serviceKey: 'listar_roles', sourceTable: 'roles' })
      ])
    );
    expect(() => validateGeneratedForm(formAction.document)).not.toThrow();
  });

  it('does not loop when a CRUD table is explicit but the table catalog is not loaded', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      {
        ...formRequest('formulario CRUD a la tabla custom_clients'),
        screenState: {
          availableServices: [],
          availableFlows: [],
          tables: [],
          tableCatalogStatus: 'error'
        }
      }
    );

    expect(response.message).toContain('custom_clients');
    expect(response.message).toContain('catálogo de tablas no está cargado');
    expect(response.suggestions).not.toContain('formulario CRUD a la tabla custom_clients');
    expect(response.actions).toBeUndefined();
  });

  it('explains when an explicit CRUD table is missing from the loaded catalog', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      {
        ...formRequest('formulario CRUD a la tabla custom_orders'),
        screenState: formRequest('').screenState
      }
    );

    expect(response.message).toContain('custom_orders');
    expect(response.message).toContain('no aparece en el catálogo visible');
    expect(response.suggestions).toContain('formulario CRUD a la tabla custom_clients');
    expect(response.actions).toBeUndefined();
  });

  it('preflights a form request before applying a JSON draft', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('necesito un formulario de cliente con nombre email teléfono y guardado record')
    );

    expect(response.message).toContain('Interpretación: quieres crear el formulario');
    expect(response.message).toContain('persistencia record');
    expect(response.message).toContain('nombre, email, telefono');
    expect(response.suggestions).toContain('crear draft');
    expect(response.actions).toBeUndefined();
  });

  it('classifies mobile login forms as auth_login instead of onboarding capture', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('necesito un formulario movil con dos campos para logueo usuario y contraseña')
    );

    expect(response.message).toContain('Iniciar sesion');
    expect(response.message).toContain('persistencia auth');
    expect(response.message).toContain('usuario, password');
    expect(response.message).not.toContain('onboarding_cliente');
    expect(response.suggestions).toContain('crear draft');
  });

  it('classifies inicio de sesion forms as auth_login even after onboarding conversation context', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('necesito un formulario de inicio de sesion', [
        { role: 'user', text: 'necesito un formulario de cliente con nombre y email' },
        {
          role: 'assistant',
          text: 'Interpretación: quieres crear el formulario Onboarding Cliente. Key: onboarding_cliente.'
        }
      ])
    );

    expect(response.message).toContain('Iniciar sesion');
    expect(response.message).toContain('persistencia auth');
    expect(response.message).toContain('usuario, password');
    expect(response.message).not.toContain('Onboarding Cliente');
    expect(response.message).not.toContain('onboarding_cliente');
  });

  it('uses short model reasoning for forms when Ollama responds within the interactive budget', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      {
        chat: jest.fn(async () => ({
          message:
            'Interpretación: formulario móvil de inspección con evidencias. Revisión: campos foto, ubicación y observaciones. Siguiente paso: crear draft.'
        }))
      } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('necesito un formulario de inspección móvil con foto gps observaciones offline')
    );

    expect(response.message).toContain('formulario móvil de inspección');
    expect(response.message).toContain('foto, ubicación y observaciones');
    expect(response.message).toContain('Hoja de ruta: generaré un draft');
  });

  it('keeps form assistance usable when the local model times out', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn(async () => Promise.reject(new Error('timeout'))) } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('necesito un formulario de inspección móvil con foto gps observaciones offline')
    );

    expect(response.message).toContain('Interpretación: quieres crear el formulario Inspeccion Operativa');
    expect(response.message).toContain('foto');
    expect(response.message).toContain('ubicacion');
    expect(response.suggestions).toContain('crear draft');
  });

  it('applies a confirmed form draft through the same JSON-only action path', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('crear draft', [
        { role: 'user', text: 'necesito un formulario de cliente con nombre email teléfono y guardado record' },
        {
          role: 'assistant',
          text: 'Interpretación: quieres crear el formulario Onboarding Cliente. Revisión: 1 paso(s), 3 campo(s), persistencia record. preview web/móvil.'
        }
      ])
    );
    const action = response.actions?.[0] as any;
    const fields = action.document.steps.flatMap((step: any) => step.fields);

    expect(action).toMatchObject({
      type: 'apply_dynamic_form_json',
      key: 'onboarding_cliente',
      publish: false,
      document: {
        schemaVersion: 1,
        kind: 'dynamic_form',
        persistence: { mode: 'record' }
      }
    });
    expect(fields.map((field: any) => field.key)).toEqual(expect.arrayContaining(['nombre', 'email', 'telefono']));
    expect(() => validateGeneratedForm(action.document)).not.toThrow();
    expect(response.message).toContain('draft visual');
  });

  it('adjusts visual layout of the current form without recreating fields or submit actions', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const currentSchema = service.formDraftFromPrompt('necesito un formulario de inicio de sesion', formRequest('')).document;
    const request = formRequest('centra el formulario, coloca el botón amplio azul y usa tema material oscuro');
    request.screenState = {
      ...(request.screenState as Record<string, unknown>),
      selected: { key: 'login', title: 'Iniciar sesion', published: false },
      schema: currentSchema
    };

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      request
    );
    const action = response.actions?.[0] as any;

    expect(action).toMatchObject({
      type: 'apply_dynamic_form_json',
      key: 'login',
      document: {
        key: 'login',
        presentation: {
          theme: 'material',
          themeMode: 'dark',
          tokens: {
            buttonPrimary: { background: 'primary' }
          }
        },
        layout: {
          form: { align: 'center' },
          desktop: { actions: { align: 'stretch', size: 'full' } },
          mobile: { actions: { align: 'stretch', size: 'full' } }
        }
      }
    });
    expect(action.document.steps).toEqual(currentSchema['steps']);
    expect(action.document.actions).toEqual(currentSchema['actions']);
    expect(response.message).toContain('Ajusté el diseño');
  });

  it('creates a new explicit form instead of treating button color as a visual adjustment', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const currentSchema = service.formDraftFromPrompt('necesito un formulario de inicio de sesion', formRequest('')).document;
    const request = formRequest(
      'necesito un formulario test con los campos nombre apellido direccion cedula y el boton guardar en verde'
    );
    request.screenState = {
      ...(request.screenState as Record<string, unknown>),
      selected: { key: 'login', title: 'Iniciar sesion', published: false },
      schema: currentSchema
    };

    const preflight = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      request
    );
    expect(preflight.message).toContain('Interpretación: quieres crear el formulario Test');
    expect(preflight.message).not.toContain('Ajusté el diseño');
    expect(preflight.suggestions).toContain('crear draft');
    expect(preflight.actions).toBeUndefined();

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('crear draft', [
        {
          role: 'user',
          text: 'necesito un formulario test con los campos nombre apellido direccion cedula y el boton guardar en verde'
        },
        { role: 'assistant', text: preflight.message }
      ])
    );
    const action = response.actions?.[0] as any;
    const fields = action.document.steps.flatMap((step: any) => step.fields);

    expect(response.message).not.toContain('Ajusté el diseño');
    expect(action).toMatchObject({
      type: 'apply_dynamic_form_json',
      key: 'test',
      document: {
        key: 'test',
        title: 'Test',
        runtime: { submitLabel: 'Guardar' },
        presentation: {
          tokens: {
            buttonPrimary: { background: 'success' }
          }
        }
      }
    });
    expect(fields.map((field: any) => field.key)).toEqual(
      expect.arrayContaining(['nombre', 'apellido', 'direccion', 'cedula'])
    );
    expect(fields.map((field: any) => field.key)).not.toContain('boton');
    expect(fields.map((field: any) => field.key)).not.toContain('guardar');
    expect(() => validateGeneratedForm(action.document)).not.toThrow();
  });

  it('does not create a new form when the user says guardar draft in chat', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('guardar draft', [
        { role: 'user', text: 'centra el formulario y coloca el botón amplio azul' },
        {
          role: 'assistant',
          text: 'Ajusté el diseño del formulario actual sin cambiar campos ni acciones.'
        }
      ])
    );

    expect(response.actions).toBeUndefined();
    expect(response.message).toContain('Para guardar el formulario actual');
    expect(response.message).toContain('No generé otro draft');
  });

  it('does not create a new form when the user says probar antes de publicar', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('probar antes de publicar', [
        { role: 'user', text: 'necesito un formulario de inicio de sesion' },
        {
          role: 'assistant',
          text: 'Preparé un formulario como draft visual en esta pantalla.'
        }
      ])
    );

    expect(response.actions).toBeUndefined();
    expect(response.message).toContain('Para probar el formulario actual');
    expect(response.message).toContain('Probar submit');
  });

  it('adjusts the current form button to match field width', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const currentSchema = service.formDraftFromPrompt('necesito un formulario de inicio de sesion', formRequest('')).document;
    const request = formRequest('necesito cambiar el tamaño del boton iniciar sesion al largo de los campos de input');
    request.screenState = {
      ...(request.screenState as Record<string, unknown>),
      selected: { key: 'login', title: 'Iniciar sesion', published: false },
      schema: currentSchema
    };

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      request
    );
    const action = response.actions?.[0] as any;

    expect(action).toMatchObject({
      type: 'apply_dynamic_form_json',
      document: {
        layout: {
          desktop: { actions: { align: 'center', size: 'field' } },
          mobile: { actions: { align: 'center', size: 'field' } }
        }
      }
    });
    expect(action.document.steps).toEqual(currentSchema['steps']);
  });

  it('adjusts the current form submit destination to auth without recreating fields', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const currentSchema = service.formDraftFromPrompt('formulario de cliente con email y contraseña', formRequest('')).document;
    const request = formRequest('haz que este formulario inicie sesion y al terminar navegue a /home');
    request.screenState = {
      ...(request.screenState as Record<string, unknown>),
      selected: { key: 'login', title: 'Login', published: false },
      schema: currentSchema
    };

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      request
    );
    const action = response.actions?.[0] as any;

    expect(action).toMatchObject({
      type: 'apply_dynamic_form_json',
      document: {
        persistence: { mode: 'auth', defaultTarget: { serviceKey: 'auth.login' } },
        actions: [
          expect.objectContaining({
            type: 'execute_service',
            serviceKey: 'auth.login',
            payloadMap: expect.objectContaining({ password: expect.stringContaining('input.password') })
          })
        ]
      }
    });
    expect(action.document.actions[0].onSuccess).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'navigate', to: '/home' })])
    );
    expect(action.document.steps).toEqual(currentSchema['steps']);
    expect(response.message).toContain('Ajusté la acción final');
  });

  it('creates auth login drafts without record persistence or onboarding fields', () => {
    const action = service.formDraftFromPrompt(
      'necesito un formulario movil con dos campos para logueo usuario y contraseña',
      formRequest('')
    );
    const fields = action.document.steps.flatMap((step: any) => step.fields);
    const validation = validateGeneratedForm(action.document);

    expect(action).toMatchObject({
      key: 'login_movil',
      name: 'Iniciar sesion',
      document: {
        category: 'seguridad',
        persistence: { mode: 'auth' },
        runtime: {
          submitLabel: 'Iniciar sesion',
          offline: { enabled: false }
        },
        layout: {
          form: { width: 'compact', align: 'left' },
          desktop: {
            fieldColumns: 1,
            actions: { position: 'inline', align: 'right', size: 'md' }
          },
          mobile: {
            fieldColumns: 1,
            actions: { position: 'bottom_sticky', align: 'stretch', size: 'full' }
          }
        },
        presentation: {
          tokens: {
            buttonPrimary: { background: 'primary' }
          }
        }
      }
    });
    expect(fields.map((field: any) => field.key)).toEqual(['usuario', 'password']);
    expect(fields.find((field: any) => field.key === 'password')).toMatchObject({
      type: 'password',
      required: true
    });
    expect(action.document.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'execute_service',
          serviceKey: 'auth.login',
          payloadMap: {
            username: '{{input.usuario}}',
            password: '{{input.password}}'
          }
        })
      ])
    );
    expect(validation.bindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ bindingType: 'submit', targetKey: 'auth.login' })])
    );
  });

  it('creates inicio de sesion drafts with login fields and auth action', () => {
    const action = service.formDraftFromPrompt('necesito un formulario de inicio de sesion', formRequest(''));
    const fields = action.document.steps.flatMap((step: any) => step.fields);

    expect(action).toMatchObject({
      key: 'login',
      name: 'Iniciar sesion',
      document: {
        persistence: { mode: 'auth' },
        runtime: { submitLabel: 'Iniciar sesion' }
      }
    });
    expect(fields.map((field: any) => field.key)).toEqual(['usuario', 'password']);
    expect(action.document.layout).toMatchObject({
      form: { width: 'compact' },
      desktop: { fieldColumns: 1 },
      tablet: { fieldColumns: 1 },
      mobile: { fieldColumns: 1 }
    });
    expect(action.document.actions).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'execute_service', serviceKey: 'auth.login' })])
    );
    expect(() => validateGeneratedForm(action.document)).not.toThrow();
  });

  it('creates inspection forms with mobile steps, evidence fields and offline queue defaults', () => {
    const action = service.formDraftFromPrompt(
      'formulario de inspección móvil con foto gps observaciones offline',
      formRequest('')
    );
    const fields = action.document.steps.flatMap((step: any) => step.fields);

    expect(action.document).toMatchObject({
      category: 'operaciones',
      runtime: {
        offline: { enabled: true },
        limits: { maxPayloadKb: 4096 }
      },
      layout: {
        mobile: {
          mode: 'step_screens',
          actions: { position: 'bottom_sticky', align: 'stretch', size: 'full' }
        }
      }
    });
    expect(fields.map((field: any) => field.type)).toEqual(expect.arrayContaining(['image', 'gps', 'textarea']));
    expect(() => validateGeneratedForm(action.document)).not.toThrow();
  });

  it('creates service-backed lookup forms using available published services', () => {
    const action = service.formDraftFromPrompt(
      'formulario de consulta por serial que ejecute servicio y muestre respuesta',
      formRequest('')
    );
    const actions = action.document.actions as Array<Record<string, unknown>>;

    expect(action.document).toMatchObject({
      category: 'consultas',
      runtime: { submitLabel: 'Consultar' },
      persistence: {
        mode: 'service',
        defaultTarget: { type: 'dynamic_service', serviceKey: 'buscar_usuario' }
      }
    });
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: 'onSubmit', type: 'execute_service', serviceKey: 'buscar_usuario' })
      ])
    );
    expect(validateGeneratedForm(action.document).bindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ bindingType: 'submit', targetKey: 'buscar_usuario' })])
    );
  });

  it('creates flow-backed approval forms with approve and reject commands', () => {
    const action = service.formDraftFromPrompt(
      'formulario que ejecuta flow para aprobar solicitud con decisión y comentario',
      formRequest('')
    );

    expect(action.document).toMatchObject({
      category: 'aprobaciones',
      runtime: { submitLabel: 'Enviar decisión' },
      persistence: {
        mode: 'flow',
        defaultTarget: { type: 'flow', flowKey: 'flow_validar_cliente' }
      }
    });
    expect(action.document.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'aprobar', type: 'execute_flow' }),
        expect.objectContaining({ key: 'rechazar', type: 'show_message' })
      ])
    );
    expect(validateGeneratedForm(action.document).bindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ bindingType: 'command', targetKey: 'flow_validar_cliente' })])
    );
  });

  it('creates select fields backed by a dynamic service data source', () => {
    const action = service.formDraftFromPrompt(
      'formulario con select de estado y lista de opciones desde servicio',
      formRequest('')
    );
    const fields = action.document.steps.flatMap((step: any) => step.fields);

    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'catalogo',
          type: 'select',
          dataSource: expect.objectContaining({
            type: 'dynamic_service',
            serviceKey: 'buscar_usuario'
          })
        })
      ])
    );
    expect(action.document.dataSources).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'dynamic_service', serviceKey: 'buscar_usuario' })])
    );
    expect(validateGeneratedForm(action.document).bindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ bindingType: 'options', targetKey: 'buscar_usuario' })])
    );
  });

  it('creates hybrid submit forms that save a record and then execute orchestration', () => {
    const action = service.formDraftFromPrompt('formulario que guarde record y luego ejecute servicio', formRequest(''));

    expect(action.document.persistence).toMatchObject({
      mode: 'hybrid',
      defaultTarget: { type: 'record' }
    });
    expect(action.document.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'create_record' }),
        expect.objectContaining({ type: 'execute_service', serviceKey: 'buscar_usuario' })
      ])
    );
    expect(validateGeneratedForm(action.document).bindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ bindingType: 'submit', targetKey: 'buscar_usuario' })])
    );
  });

  it('keeps form drafts blocked when the user lacks forms.manage', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );

    const response = await chatService.chat(
      { ...auth, user: { systemRole: 'viewer' }, permissions: ['forms.read'] } as any,
      formRequest('necesito un formulario de inspección con foto')
    );

    expect(response.message).toContain('falta forms.manage');
    expect(response.actions).toBeUndefined();
  });

  it.each([
    {
      prompt: 'formulario de registro de evento con nombre email fecha hora cantidad url y términos',
      key: 'registro_evento',
      fieldTypes: ['text', 'email', 'date', 'time', 'number', 'url', 'checkbox'],
      persistenceMode: 'record'
    },
    {
      prompt: 'formulario inmobiliario para capturar propiedad con dirección precio foto documento y activo',
      key: 'captura_inmueble',
      fieldTypes: ['text', 'currency', 'image', 'toggle'],
      persistenceMode: 'record'
    },
    {
      prompt: 'formulario de venta de ticket con nombre email cantidad monto fecha y hora',
      key: 'venta_ticket',
      fieldTypes: ['text', 'email', 'number', 'currency', 'date', 'time', 'datetime'],
      persistenceMode: 'record'
    },
    {
      prompt: 'formulario para usuario con email password rol y aceptación de términos',
      key: 'onboarding_cliente',
      fieldTypes: ['email', 'password', 'checkbox'],
      persistenceMode: 'record'
    },
    {
      prompt: 'formulario de consulta móvil por código que ejecute servicio lento y muestre respuesta',
      key: 'consulta_dinamica',
      fieldTypes: ['text'],
      persistenceMode: 'service'
    },
    {
      prompt: 'formulario personalizado oscuro compacto para capturar documento dirección teléfono y archivo',
      key: 'onboarding_cliente',
      fieldTypes: ['text', 'tel', 'file'],
      persistenceMode: 'record',
      themeMode: 'dark',
      density: 'compact'
    }
  ])('generates valid dynamic-form JSON for prompt: $prompt', ({ prompt, key, fieldTypes, persistenceMode, themeMode, density }) => {
    const action = service.formDraftFromPrompt(prompt, formRequest(''));
    const validation = validateGeneratedForm(action.document);
    const fields = action.document.steps.flatMap((step: any) => step.fields);

    expect(action).toMatchObject({
      type: 'apply_dynamic_form_json',
      key,
      publish: false,
      document: {
        schemaVersion: 1,
        kind: 'dynamic_form',
        key,
        persistence: { mode: persistenceMode }
      }
    });
    expect(fields.map((field: any) => field.type)).toEqual(expect.arrayContaining(fieldTypes));
    expect(action.document.layout).toMatchObject({
      strategy: 'adaptive_steps',
      desktop: expect.any(Object),
      tablet: expect.any(Object),
      mobile: expect.objectContaining({ mode: 'step_screens' })
    });
    if (themeMode) {
      expect(action.document.presentation).toMatchObject({ themeMode });
    }
    if (density) {
      expect(action.document.presentation).toMatchObject({ density });
    }
    expect(validation.schema.key).toBe(key);
  });

  it('uses current screen services and flows instead of fallback keys when generating bindings', () => {
    const requestWithTargets = formRequest('formulario que ejecuta flow y servicio con select desde servicio');
    requestWithTargets.screenState = {
      availableServices: [{ key: 'catalogo_roles', name: 'Catálogo roles', hasPublishedVersion: true }],
      availableFlows: [{ key: 'flow_guardar_roles', name: 'Guardar roles', hasPublishedVersion: true }]
    };

    const action = service.formDraftFromPrompt(
      'formulario que ejecuta flow y tiene select de opciones desde servicio',
      requestWithTargets
    );

    expect(action.document.persistence).toMatchObject({
      mode: 'flow',
      defaultTarget: { type: 'flow', flowKey: 'flow_guardar_roles' }
    });
    expect(action.document.dataSources).toEqual(
      expect.arrayContaining([expect.objectContaining({ serviceKey: 'catalogo_roles' })])
    );
    expect(validateGeneratedForm(action.document).bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetType: 'dynamic_service', targetKey: 'catalogo_roles' }),
        expect.objectContaining({ targetType: 'flow', targetKey: 'flow_guardar_roles' })
      ])
    );
  });

  it('starts a fresh form context when a new complete request arrives in an old chat', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const staleInspectionConversation: AiAssistantRequest['conversation'] = [
      { role: 'user', text: 'necesito un formulario de inspección móvil con foto gps observaciones offline' },
      {
        role: 'assistant',
        text: 'Interpretación: quieres crear el formulario Inspeccion Operativa. Siguiente paso: crear draft.'
      }
    ];

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('necesito un formulario de venta de ticket con nombre email cantidad y monto', staleInspectionConversation)
    );

    expect(response.message).toContain('Venta Ticket');
    expect(response.message).toContain('cantidad');
    expect(response.message).toContain('monto');
    expect(response.message).not.toContain('foto');
    expect(response.message).not.toContain('ubicacion');
  });

  it('creates the draft from the latest fresh request instead of an older form request', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const conversation: AiAssistantRequest['conversation'] = [
      { role: 'user', text: 'necesito un formulario de inspección móvil con foto gps observaciones offline' },
      {
        role: 'assistant',
        text: 'Interpretación: quieres crear el formulario Inspeccion Operativa. Siguiente paso: crear draft.'
      },
      { role: 'user', text: 'necesito un formulario de venta de ticket con nombre email cantidad y monto' },
      {
        role: 'assistant',
        text: 'Interpretación: quieres crear el formulario Venta Ticket. Revisión: preview web/móvil. Siguiente paso: crear draft.'
      }
    ];

    const response = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('crear draft', conversation)
    );
    const action = response.actions?.[0] as any;
    const fields = action.document.steps.flatMap((step: any) => step.fields);

    expect(action).toMatchObject({
      type: 'apply_dynamic_form_json',
      key: 'venta_ticket'
    });
    expect(fields.map((field: any) => field.key)).toEqual(expect.arrayContaining(['nombre', 'email', 'cantidad', 'monto']));
    expect(fields.map((field: any) => field.key)).not.toEqual(expect.arrayContaining(['foto', 'ubicacion']));
  });

  it('does not add currency fields just because a form executes a service', () => {
    const action = service.formDraftFromPrompt(
      'formulario de consulta por serial que ejecute servicio y muestre respuesta',
      formRequest('')
    );
    const fields = action.document.steps.flatMap((step: any) => step.fields);

    expect(fields.map((field: any) => field.key)).toEqual(expect.arrayContaining(['serial']));
    expect(fields.map((field: any) => field.key)).not.toContain('monto');
  });

  it('distinguishes document number from attached document files', () => {
    const documentNumber = service.formDraftFromPrompt('formulario para capturar documento nombre y email', formRequest(''));
    const uploadDocument = service.formDraftFromPrompt('formulario para capturar nombre y adjuntar documento', formRequest(''));

    const documentNumberFields = documentNumber.document.steps.flatMap((step: any) => step.fields);
    const uploadDocumentFields = uploadDocument.document.steps.flatMap((step: any) => step.fields);

    expect(documentNumberFields.map((field: any) => field.key)).toEqual(expect.arrayContaining(['documento']));
    expect(documentNumberFields.map((field: any) => field.key)).not.toContain('archivo');
    expect(uploadDocumentFields.map((field: any) => field.key)).toContain('archivo');
  });

  it('guides form trash and restore requests without automatic destructive actions', async () => {
    const chatService = new AiAssistantService(
      { get: jest.fn((_key, fallback) => fallback) } as any,
      { chat: jest.fn() } as any
    );
    const trash = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      {
        ...formRequest('eliminar este formulario'),
        screenState: {
          selected: { key: 'onboarding_cliente', title: 'Onboarding cliente', published: true }
        }
      }
    );
    const restore = await chatService.chat(
      { ...auth, permissions: ['forms.read', 'forms.manage'] } as any,
      formRequest('restaurar formulario onboarding_cliente')
    );

    expect(trash.message).toContain('no envía formularios a papelera automáticamente');
    expect(trash.actions).toBeUndefined();
    expect(restore.message).toContain('restaurar');
    expect(restore.actions).toBeUndefined();
  });
});

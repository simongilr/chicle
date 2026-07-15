import { DynamicServicesService } from './dynamic-services.service';
import { DynamicServiceDefinition } from './dynamic-service-version.entity';

describe('DynamicServicesService response mapping', () => {
  const service = Object.create(DynamicServicesService.prototype) as any;

  it('exposes configured response aliases for flow data mapping', () => {
    expect(
      service.withMappedResponse(
        {
          status: 200,
          body: {
            customer: { id: 'customer-1', active: true }
          }
        },
        {
          customerId: '{{response.body.customer.id}}',
          active: '{{response.body.customer.active}}'
        }
      )
    ).toMatchObject({
      mapped: {
        customerId: 'customer-1',
        active: true
      }
    });
  });
});

describe('DynamicServicesService internal query planning', () => {
  const columnsByTable: Record<string, Array<{ name: string; type?: string; nullable?: string; columnKey?: string }>> = {
    users: [
      { name: 'id', columnKey: 'PRI' },
      { name: 'tenantId' },
      { name: 'email' },
      { name: 'name' },
      { name: 'passwordHash' },
      { name: 'active' }
    ],
    user_roles: [
      { name: 'id', columnKey: 'PRI' },
      { name: 'tenantId' },
      { name: 'userId' },
      { name: 'roleId' }
    ],
    roles: [
      { name: 'id', columnKey: 'PRI' },
      { name: 'tenantId' },
      { name: 'key' },
      { name: 'name' }
    ],
    confisys: [
      { name: 'id', columnKey: 'PRI' },
      { name: 'key' },
      { name: 'value' }
    ],
    tenants: [
      { name: 'id', columnKey: 'PRI' },
      { name: 'slug' },
      { name: 'name' },
      { name: 'active' }
    ],
    records: [
      { name: 'id', columnKey: 'PRI' },
      { name: 'tenantId' },
      { name: 'recordType' },
      { name: 'formKey' },
      { name: 'data' }
    ],
    menus: [
      { name: 'id', columnKey: 'PRI' },
      { name: 'tenantId' },
      { name: 'key' },
      { name: 'label' },
      { name: 'route' },
      { name: 'enabled' }
    ]
  };

  const auth = {
    tenant: { id: 'tenant-1', slug: 'demo' },
    user: { id: 'user-1' }
  };

  function createService() {
    const rowsBySql: Record<string, Record<string, unknown>[]> = {};
    const dataSource = {
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes('information_schema.tables')) {
          const tableName = params?.[0] as string;
          return [{ total: columnsByTable[tableName] ? 1 : 0 }];
        }

        if (sql.includes('information_schema.columns')) {
          const tableName = params?.[0] as string;
          return (columnsByTable[tableName] ?? []).map((column) => ({
            name: column.name,
            type: column.type ?? 'varchar',
            nullable: column.nullable ?? 'NO',
            columnKey: column.columnKey ?? ''
          }));
        }

        if (sql.startsWith('SELECT')) {
          rowsBySql.last = [
            {
              userId: 'user-1',
              userEmail: 'admin@example.com',
              roleKey: 'client',
              roleName: 'Cliente app'
            }
          ];
          return rowsBySql.last;
        }

        return [];
      })
    };
    const service = Object.create(DynamicServicesService.prototype) as any;
    service.dataSource = dataSource;
    return { service, dataSource };
  }

  function usersByRoleDefinition(): DynamicServiceDefinition {
    return {
      intent: 'query',
      source: 'internal_table',
      resultKind: 'list',
      pagination: { enabled: false },
      effects: [{ type: 'show_response' }],
      dataTarget: {
        queryMode: 'multi_table',
        primaryTable: 'users',
        primaryAlias: 'u',
        involvedTables: ['user_roles', 'roles'],
        joins: [
          {
            type: 'left',
            table: 'user_roles',
            alias: 'ur',
            on: [{ left: 'u.id', operator: 'equals', right: 'ur.userId' }]
          },
          {
            type: 'left',
            table: 'roles',
            alias: 'r',
            on: [{ left: 'ur.roleId', operator: 'equals', right: 'r.id' }]
          }
        ],
        select: [
          { field: 'u.id', alias: 'userId' },
          { field: 'u.email', alias: 'userEmail' },
          { field: 'r.key', alias: 'roleKey' },
          { field: 'r.name', alias: 'roleName' }
        ],
        matchMode: 'all',
        filters: [
          {
            field: 'r.name',
            operator: 'equals',
            valueSource: 'input',
            inputKey: 'roleName',
            required: true
          }
        ],
        limit: 100
      },
      method: 'GET',
      url: 'internal://query/users_roles',
      headers: {},
      query: { roleName: '{{input.roleName}}' },
      body: null,
      timeoutMs: 8000,
      retry: { attempts: 0, backoffMs: 0 },
      responseMap: {}
    };
  }

  it('builds a safe multi-table users-to-roles plan with tenant scope and selected fields', async () => {
    const { service } = createService();

    const plan = await service.internalQueryPlan(auth, usersByRoleDefinition(), { roleName: 'Cliente app' });

    expect(plan.fromSql).toContain('LEFT JOIN `user_roles` `ur` ON `u`.`id` = `ur`.`userId`');
    expect(plan.fromSql).toContain('LEFT JOIN `roles` `r` ON `ur`.`roleId` = `r`.`id`');
    expect(plan.selectSql).toContain('`u`.`email` AS `userEmail`');
    expect(plan.selectSql).toContain('`r`.`name` AS `roleName`');
    expect(plan.whereSql).toEqual([
      '`u`.`tenantId` = ?',
      '`ur`.`tenantId` = ?',
      '`r`.`tenantId` = ?',
      '`r`.`name` = ?'
    ]);
    expect(plan.params).toEqual(['tenant-1', 'tenant-1', 'tenant-1', 'Cliente app']);
    expect(plan.limit).toBe(100);
  });

  it('supports optional OR filters for one-of-many searches', async () => {
    const { service } = createService();
    const definition: DynamicServiceDefinition = {
      ...usersByRoleDefinition(),
      resultKind: 'list',
      url: 'internal://table/users',
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: 'users',
        matchMode: 'any',
        filters: [
          { field: 'name', operator: 'contains', valueSource: 'input', inputKey: 'name', required: false },
          { field: 'email', operator: 'contains', valueSource: 'input', inputKey: 'email', required: false }
        ]
      }
    };

    const plan = await service.internalQueryPlan(auth, definition, { email: 'admin@example.com' });

    expect(plan.whereSql).toEqual(['`users`.`tenantId` = ?', '`users`.`email` LIKE ?']);
    expect(plan.params).toEqual(['tenant-1', '%admin@example.com%']);
  });

  it('fails optional OR filters when no filter value is provided at all', async () => {
    const { service } = createService();
    const definition: DynamicServiceDefinition = {
      ...usersByRoleDefinition(),
      url: 'internal://table/users',
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: 'users',
        matchMode: 'any',
        filters: [
          { field: 'name', operator: 'contains', valueSource: 'input', inputKey: 'name', required: false },
          { field: 'email', operator: 'contains', valueSource: 'input', inputKey: 'email', required: false }
        ]
      }
    };

    await expect(service.internalQueryPlan(auth, definition, {})).rejects.toThrow(
      'At least one filter value is required'
    );
  });

  it('applies current tenant and global table scopes correctly', async () => {
    const { service } = createService();
    const tenantPlan = await service.internalQueryPlan(
      auth,
      {
        source: 'internal_table',
        resultKind: 'single',
        method: 'GET',
        url: 'internal://table/tenants',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'tenants',
          filters: [{ field: 'slug', operator: 'equals', valueSource: 'input', inputKey: 'slug' }]
        }
      },
      { slug: 'demo' }
    );
    const globalPlan = await service.internalQueryPlan(
      auth,
      {
        source: 'internal_table',
        resultKind: 'list',
        method: 'GET',
        url: 'internal://table/confisys',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'confisys',
          filters: [{ field: 'key', operator: 'contains', valueSource: 'input', inputKey: 'key' }]
        }
      },
      { key: 'ai.' }
    );

    expect(tenantPlan.whereSql).toEqual(['`tenants`.`id` = ?', '`tenants`.`slug` = ?']);
    expect(tenantPlan.params).toEqual(['tenant-1', 'demo']);
    expect(globalPlan.whereSql).toEqual(['`confisys`.`key` LIKE ?']);
    expect(globalPlan.params).toEqual(['%ai.%']);
  });

  it('caps list limits at 100 and single results at 1 by default', async () => {
    const { service } = createService();
    const listPlan = await service.internalQueryPlan(
      auth,
      {
        source: 'internal_table',
        resultKind: 'list',
        method: 'GET',
        url: 'internal://table/users',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'users',
          limit: 500,
          filters: [{ field: 'email', operator: 'contains', valueSource: 'input', inputKey: 'email' }]
        }
      },
      { email: '@example.com' }
    );
    const singlePlan = await service.internalQueryPlan(
      auth,
      {
        source: 'internal_table',
        resultKind: 'single',
        method: 'GET',
        url: 'internal://table/users',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'users',
          filters: [{ field: 'email', operator: 'equals', valueSource: 'input', inputKey: 'email' }]
        }
      },
      { email: 'admin@example.com' }
    );

    expect(listPlan.limit).toBe(100);
    expect(singlePlan.limit).toBe(1);
  });

  it('rejects oversized select lists and blocked internal tables', async () => {
    const { service } = createService();
    const largeSelect = Array.from({ length: 81 }, (_item, index) => ({ field: 'id', alias: `id_${index}` }));

    await expect(
      service.internalQueryPlan(
        auth,
        {
          source: 'internal_table',
          resultKind: 'list',
          method: 'GET',
          url: 'internal://table/users',
          dataTarget: {
            queryMode: 'single_table',
            primaryTable: 'users',
            select: largeSelect,
            filters: [{ field: 'email', operator: 'contains', valueSource: 'input', inputKey: 'email' }]
          }
        },
        { email: '@example.com' }
      )
    ).rejects.toThrow('Internal query select list is too large');

    await expect(
      service.internalQueryPlan(
        auth,
        {
          source: 'internal_table',
          resultKind: 'list',
          method: 'GET',
          url: 'internal://table/auth_sessions',
          dataTarget: {
            queryMode: 'single_table',
            primaryTable: 'auth_sessions',
            filters: [{ field: 'id', operator: 'equals', valueSource: 'input', inputKey: 'id' }]
          }
        },
        { id: 'session-1' }
      )
    ).rejects.toThrow('Internal query table is not allowed');
  });

  it('rejects sensitive filter columns even if a JSON draft tries to use them', async () => {
    const { service } = createService();
    const definition = usersByRoleDefinition();
    definition.dataTarget = {
      queryMode: 'single_table',
      primaryTable: 'users',
      filters: [{ field: 'passwordHash', operator: 'contains', valueSource: 'input', inputKey: 'passwordHash' }]
    };

    await expect(service.internalQueryPlan(auth, definition, { passwordHash: 'abc' })).rejects.toThrow(
      'Internal query filter column is not allowed'
    );
  });

  it('rejects unknown aliases in filters before building SQL', async () => {
    const { service } = createService();
    const definition = usersByRoleDefinition();
    definition.dataTarget = {
      queryMode: 'single_table',
      primaryTable: 'users',
      filters: [{ field: 'r.name', operator: 'contains', valueSource: 'input', inputKey: 'name' }]
    };

    await expect(service.internalQueryPlan(auth, definition, { name: 'Cliente' })).rejects.toThrow(
      'Unknown table alias r'
    );
  });

  it('rejects duplicate aliases and joins without conditions', async () => {
    const { service } = createService();
    const duplicateAlias = usersByRoleDefinition();
    duplicateAlias.dataTarget!.joins = [
      { type: 'left', table: 'roles', alias: 'u', on: [{ left: 'u.id', right: 'u.id' }] }
    ];

    await expect(service.internalQueryPlan(auth, duplicateAlias, { roleName: 'Cliente app' })).rejects.toThrow(
      'Duplicate table alias u'
    );

    const missingCondition = usersByRoleDefinition();
    missingCondition.dataTarget!.joins = [{ type: 'left', table: 'roles', alias: 'r', on: [] }];

    await expect(service.internalQueryPlan(auth, missingCondition, { roleName: 'Cliente app' })).rejects.toThrow(
      'Join r requires at least one condition'
    );
  });
});

describe('DynamicServicesService CRUD validation', () => {
  const service = Object.create(DynamicServicesService.prototype) as any;

  it('normalizes valid JSON-only definitions for save and publish flows', () => {
    const definition = service.validateDefinition({
      source: 'internal_table',
      method: 'GET',
      url: 'internal://table/confisys',
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: 'confisys',
        filters: [{ field: 'key', operator: 'equals', valueSource: 'input', inputKey: 'key' }]
      },
      query: { key: '{{input.key}}' }
    });

    expect(definition).toMatchObject({
      intent: 'custom',
      source: 'internal_table',
      resultKind: 'single',
      pagination: { enabled: false },
      effects: [{ type: 'show_response' }],
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: 'confisys',
        matchMode: 'all'
      },
      retry: { attempts: 0, backoffMs: 0 },
      responseMap: {}
    });
  });

  it('rejects invalid service keys and unsupported HTTP methods early', () => {
    expect(() => service.normalizeKey('No Valido')).toThrow('Key must use snake_case');
    expect(() => service.validateDefinition({ method: 'TRACE', url: 'https://api.example.com' })).toThrow(
      'Unsupported HTTP method'
    );
  });

  it('masks secret headers and body values in request snapshots', () => {
    const url = new URL('https://api.example.com/validar');
    const snapshot = service.requestSnapshot(
      'POST',
      url,
      {
        Authorization: 'Bearer token-real',
        'X-Trace': 'trace-1'
      },
      {
        serial: 'ABC-123',
        token: 'secreto',
        nested: {
          password: 'clave'
        }
      }
    );

    expect(snapshot).toEqual({
      method: 'POST',
      url: 'https://api.example.com/validar',
      headers: {
        Authorization: '***',
        'X-Trace': 'trace-1'
      },
      body: {
        serial: 'ABC-123',
        token: '***',
        nested: {
          password: '***'
        }
      }
    });
  });

  it('renders external URLs safely and blocks private hosts by default', async () => {
    const renderService = Object.create(DynamicServicesService.prototype) as any;
    const context = {
      tenant: { slug: 'demo' },
      user: { id: 'user-1' },
      input: { serial: 'ABC-123' }
    };

    const url = await renderService.renderAndValidateUrl(
      'https://api.example.com/{{tenant.slug}}/validar',
      { serial: '{{input.serial}}' },
      context,
      { allowPrivateHosts: true }
    );

    expect(url.toString()).toBe('https://api.example.com/demo/validar?serial=ABC-123');
    await expect(
      renderService.renderAndValidateUrl(
        'http://localhost:3000/test',
        undefined,
        context,
        { allowPrivateHosts: false }
      )
    ).rejects.toThrow('Private hosts are blocked for dynamic services');
  });
});

describe('DynamicServicesService internal execution', () => {
  const auth = {
    tenant: { id: 'tenant-1', slug: 'demo' },
    user: { id: 'user-1' }
  };

  function createExecutableService(rows: Record<string, unknown>[]) {
    const dataSource = {
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes('information_schema.tables')) {
          return [{ total: 1 }];
        }

        if (sql.includes('information_schema.columns')) {
          const tableName = params?.[0] as string;
          const columns: Record<string, string[]> = {
            users: ['id', 'tenantId', 'email', 'name', 'active'],
            roles: ['id', 'tenantId', 'key', 'name'],
            user_roles: ['id', 'tenantId', 'userId', 'roleId'],
            custom_clients: ['id', 'tenantId', 'name', 'email', 'active']
          };
          return (columns[tableName] ?? []).map((name) => ({
            name,
            type: name === 'active' ? 'tinyint' : 'varchar',
            nullable: 'NO',
            columnKey: name === 'id' ? 'PRI' : ''
          }));
        }

        if (sql.startsWith('INSERT')) {
          return { affectedRows: 1, insertId: 0 };
        }

        if (sql.startsWith('UPDATE')) {
          return { affectedRows: 1 };
        }

        if (sql.startsWith('DELETE')) {
          return { affectedRows: 1 };
        }

        return rows;
      })
    };
    const run = {
      id: 'run-1',
      status: 'running'
    };
    const savedRuns: Record<string, unknown>[] = [];
    const runs = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...run, ...value })),
      update: jest.fn(async (_criteria, value) => savedRuns.push(value)),
      findOneOrFail: jest.fn(async () => ({ ...run, ...savedRuns.at(-1) }))
    };
    const audit = {
      record: jest.fn(async () => undefined)
    };
    const service = Object.create(DynamicServicesService.prototype) as any;
    service.dataSource = dataSource;
    service.runs = runs;
    service.audit = audit;
    return { service, dataSource, runs, audit };
  }

  function singleUsersDefinition(resultKind: DynamicServiceDefinition['resultKind']): DynamicServiceDefinition {
    return {
      source: 'internal_table',
      resultKind,
      method: 'GET',
      url: 'internal://table/users',
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: 'users',
        filters: [{ field: 'email', operator: 'equals', valueSource: 'input', inputKey: 'email' }]
      }
    };
  }

  it('returns list, single, and boolean result shapes consistently', async () => {
    const rows = [{ id: 'user-1', email: 'admin@example.com' }];

    for (const [resultKind, expected] of [
      ['list', rows],
      ['single', rows[0]],
      ['boolean', true]
    ] as const) {
      const { service } = createExecutableService(rows);
      const run = await service.executeInternalQuery(
        auth,
        { id: 'service-1', active: true },
        { id: 'version-1', definition: singleUsersDefinition(resultKind) },
        { email: 'admin@example.com' },
        'frontend'
      );

      expect(run.status).toBe('success');
      expect(run.responseSnapshot).toMatchObject({
        table: 'users',
        queryMode: 'single_table',
        count: 1,
        result: expected
      });
    }
  });

  it('records failed runs when the JSON references a missing required input', async () => {
    const { service, audit } = createExecutableService([]);

    const run = await service.executeInternalQuery(
      auth,
      { id: 'service-1', active: true },
      { id: 'version-1', definition: singleUsersDefinition('single') },
      {},
      'frontend'
    );

    expect(run.status).toBe('failed');
    expect(run.error).toContain('Filter value for email is required');
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('creates internal rows from a safe writeMap and tenant scope', async () => {
    const { service, dataSource } = createExecutableService([]);
    const definition: DynamicServiceDefinition = {
      intent: 'create',
      source: 'internal_table',
      resultKind: 'single',
      method: 'POST',
      url: 'internal://table/custom_clients',
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: 'custom_clients',
        writeMap: {
          name: '{{input.name}}',
          email: '{{input.email}}'
        }
      }
    };

    const run = await service.executeInternalTable(
      auth,
      { id: 'service-1', active: true },
      { id: 'version-1', definition },
      { name: 'Simon', email: 'simon@example.com' },
      'frontend'
    );

    const writeCall = dataSource.query.mock.calls.find(([sql]) => String(sql).startsWith('INSERT'));
    expect(writeCall?.[0]).toContain('INSERT INTO `custom_clients`');
    expect(writeCall?.[1]).toEqual(expect.arrayContaining(['tenant-1', 'Simon', 'simon@example.com']));
    expect(run.status).toBe('success');
    expect(run.responseSnapshot).toMatchObject({
      table: 'custom_clients',
      operation: 'create',
      affectedRows: 1,
      result: {
        tenantId: 'tenant-1',
        name: 'Simon',
        email: 'simon@example.com'
      }
    });
  });

  it('blocks internal updates without an explicit filter', async () => {
    const { service } = createExecutableService([]);
    const definition: DynamicServiceDefinition = {
      intent: 'update',
      source: 'internal_table',
      resultKind: 'single',
      method: 'PATCH',
      url: 'internal://table/custom_clients',
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: 'custom_clients',
        writeMap: {
          name: '{{input.name}}'
        },
        filters: []
      }
    };

    const run = await service.executeInternalTable(
      auth,
      { id: 'service-1', active: true },
      { id: 'version-1', definition },
      { name: 'Nuevo' },
      'frontend'
    );

    expect(run.status).toBe('failed');
    expect(run.error).toContain('requires at least one filter');
  });

  it('updates internal rows with tenant scope and configured filters', async () => {
    const { service, dataSource } = createExecutableService([]);
    const definition: DynamicServiceDefinition = {
      intent: 'update',
      source: 'internal_table',
      resultKind: 'single',
      method: 'PATCH',
      url: 'internal://table/custom_clients',
      dataTarget: {
        queryMode: 'single_table',
        primaryTable: 'custom_clients',
        writeMap: {
          name: '{{input.name}}'
        },
        filters: [{ field: 'id', operator: 'equals', valueSource: 'input', inputKey: 'id', required: true }]
      }
    };

    const run = await service.executeInternalTable(
      auth,
      { id: 'service-1', active: true },
      { id: 'version-1', definition },
      { id: 'client-1', name: 'Nuevo' },
      'frontend'
    );

    const writeCall = dataSource.query.mock.calls.find(([sql]) => String(sql).startsWith('UPDATE'));
    expect(writeCall?.[0]).toBe('UPDATE `custom_clients` SET `name` = ? WHERE `custom_clients`.`tenantId` = ? AND `custom_clients`.`id` = ?');
    expect(writeCall?.[1]).toEqual(['Nuevo', 'tenant-1', 'client-1']);
    expect(run.status).toBe('success');
    expect(run.responseSnapshot).toMatchObject({
      table: 'custom_clients',
      operation: 'update',
      affectedRows: 1
    });
  });
});

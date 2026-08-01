import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DynamicAppsService } from './dynamic-apps.service';

describe('DynamicAppsService package contract', () => {
  const service = Object.create(DynamicAppsService.prototype) as any;

  it('collects package dependencies from app text, screens, components and data sources', () => {
    const dependencies = service.packageDependencies(
      {
        schemaVersion: 1,
        kind: 'dynamic_app',
        key: 'operations_app',
        name: 'Operations App',
        text: { namespace: 'app.operations' }
      },
      [
        {
          schemaVersion: 1,
          kind: 'dynamic_screen',
          appKey: 'operations_app',
          key: 'home',
          title: 'Home',
          textNamespace: 'screen.home',
          components: [
            {
              id: 'form_runtime_1',
              componentKey: 'form_runtime',
              inputs: { formKey: 'inspection_form' }
            },
            {
              id: 'service_button_1',
              componentKey: 'service_button',
              inputs: { serviceKey: 'create_inspection' }
            },
            {
              id: 'flow_button_1',
              componentKey: 'flow_button',
              inputs: { flowKey: 'approve_inspection' },
              actions: [{ type: 'execute_flow', flowKey: 'close_inspection' }]
            },
            {
              id: 'data_table_1',
              componentKey: 'data_table',
              inputs: { table: 'custom_inspections' }
            },
            {
              id: 'modal_form_1',
              componentKey: 'modal_shell',
              actions: [{ type: 'submit_form', formKey: 'inspection_detail_form' }]
            }
          ],
          dataSources: [
            {
              type: 'dynamic_service',
              serviceKey: 'list_inspections',
              table: 'custom_inspections'
            }
          ]
        }
      ]
    );

    expect(dependencies).toEqual({
      componentKeys: ['data_table', 'flow_button', 'form_runtime', 'modal_shell', 'service_button'],
      formKeys: ['inspection_detail_form', 'inspection_form'],
      serviceKeys: ['create_inspection', 'list_inspections'],
      flowKeys: ['approve_inspection', 'close_inspection'],
      textNamespaces: ['app.operations', 'screen.home'],
      customTables: ['custom_inspections']
    });
  });

  it('resolves a published runtime screen by route and target', async () => {
    const runtimeService = Object.create(DynamicAppsService.prototype) as any;
    const auth = {
      tenant: { id: 'tenant-1', slug: 'acme', name: 'Acme' },
      user: { id: 'user-1', systemRole: 'member' },
      roles: [],
      permissions: ['clientes.read']
    };
    const app = {
      id: 'app-1',
      tenantId: 'tenant-1',
      key: 'tuerca',
      name: 'Tuerca',
      description: 'Operations app',
      category: 'operations',
      targets: ['web', 'mobile'],
      manifest: {
        schemaVersion: 1,
        kind: 'dynamic_app',
        key: 'tuerca',
        name: 'Tuerca',
        navigation: { startRoute: '/home' }
      },
      version: 3,
      published: true,
      publishedVersionId: 'app-version-3'
    };
    runtimeService.requireAppByKey = jest.fn().mockResolvedValue(app);
    runtimeService.resolveAppRuntimeVersion = jest.fn().mockResolvedValue({
      version: 3,
      manifest: app.manifest
    });
    runtimeService.screens = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'screen-home',
          key: 'home',
          title: 'Home',
          route: '/home',
          target: 'multi',
          version: 1,
          published: true,
          definition: {
            schemaVersion: 1,
            kind: 'dynamic_screen',
            key: 'home',
            title: 'Home',
            route: '/home',
            target: 'multi',
            navigation: { showInMenu: true, label: 'Inicio', group: 'main', icon: 'home' },
            components: []
          }
        },
        {
          id: 'screen-clientes',
          key: 'clientes',
          title: 'Clientes',
          route: '/clientes',
          target: 'mobile',
          version: 2,
          published: true,
          definition: {
            schemaVersion: 1,
            kind: 'dynamic_screen',
            key: 'clientes',
            title: 'Clientes',
            route: '/clientes',
            target: 'mobile',
            navigation: { showInMenu: true, label: 'Clientes', group: 'main', permissions: ['clientes.read'] },
            components: []
          }
        },
        {
          id: 'screen-draft',
          key: 'draft',
          title: 'Draft',
          route: '/draft',
          target: 'multi',
          version: 1,
          published: false,
          definition: {}
        }
      ])
    };
    runtimeService.resolveScreenRuntimeVersion = jest.fn().mockImplementation((_auth, screen) =>
      Promise.resolve({
        version: screen.version,
        definition: screen.definition
      })
    );

    const response = await runtimeService.runtimeRouteByKey(auth, 'tuerca', '/clientes', 'mobile');

    expect(response.kind).toBe('dynamic_app_runtime_route');
    expect(response.screen.key).toBe('clientes');
    expect(response.screen.permissions).toEqual(['clientes.read']);
    expect(response.navigation.map((item: { route: string }) => item.route)).toEqual(['/home', '/clientes']);
    expect(response.cache.key).toContain('tenant-1:tuerca:3:clientes:2:mobile:/clientes');
  });

  it('blocks a published runtime route when the user lacks screen permissions', async () => {
    const runtimeService = Object.create(DynamicAppsService.prototype) as any;
    const auth = {
      tenant: { id: 'tenant-1', slug: 'acme', name: 'Acme' },
      user: { id: 'user-1', systemRole: 'member' },
      roles: [],
      permissions: []
    };
    const app = {
      id: 'app-1',
      tenantId: 'tenant-1',
      key: 'tuerca',
      name: 'Tuerca',
      description: 'Operations app',
      category: 'operations',
      targets: ['web'],
      manifest: {
        schemaVersion: 1,
        kind: 'dynamic_app',
        key: 'tuerca',
        name: 'Tuerca',
        navigation: { startRoute: '/admin' }
      },
      version: 1,
      published: true,
      publishedVersionId: 'app-version-1'
    };
    runtimeService.requireAppByKey = jest.fn().mockResolvedValue(app);
    runtimeService.resolveAppRuntimeVersion = jest.fn().mockResolvedValue({
      version: 1,
      manifest: app.manifest
    });
    runtimeService.screens = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'screen-admin',
          key: 'admin',
          title: 'Admin',
          route: '/admin',
          target: 'web',
          version: 1,
          published: true,
          definition: {
            schemaVersion: 1,
            kind: 'dynamic_screen',
            key: 'admin',
            title: 'Admin',
            route: '/admin',
            target: 'web',
            permissions: ['admin.read'],
            navigation: { showInMenu: true, label: 'Admin' },
            components: []
          }
        }
      ])
    };
    runtimeService.resolveScreenRuntimeVersion = jest.fn().mockImplementation((_auth, screen) =>
      Promise.resolve({
        version: screen.version,
        definition: screen.definition
      })
    );

    await expect(runtimeService.runtimeRouteByKey(auth, 'tuerca', '/admin', 'web')).rejects.toThrow(ForbiddenException);
  });

  it('filters runtime components by component permissions', async () => {
    const runtimeService = Object.create(DynamicAppsService.prototype) as any;
    const auth = {
      tenant: { id: 'tenant-1', slug: 'acme', name: 'Acme' },
      user: { id: 'user-1', systemRole: 'member' },
      roles: [],
      permissions: ['metrics.read']
    };
    const app = {
      id: 'app-1',
      tenantId: 'tenant-1',
      key: 'dashboard',
      name: 'Dashboard',
      description: 'Runtime app',
      category: 'analytics',
      targets: ['web'],
      manifest: { schemaVersion: 1, kind: 'dynamic_app', key: 'dashboard', name: 'Dashboard' },
      version: 1,
      published: true
    };
    runtimeService.requireAppByKey = jest.fn().mockResolvedValue(app);
    runtimeService.resolveAppRuntimeVersion = jest.fn().mockResolvedValue({
      version: 1,
      manifest: app.manifest
    });
    runtimeService.screens = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'screen-home',
          key: 'home',
          title: 'Home',
          route: '/home',
          target: 'web',
          version: 1,
          published: true,
          definition: {
            schemaVersion: 1,
            kind: 'dynamic_screen',
            key: 'home',
            title: 'Home',
            route: '/home',
            target: 'web',
            components: [
              { componentKey: 'metric_strip', permissions: ['metrics.read'] },
              { componentKey: 'data_table', permissions: ['records.admin'] }
            ]
          }
        }
      ])
    };
    runtimeService.resolveScreenRuntimeVersion = jest.fn().mockImplementation((_auth, screen) =>
      Promise.resolve({ version: screen.version, definition: screen.definition })
    );

    const response = await runtimeService.runtimeRouteByKey(auth, 'dashboard', '/home', 'web');

    expect(response.screen.definition.components.map((component: { componentKey: string }) => component.componentKey)).toEqual([
      'metric_strip'
    ]);
  });

  it('normalizes an installable package without marking imported screens as published', () => {
    const appPackage = service.normalizePackage({
      schemaVersion: 1,
      kind: 'chicle_app_package',
      packageKey: 'field_app',
      name: 'Field App',
      app: {
        manifest: {
          key: 'field_app',
          name: 'Field App',
          targets: ['web', 'mobile'],
          text: { namespace: 'app.field' }
        }
      },
      screens: [
        {
          key: 'inspection',
          version: 7,
          published: true,
          definition: {
            key: 'inspection',
            title: 'Inspection',
            route: '/inspection',
            target: 'mobile',
            components: [
              {
                componentKey: 'form_runtime',
                inputs: { formKey: 'inspection_form' }
              }
            ]
          }
        }
      ]
    });

    expect(appPackage).toMatchObject({
      schemaVersion: 1,
      kind: 'chicle_app_package',
      packageKey: 'field_app',
      app: {
        key: 'field_app',
        version: 1,
        status: 'draft',
        published: false,
        manifest: {
          kind: 'dynamic_app',
          key: 'field_app',
          name: 'Field App',
          targets: ['web', 'mobile']
        }
      },
      screens: [
        {
          key: 'inspection',
          version: 7,
          status: 'draft',
          published: false,
          definition: {
            kind: 'dynamic_screen',
            appKey: 'field_app',
            key: 'inspection',
            title: 'Inspection',
            target: 'mobile',
            components: [
              {
                componentKey: 'form_runtime',
                title: 'Form Runtime',
                region: 'content',
                inputs: { formKey: 'inspection_form' }
              }
            ]
          }
        }
      ],
      dependencies: {
        componentKeys: ['form_runtime'],
        formKeys: ['inspection_form'],
        serviceKeys: [],
        flowKeys: [],
        textNamespaces: ['app.field'],
        customTables: []
      },
      install: {
        mode: 'upsert',
        conflictStrategy: 'active_keys_block',
        publishOnInstall: false
      }
    });
  });

  it('rejects documents that are not Chicle app packages', () => {
    expect(() => service.normalizePackage({ kind: 'dynamic_app' })).toThrow(BadRequestException);
  });

  it('previews a package install without mutating app or screen records', async () => {
    const dryRunService = Object.create(DynamicAppsService.prototype) as any;
    dryRunService.apps = {
      findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    };
    dryRunService.screens = {
      find: jest.fn()
    };
    const response = await dryRunService.dryRunInstallPackage(
      {
        tenant: { id: 'tenant-1' },
        user: { id: 'user-1', systemRole: 'owner' },
        roles: [{ key: 'owner', name: 'Owner' }],
        permissions: []
      },
      {
        document: {
          schemaVersion: 1,
          kind: 'chicle_app_package',
          packageKey: 'gallery_app',
          name: 'Gallery App',
          app: {
            manifest: { key: 'gallery_app', name: 'Gallery App' }
          },
          screens: [
            {
              definition: {
                key: 'home',
                title: 'Home',
                route: '/home',
                target: 'web',
                components: [{ componentKey: 'media_gallery' }]
              }
            }
          ]
        }
      }
    );

    expect(response.kind).toBe('chicle_app_package_dry_run');
    expect(response.app.action).toBe('create_new_app');
    expect(response.screens).toEqual([
      expect.objectContaining({ key: 'home', action: 'create_new_screen' })
    ]);
    expect(response.installPlan.safeToInstall).toBe(true);
    expect(dryRunService.screens.find).not.toHaveBeenCalled();
  });

  it('scopes screen keys by app inside the same tenant', async () => {
    const scopedService = Object.create(DynamicAppsService.prototype) as any;
    scopedService.screens = {
      findOne: jest.fn().mockResolvedValue(null)
    };

    await scopedService.assertActiveScreenKeyAvailable({ tenant: { id: 'tenant-1' } }, 'app-1', 'inicio');

    expect(scopedService.screens.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({
        tenantId: 'tenant-1',
        appId: 'app-1',
        key: 'inicio'
      })
    });
  });

  it('keeps the original status when moving an artifact through trash metadata', () => {
    const metadata = service.withTrashMetadata(null, 'tuerca', 'published');

    expect(metadata).toEqual({
      trash: {
        originalKey: 'tuerca',
        originalStatus: 'published'
      }
    });
    expect(service.originalStatusFromMetadata(metadata)).toBe('published');
  });

  it('does not overwrite preserved trash status when freeing a trashed key again', () => {
    const metadata = service.withTrashMetadata(
      {
        trash: {
          originalKey: 'tuerca',
          originalStatus: 'published'
        }
      },
      'tuerca',
      'trashed'
    );

    expect(metadata.trash.originalStatus).toBe('published');
  });
});

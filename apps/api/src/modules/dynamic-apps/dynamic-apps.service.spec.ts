import { BadRequestException } from '@nestjs/common';
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
              inputs: { flowKey: 'approve_inspection' }
            },
            {
              id: 'data_table_1',
              componentKey: 'data_table',
              inputs: { table: 'custom_inspections' }
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
      componentKeys: ['data_table', 'flow_button', 'form_runtime', 'service_button'],
      formKeys: ['inspection_form'],
      serviceKeys: ['create_inspection', 'list_inspections'],
      flowKeys: ['approve_inspection'],
      textNamespaces: ['app.operations', 'screen.home'],
      customTables: ['custom_inspections']
    });
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

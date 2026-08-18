import { BadRequestException } from '@nestjs/common';
import { DECLARATIVE_COMPONENT_SEEDS } from './declarative-components.seed';
import { DeclarativeComponentsService } from './declarative-components.service';

function repoMock() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((value) => value),
    merge: jest.fn((target, value) => ({ ...target, ...value })),
    save: jest.fn((value) => Promise.resolve(value))
  };
}

describe('DeclarativeComponentsService', () => {
  it('normalizes a declarative component contract with children', async () => {
    const definitions = repoMock();
    definitions.findOne.mockResolvedValue({ componentKey: 'ui.card' });
    const service = new DeclarativeComponentsService(definitions as any, repoMock() as any, repoMock() as any, repoMock() as any);

    const result = await service.normalizeContract({
      componentKey: 'ui.card',
      props: { title: 'Panel' },
      children: [{ componentKey: 'ui.card', props: { title: 'Nested' } }]
    });

    expect(result.kind).toBe('dynamic_component');
    expect(result.schemaVersion).toBe(1);
    expect(result.componentKey).toBe('ui.card');
    expect(result.children).toHaveLength(1);
    expect(result.children?.[0].componentKey).toBe('ui.card');
  });

  it('rejects unknown component keys', async () => {
    const definitions = repoMock();
    definitions.findOne.mockResolvedValue(null);
    const service = new DeclarativeComponentsService(definitions as any, repoMock() as any, repoMock() as any, repoMock() as any);

    await expect(service.normalizeContract({ componentKey: 'missing.component' })).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('accepts supported declarative actions with payload maps and permissions', async () => {
    const definitions = repoMock();
    definitions.findOne.mockResolvedValue({ componentKey: 'ui.button' });
    const service = new DeclarativeComponentsService(definitions as any, repoMock() as any, repoMock() as any, repoMock() as any);

    const result = await service.normalizeContract({
      componentKey: 'ui.button',
      actions: {
        onClick: {
          type: 'execute_service',
          serviceKey: 'crear_cliente',
          permissions: ['services.execute'],
          payloadMap: { nombre: '{{state.nombre}}' }
        }
      }
    });

    expect(result.actions).toEqual({
      onClick: {
        type: 'execute_service',
        serviceKey: 'crear_cliente',
        permissions: ['services.execute'],
        payloadMap: { nombre: '{{state.nombre}}' }
      }
    });
  });

  it('rejects unsupported or incomplete declarative actions', async () => {
    const definitions = repoMock();
    definitions.findOne.mockResolvedValue({ componentKey: 'ui.button' });
    const service = new DeclarativeComponentsService(definitions as any, repoMock() as any, repoMock() as any, repoMock() as any);

    await expect(
      service.normalizeContract({
        componentKey: 'ui.button',
        actions: { onClick: { type: 'execute_service' } }
      })
    ).rejects.toThrow('serviceKey');

    await expect(
      service.normalizeContract({
        componentKey: 'ui.button',
        actions: { onClick: { type: 'raw_javascript', code: 'alert(1)' } }
      })
    ).rejects.toThrow('unsupported type');
  });

  it('validates declarative actions nested inside component props', async () => {
    const definitions = repoMock();
    definitions.findOne.mockResolvedValue({ componentKey: 'ui.action_group' });
    const service = new DeclarativeComponentsService(definitions as any, repoMock() as any, repoMock() as any, repoMock() as any);

    await expect(
      service.normalizeContract({
        componentKey: 'ui.action_group',
        props: {
          actions: [
            {
              key: 'broken',
              label: 'Broken',
              action: { type: 'execute_service' }
            }
          ]
        }
      })
    ).rejects.toThrow('serviceKey');

    const result = await service.normalizeContract({
      componentKey: 'ui.action_group',
      props: {
        actions: [
          {
            key: 'ok',
            label: 'Ok',
            action: { type: 'show_message', message: 'ok' }
          }
        ]
      }
    });

    expect((result.props as any).actions[0].action.type).toBe('show_message');
  });

  it('rejects unsafe data bindings', async () => {
    const definitions = repoMock();
    definitions.findOne.mockResolvedValue({ componentKey: 'ui.card' });
    const service = new DeclarativeComponentsService(definitions as any, repoMock() as any, repoMock() as any, repoMock() as any);

    await expect(
      service.normalizeContract({
        componentKey: 'ui.card',
        bindings: { data: 'https://example.com/raw-api' }
      })
    ).rejects.toThrow('raw external URLs');
  });

  it('seeds the renderable declarative component keys with all visual kit adapters', () => {
    const expectedKeys = [
      'ui.button',
      'form.field',
      'ui.card',
      'layout.stack',
      'layout.grid',
      'layout.row',
      'layout.column',
      'layout.split_pane',
      'layout.header',
      'layout.content',
      'layout.footer',
      'layout.region',
      'feedback.alert',
      'feedback.toast',
      'feedback.loading',
      'feedback.skeleton',
      'feedback.spinner',
      'feedback.progress',
      'ui.badge',
      'ui.chip',
      'ui.text',
      'ui.title',
      'ui.note',
      'ui.avatar',
      'ui.icon',
      'ui.accordion',
      'ui.accordion_group',
      'ui.segment',
      'ui.metric_card',
      'nav.toolbar',
      'nav.menu',
      'nav.tabs',
      'nav.link',
      'nav.breadcrumbs',
      'data.table',
      'data.list',
      'data.list_header',
      'data.list_item',
      'data.list_divider',
      'data.detail',
      'data.metric_strip',
      'media.gallery',
      'media.image',
      'media.thumbnail',
      'overlay.modal',
      'ui.action_group',
      'ui.fab',
      'auth.login',
      'app.shell',
      'app.home_menu',
      'form.runtime',
      'service.result',
      'service.result_actions',
      'flow.trigger_button',
      'flow.stepper',
      'record.list',
      'record.detail',
      'record.editor',
      'nav.side_menu',
      'nav.bottom_tabs',
      'chart.panel',
      'map.view',
      'map.gps_capture',
      'status.offline',
      'status.sync_queue',
      'form.mobile_shell',
      'overlay.action_sheet',
      'media.camera_capture'
    ];
    const byKey = new Map(DECLARATIVE_COMPONENT_SEEDS.map((seed) => [seed.componentKey, seed]));
    const requiredKits = ['bootstrap', 'ionic', 'material', 'native', 'primeng'];

    for (const key of expectedKeys) {
      const seed = byKey.get(key);
      expect(seed).toBeDefined();
      expect(seed?.adapters.map((adapter) => adapter.kit).sort()).toEqual(requiredKits);
    }
  });
});

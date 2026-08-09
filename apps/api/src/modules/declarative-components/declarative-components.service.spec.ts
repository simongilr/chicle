import { BadRequestException } from '@nestjs/common';
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
});

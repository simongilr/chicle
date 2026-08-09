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
});

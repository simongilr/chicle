import { RbacService } from './rbac.service';

describe('RbacService resource access', () => {
  const auth = {
    tenant: { id: 'tenant-1' },
    roles: [{ key: 'operator', name: 'Operator' }]
  } as any;

  function serviceWith(mode?: 'all' | 'selected' | 'none', grantedIds: string[] = []) {
    const service = Object.create(RbacService.prototype) as any;
    service.roles = {
      find: jest.fn().mockResolvedValue([{ id: 'role-1', key: 'operator' }])
    };
    service.roleResourcePolicies = {
      find: jest.fn().mockResolvedValue(
        mode
          ? [
              {
                roleId: 'role-1',
                resourceType: 'flow',
                mode
              }
            ]
          : []
      )
    };
    service.roleResourceGrants = {
      find: jest.fn().mockResolvedValue(
        grantedIds.map((resourceId) => ({
          roleId: 'role-1',
          resourceType: 'flow',
          resourceId
        }))
      )
    };
    return service as RbacService;
  }

  it('keeps legacy roles unrestricted until a policy is configured', async () => {
    await expect(serviceWith().filterAccessibleResourceIds(auth, 'flow', ['flow-1', 'flow-2'])).resolves.toEqual([
      'flow-1',
      'flow-2'
    ]);
  });

  it('supports none and selected resource modes', async () => {
    await expect(serviceWith('none').filterAccessibleResourceIds(auth, 'flow', ['flow-1'])).resolves.toEqual([]);
    await expect(
      serviceWith('selected', ['flow-2']).filterAccessibleResourceIds(auth, 'flow', ['flow-1', 'flow-2'])
    ).resolves.toEqual(['flow-2']);
  });

  it('never restricts the owner role', async () => {
    await expect(
      serviceWith('none').filterAccessibleResourceIds(
        { ...auth, roles: [{ key: 'owner', name: 'Owner' }] },
        'flow',
        ['flow-1']
      )
    ).resolves.toEqual(['flow-1']);
  });
});

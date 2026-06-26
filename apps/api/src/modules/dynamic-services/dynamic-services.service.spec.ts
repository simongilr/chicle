import { DynamicServicesService } from './dynamic-services.service';

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

import { BadRequestException } from '@nestjs/common';
import { Flow } from './flow.entity';
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
});

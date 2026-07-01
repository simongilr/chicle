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

  it('evaluates assertions against nested flow output', () => {
    const actual = {
      status: 'success',
      output: {
        body: {
          ok: true,
          role: 'owner',
          total: 125
        }
      }
    };

    expect(
      service.evaluateTestAssertion({ path: 'output.body.role', operator: 'equals', expected: 'owner' }, actual).passed
    ).toBe(true);
    expect(
      service.evaluateTestAssertion({ path: 'output.body.total', operator: 'greater_than', expected: 100 }, actual)
        .passed
    ).toBe(true);
    expect(service.evaluateTestAssertion({ path: 'output.body.missing', operator: 'exists' }, actual).passed).toBe(
      false
    );
  });

  it('matches expected output as a partial object', () => {
    expect(
      service.deepContains(
        { status: 'success', body: { ok: true, role: 'owner', extra: 1 } },
        { body: { ok: true, role: 'owner' } }
      )
    ).toBe(true);
    expect(service.deepContains({ status: 'success', body: { ok: false } }, { body: { ok: true } })).toBe(false);
  });

  it('hashes webhook secrets and never returns the hash to the client', () => {
    const config = service.cleanTriggerConfig('http', {
      secret: 'super-secret-value',
      inputMode: 'payload'
    });
    expect(config.secret).toBeUndefined();
    expect(config.secretHash).toHaveLength(64);

    const publicTrigger = service.publicTrigger({
      type: 'http',
      config
    });
    expect(publicTrigger.config.secretHash).toBeUndefined();
    expect(publicTrigger.secretConfigured).toBe(true);
  });

  it('rejects weak webhook secrets', () => {
    expect(() => service.cleanTriggerConfig('http', { secret: 'short-secret' })).toThrow(BadRequestException);
  });
});

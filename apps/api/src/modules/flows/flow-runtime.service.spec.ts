import { createHash } from 'node:crypto';
import { FlowRuntimeService } from './flow-runtime.service';

describe('FlowRuntimeService durable runtime helpers', () => {
  const service = Object.create(FlowRuntimeService.prototype) as any;

  it('validates webhook secrets in constant-length form', () => {
    const hash = createHash('sha256').update('correct-secret').digest('hex');
    expect(service.matchesSecret('correct-secret', hash)).toBe(true);
    expect(service.matchesSecret('wrong-secret', hash)).toBe(false);
    expect(service.matchesSecret(undefined, hash)).toBe(false);
  });

  it('uses bounded exponential retry backoff', () => {
    service.confisys = { get: (_key: string, fallback: number) => fallback };
    expect(service.retryBackoff(1)).toBe(1000);
    expect(service.retryBackoff(2)).toBe(2000);
    expect(service.retryBackoff(20)).toBe(300000);
  });

  it('builds payload or envelope input from a trigger', () => {
    const event = {
      id: 'event-id',
      eventKey: 'record.created',
      aggregateType: 'record',
      aggregateId: 'record-id',
      payload: { email: 'person@example.com' },
      headers: { source: 'test' }
    };
    expect(service.eventInput({ config: { inputMode: 'payload' } }, event)).toEqual({
      email: 'person@example.com'
    });
    expect(service.eventInput({ config: { inputMode: 'envelope' } }, event)).toMatchObject({
      event: {
        id: 'event-id',
        key: 'record.created',
        payload: { email: 'person@example.com' }
      }
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { FlowExpressionEngine } from './flow-expression-engine.service';

describe('FlowExpressionEngine', () => {
  const engine = new FlowExpressionEngine({
    get: (_key: string, fallback: unknown) => fallback
  } as never);
  const data = {
    input: { age: 21, email: 'person@example.com', subtotal: 100 },
    tenant: { slug: 'demo' },
    user: { id: 'user-1' },
    steps: { lookup: { active: true } }
  };

  it('evaluates declarative decisions', () => {
    expect(engine.evaluateBoolean({ and: [{ '>=': [{ var: 'input.age' }, 18] }, { var: 'steps.lookup.active' }] }, data)).toBe(
      true
    );
  });

  it('evaluates arithmetic formulas', () => {
    expect(engine.evaluate({ '*': [{ var: 'input.subtotal' }, 0.19] }, data)).toBe(19);
  });

  it('validates fields with guided operators', () => {
    expect(engine.validate({ field: 'input.email', operator: 'email' }, data)).toMatchObject({
      valid: true,
      field: 'input.email',
      value: 'person@example.com'
    });
  });

  it('rejects paths outside the controlled execution context', () => {
    expect(() => engine.validate({ field: 'process.env.SECRET', operator: 'required' }, data)).toThrow(
      BadRequestException
    );
  });

  it('returns a useful validation failure', () => {
    expect(
      engine.validate(
        { field: 'input.email', operator: 'equals', value: 'other@example.com', message: 'El correo no coincide' },
        data
      )
    ).toMatchObject({
      valid: false,
      message: 'El correo no coincide'
    });
  });

  it('rejects unknown operations', () => {
    expect(() => engine.evaluate({ executeCode: ['danger'] }, data)).toThrow(BadRequestException);
  });
});

import { BadRequestException, Injectable } from '@nestjs/common';
import * as jsonLogic from 'json-logic-js';
import { ConfisysService } from '../confisys/confisys.service';

export type FlowRule = jsonLogic.RulesLogic<jsonLogic.AdditionalOperation>;

export interface FlowValidationConfig {
  field?: string;
  operator?: string;
  value?: unknown;
  message?: string;
  rule?: FlowRule;
}

const ALLOWED_JSON_LOGIC_OPERATORS = new Set([
  'var',
  'missing',
  'missing_some',
  'if',
  '==',
  '===',
  '!=',
  '!==',
  '!',
  '!!',
  'or',
  'and',
  '>',
  '>=',
  '<',
  '<=',
  'max',
  'min',
  '+',
  '-',
  '*',
  '/',
  '%',
  'map',
  'filter',
  'reduce',
  'all',
  'none',
  'some',
  'merge',
  'in',
  'cat',
  'substr'
]);

@Injectable()
export class FlowExpressionEngine {
  constructor(private readonly confisys: ConfisysService) {}

  evaluate(rule: unknown, data: Record<string, unknown>) {
    this.assertRule(rule);
    try {
      return jsonLogic.apply(rule as FlowRule, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid rule';
      throw new BadRequestException(`Flow rule could not be evaluated: ${message}`);
    }
  }

  evaluateBoolean(rule: unknown, data: Record<string, unknown>) {
    return jsonLogic.truthy(this.evaluate(rule, data));
  }

  validateRule(rule: unknown) {
    this.assertRule(rule);
  }

  validateValidationConfig(config: FlowValidationConfig) {
    this.cleanPath(config.field);
    const operator = config.operator?.trim() || 'required';
    if (
      ![
        'required',
        'not_empty',
        'equals',
        'not_equals',
        'greater_than',
        'min',
        'less_than',
        'max',
        'contains',
        'email'
      ].includes(operator)
    ) {
      throw new BadRequestException(`Unsupported validation operator: ${operator}`);
    }
  }

  validate(config: FlowValidationConfig, data: Record<string, unknown>) {
    const field = this.cleanPath(config.field);
    const actual = this.resolvePath(data, field);
    const operator = config.operator?.trim() || 'required';
    const expected = config.value;

    let valid: boolean;
    if (config.rule !== undefined) {
      valid = this.evaluateBoolean(config.rule, data);
    } else {
      valid = this.applyValidationOperator(operator, actual, expected);
    }

    return {
      valid,
      field,
      operator,
      value: actual ?? null,
      expected: expected ?? null,
      message: valid ? null : config.message?.trim() || this.defaultValidationMessage(field, operator)
    };
  }

  private applyValidationOperator(operator: string, actual: unknown, expected: unknown) {
    switch (operator) {
      case 'required':
      case 'not_empty':
        return actual !== undefined && actual !== null && String(actual).trim().length > 0;
      case 'equals':
        return actual === this.coerceExpected(expected, actual);
      case 'not_equals':
        return actual !== this.coerceExpected(expected, actual);
      case 'greater_than':
      case 'min':
        return this.asFiniteNumber(actual) >= this.asFiniteNumber(expected);
      case 'less_than':
      case 'max':
        return this.asFiniteNumber(actual) <= this.asFiniteNumber(expected);
      case 'contains':
        return String(actual ?? '').includes(String(expected ?? ''));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(actual ?? ''));
      default:
        throw new BadRequestException(`Unsupported validation operator: ${operator}`);
    }
  }

  private assertRule(rule: unknown) {
    const serialized = JSON.stringify(rule);
    const maxLength = this.confisys.get<number>('flow.expression.maxLength', 2000);
    const maxDepth = this.confisys.get<number>('flow.expression.maxDepth', 10);
    if (serialized.length > maxLength) {
      throw new BadRequestException(`Flow rule exceeds the maximum length of ${maxLength}`);
    }
    if (this.ruleDepth(rule) > maxDepth) {
      throw new BadRequestException(`Flow rule exceeds the maximum depth of ${maxDepth}`);
    }
    if (
      rule === undefined ||
      rule === null ||
      (typeof rule === 'object' && !Array.isArray(rule) && Object.keys(rule as Record<string, unknown>).length !== 1)
    ) {
      throw new BadRequestException('A JSON Logic rule with exactly one operation is required');
    }
    this.assertAllowedOperators(rule);
  }

  private assertAllowedOperators(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach((item) => this.assertAllowedOperators(item));
      return;
    }
    if (!value || typeof value !== 'object') {
      return;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length !== 1 || !ALLOWED_JSON_LOGIC_OPERATORS.has(entries[0][0])) {
      throw new BadRequestException(`Unsupported JSON Logic operation: ${entries[0]?.[0] ?? 'empty'}`);
    }
    this.assertAllowedOperators(entries[0][1]);
  }

  private ruleDepth(value: unknown, depth = 0): number {
    if (!value || typeof value !== 'object') {
      return depth;
    }
    const children = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
    return children.reduce((max, child) => Math.max(max, this.ruleDepth(child, depth + 1)), depth);
  }

  private cleanPath(value?: string) {
    const path = (value ?? '').trim();
    if (!/^(input|tenant|user|steps)(\.[a-zA-Z0-9_-]+)+$/.test(path)) {
      throw new BadRequestException('Validation field must start with input, tenant, user or steps');
    }
    return path;
  }

  private resolvePath(data: Record<string, unknown>, path: string) {
    return path.split('.').reduce<unknown>((value, part) => {
      if (!value || typeof value !== 'object') {
        return undefined;
      }
      return (value as Record<string, unknown>)[part];
    }, data);
  }

  private asFiniteNumber(value: unknown) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new BadRequestException('Numeric validation received a non-numeric value');
    }
    return number;
  }

  private coerceExpected(expected: unknown, actual: unknown) {
    if (typeof actual === 'number') {
      return Number(expected);
    }
    if (typeof actual === 'boolean') {
      return expected === true || expected === 'true';
    }
    return expected;
  }

  private defaultValidationMessage(field: string, operator: string) {
    const labels: Record<string, string> = {
      required: 'es obligatorio',
      not_empty: 'no puede estar vacío',
      equals: 'no tiene el valor esperado',
      not_equals: 'tiene un valor no permitido',
      greater_than: 'está por debajo del mínimo',
      min: 'está por debajo del mínimo',
      less_than: 'supera el máximo',
      max: 'supera el máximo',
      contains: 'no contiene el valor esperado',
      email: 'no es un correo válido'
    };
    return `${field} ${labels[operator] ?? 'no es válido'}`;
  }
}

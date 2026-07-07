import { Injectable } from '@angular/core';
import { UiPresentationConfig } from '../../core/ui/ui-presentation.types';

export type RuntimeFieldTransform = 'uppercase' | 'lowercase' | 'trim';
export type RuntimeFieldConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'truthy'
  | 'falsy'
  | 'contains'
  | 'in'
  | 'not_in'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal';

export interface RuntimeFieldCondition {
  field: string;
  operator: RuntimeFieldConditionOperator;
  value?: unknown;
}

export interface RuntimeFieldLength {
  min?: number;
  max?: number;
  exact?: number;
}

export interface RuntimeField {
  key?: string;
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: unknown }>;
  config?: Record<string, unknown>;
  presentation?: UiPresentationConfig;
  text?: string;
  transform?: RuntimeFieldTransform;
  length?: RuntimeFieldLength;
  visibleWhen?: RuntimeFieldCondition;
  dataSource?: Record<string, unknown>;
  validation?: Record<string, unknown>;
  readonly?: boolean;
  layout?:
    | 'full'
    | 'half'
    | 'third'
    | {
        desktopSpan?: number;
        tabletSpan?: number;
        mobileSpan?: number;
      };
}

export interface RuntimeFormStep {
  key: string;
  title: string;
  description?: string;
  fields: RuntimeField[];
}

export interface RuntimeForm {
  key: string;
  title: string;
  version: number;
  fields: RuntimeField[];
  actions?: Array<Record<string, unknown>>;
  commands?: Array<Record<string, unknown>>;
  dataSources?: Array<Record<string, unknown>>;
  persistence?: Record<string, unknown>;
  runtime?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  presentation?: UiPresentationConfig;
  steps?: RuntimeFormStep[];
}

export interface StoredRuntimeForm {
  key: string;
  title: string;
  version: number;
  schema: Record<string, unknown>;
  published: boolean;
}

@Injectable({ providedIn: 'root' })
export class FormRuntimeService {
  normalize(form: RuntimeForm): RuntimeForm {
    return {
      ...form,
      fields: (form.fields ?? []).map((field) => ({
        ...field,
        name: this.fieldKey(field),
        key: field.key ?? field.name,
        label: field.label || this.fieldKey(field),
        type: field.type || 'text'
      })),
      steps: form.steps?.map((step) => ({
        ...step,
        fields: (step.fields ?? []).map((field) => ({
          ...field,
          name: this.fieldKey(field),
          key: field.key ?? field.name,
          label: field.label || this.fieldKey(field),
          type: field.type || 'text'
        }))
      }))
    };
  }

  fromStored(form: StoredRuntimeForm): RuntimeForm {
    const fields = Array.isArray(form.schema['fields'])
      ? (form.schema['fields'] as RuntimeField[])
      : [];
    const actions = Array.isArray(form.schema['actions'])
      ? (form.schema['actions'] as Array<Record<string, unknown>>)
      : [];
    const commands = Array.isArray(form.schema['commands'])
      ? (form.schema['commands'] as Array<Record<string, unknown>>)
      : [];
    const dataSources = Array.isArray(form.schema['dataSources'])
      ? (form.schema['dataSources'] as Array<Record<string, unknown>>)
      : [];
    const presentation =
      form.schema['presentation'] &&
      typeof form.schema['presentation'] === 'object' &&
      !Array.isArray(form.schema['presentation'])
        ? (form.schema['presentation'] as UiPresentationConfig)
        : undefined;
    const steps = Array.isArray(form.schema['steps'])
      ? (form.schema['steps'] as RuntimeFormStep[])
      : undefined;

    return this.normalize({
      key: form.key,
      title: form.title,
      version: form.version,
      fields,
      actions,
      commands,
      dataSources,
      persistence: this.asObject(form.schema['persistence']),
      runtime: this.asObject(form.schema['runtime']),
      layout: this.asObject(form.schema['layout']),
      presentation,
      steps
    });
  }

  initialValues(form: RuntimeForm) {
    return Object.fromEntries(
      this.allFields(form).map((field) => [
        this.fieldKey(field),
        field.config?.['defaultValue'] ?? (this.isBoolean(field.type) ? false : '')
      ])
    );
  }

  validate(form: RuntimeForm, values: Record<string, unknown>) {
    return Object.fromEntries(
      this.allFields(form)
        .map((field) => {
          const key = this.fieldKey(field);
          const value = values[key];
          const missing = value === null || value === undefined || value === '';
          return [key, field.required && missing ? `${field.label} es obligatorio.` : ''] as const;
        })
        .filter(([, error]) => Boolean(error))
    );
  }

  private isBoolean(type: string) {
    return ['boolean', 'checkbox', 'toggle'].includes(type.toLowerCase());
  }

  allFields(form: RuntimeForm) {
    return form.steps?.length ? form.steps.flatMap((step) => step.fields) : form.fields;
  }

  fieldKey(field: Pick<RuntimeField, 'key' | 'name'>) {
    return field.key || field.name;
  }

  private asObject(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  }
}

import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { UiPresentationConfig } from '../../../core/ui/ui-presentation.types';
import {
  RuntimeField,
  RuntimeFieldCondition,
  RuntimeForm
} from '../form-runtime.service';

export interface FormlySchemaContext {
  presentation?: UiPresentationConfig;
  viewportWidth?: number;
  readonly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FormlySchemaAdapterService {
  toFields(fields: RuntimeField[], context: FormlySchemaContext = {}): FormlyFieldConfig[] {
    return fields.map((field) => this.toField(field, context));
  }

  toForm(form: RuntimeForm, context: FormlySchemaContext = {}) {
    const fields = form.steps?.length ? form.steps.flatMap((step) => step.fields) : form.fields;
    return this.toFields(fields, {
      ...context,
      presentation: context.presentation ?? form.presentation
    });
  }

  private toField(field: RuntimeField, context: FormlySchemaContext): FormlyFieldConfig {
    if (this.isDisplay(field.type)) {
      return {
        type: 'chicle-display',
        className: 'ch-formly-field ch-formly-field--full',
        props: { runtimeField: field }
      };
    }

    const exactLength = field.length?.exact;
    const config: FormlyFieldConfig = {
      key: field.name,
      type: 'chicle-field',
      className: `ch-formly-field ch-formly-field--${field.layout || 'half'}`,
      defaultValue: field.config?.['defaultValue'],
      props: {
        label: field.label,
        required: field.required === true,
        minLength: exactLength ?? field.length?.min,
        maxLength: exactLength ?? field.length?.max,
        disabled: context.readonly === true,
        readonly: context.readonly === true,
        help: typeof field.config?.['help'] === 'string' ? field.config['help'] : '',
        runtimeField: field,
        presentation: context.presentation,
        viewportWidth: context.viewportWidth
      },
      validation: {
        messages: {
          required: `${field.label} es obligatorio.`,
          minlength: `${field.label} no alcanza la longitud mínima.`,
          maxlength: `${field.label} supera la longitud máxima.`,
          exactLength: `${field.label} debe tener exactamente ${exactLength} caracteres.`
        }
      }
    };

    const transform = field.transform;
    if (transform) {
      config.parsers = [(value) => this.transform(value, transform)];
    }

    if (exactLength !== undefined) {
      config.validators = {
        exactLength: {
          expression: (control: AbstractControl) => {
            const value = control.value;
            return value === null || value === undefined || value === ''
              ? true
              : String(value).length === exactLength;
          }
        }
      };
    }

    if (field.visibleWhen) {
      config.expressions = {
        hide: (formlyField) => !this.matches(formlyField.model as Record<string, unknown>, field.visibleWhen!)
      };
      config.resetOnHide = false;
    }

    return config;
  }

  private transform(value: unknown, transform: NonNullable<RuntimeField['transform']>) {
    if (typeof value !== 'string') {
      return value;
    }
    if (transform === 'uppercase') {
      return value.toUpperCase();
    }
    if (transform === 'lowercase') {
      return value.toLowerCase();
    }
    return value.trim();
  }

  private matches(model: Record<string, unknown>, condition: RuntimeFieldCondition) {
    const actual = model?.[condition.field];
    switch (condition.operator) {
      case 'equals':
        return actual === condition.value;
      case 'not_equals':
        return actual !== condition.value;
      case 'truthy':
        return Boolean(actual);
      case 'falsy':
        return !actual;
      case 'contains':
        return Array.isArray(actual)
          ? actual.includes(condition.value)
          : String(actual ?? '').includes(String(condition.value ?? ''));
    }
  }

  private isDisplay(type: string) {
    return ['title', 'paragraph', 'divider'].includes(type.toLowerCase());
  }
}

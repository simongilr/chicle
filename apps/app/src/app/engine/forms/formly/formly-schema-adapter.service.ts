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
      key: this.fieldKey(field),
      type: 'chicle-field',
      className: `ch-formly-field ch-formly-field--${this.layoutClass(field, context.viewportWidth)}`,
      defaultValue: field.config?.['defaultValue'],
      props: {
        label: field.label,
        required: field.required === true,
        minLength: exactLength ?? field.length?.min,
        maxLength: exactLength ?? field.length?.max,
        disabled: context.readonly === true || field.readonly === true,
        readonly: context.readonly === true || field.readonly === true,
        help: typeof field.config?.['help'] === 'string' ? field.config['help'] : '',
        runtimeField: { ...field, name: this.fieldKey(field), key: field.key ?? field.name },
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
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(actual);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(actual);
      case 'greater_than':
        return Number(actual) > Number(condition.value);
      case 'greater_or_equal':
        return Number(actual) >= Number(condition.value);
      case 'less_than':
        return Number(actual) < Number(condition.value);
      case 'less_or_equal':
        return Number(actual) <= Number(condition.value);
    }
  }

  private isDisplay(type: string) {
    return ['title', 'paragraph', 'divider'].includes(type.toLowerCase());
  }

  private fieldKey(field: RuntimeField) {
    return field.key || field.name;
  }

  private layoutClass(field: RuntimeField, viewportWidth = 1280) {
    if (typeof field.layout === 'string') {
      return field.layout;
    }
    const responsive = this.responsiveLayout(field, viewportWidth);
    if (responsive) {
      return responsive;
    }
    if (field.layout?.desktopSpan === 12) {
      return 'full';
    }
    if (field.layout?.desktopSpan && field.layout.desktopSpan <= 4) {
      return 'third';
    }
    return 'half';
  }

  private responsiveLayout(field: RuntimeField, viewportWidth: number) {
    const layout = field.layout;
    if (!layout || typeof layout !== 'object') {
      return '';
    }
    const device = viewportWidth <= 767 ? 'mobile' : viewportWidth <= 1024 ? 'tablet' : 'desktop';
    const value = layout[device];
    return value === 'full' || value === 'half' || value === 'third' ? value : '';
  }
}

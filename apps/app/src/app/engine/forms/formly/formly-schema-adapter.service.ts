import { Injectable, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { I18nService } from '../../../core/i18n/i18n.service';
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
  private readonly i18n = inject(I18nService);

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
    const runtimeField = this.resolveFieldText(field);

    if (this.isDisplay(runtimeField.type)) {
      return {
        type: 'chicle-display',
        className: 'ch-formly-field ch-formly-field--full',
        props: { runtimeField }
      };
    }

    const exactLength = runtimeField.length?.exact;
    const config: FormlyFieldConfig = {
      key: this.fieldKey(runtimeField),
      type: 'chicle-field',
      className: `ch-formly-field ch-formly-field--${this.layoutClass(runtimeField, context.viewportWidth)}`,
      defaultValue: runtimeField.config?.['defaultValue'],
      props: {
        label: runtimeField.label,
        required: runtimeField.required === true,
        minLength: exactLength ?? runtimeField.length?.min,
        maxLength: exactLength ?? runtimeField.length?.max,
        disabled: context.readonly === true || runtimeField.readonly === true,
        readonly: context.readonly === true || runtimeField.readonly === true,
        help: typeof runtimeField.config?.['help'] === 'string' ? runtimeField.config['help'] : '',
        runtimeField: {
          ...runtimeField,
          name: this.fieldKey(runtimeField),
          key: runtimeField.key ?? runtimeField.name
        },
        presentation: context.presentation,
        viewportWidth: context.viewportWidth
      },
      validation: {
        messages: {
          required: this.i18n.translate('forms.runtime.validation.required', { field: runtimeField.label }),
          minlength: this.i18n.translate('forms.runtime.validation.minlength', { field: runtimeField.label }),
          maxlength: this.i18n.translate('forms.runtime.validation.maxlength', { field: runtimeField.label }),
          exactLength: this.i18n.translate('forms.runtime.validation.exactLength', {
            field: runtimeField.label,
            length: exactLength ?? ''
          })
        }
      }
    };

    const transform = runtimeField.transform;
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

    if (runtimeField.visibleWhen) {
      config.expressions = {
        hide: (formlyField) => !this.matches(formlyField.model as Record<string, unknown>, runtimeField.visibleWhen!)
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

  private resolveFieldText(field: RuntimeField): RuntimeField {
    const config = field.config ?? {};
    const help = this.localized(this.stringValue(field.helpKey ?? config['helpKey']), this.stringValue(field.help ?? config['help']));
    return {
      ...field,
      label: this.localized(field.labelKey, field.label || field.name),
      placeholder: this.localized(field.placeholderKey, field.placeholder ?? ''),
      text: this.localized(field.textKey, field.text ?? ''),
      help,
      options: field.options?.map((option) => ({
        ...option,
        label: this.localized(option.labelKey, option.label)
      })),
      config: {
        ...config,
        help
      }
    };
  }

  private localized(key: unknown, fallback: string) {
    const normalizedKey = this.stringValue(key).trim();
    return normalizedKey ? this.i18n.label(normalizedKey, fallback) : fallback;
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' ? value : '';
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

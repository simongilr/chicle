import { Component } from '@angular/core';
import {
  FieldType,
  FieldTypeConfig,
  FormlyFieldProps
} from '@ngx-formly/core';
import { UiPresentationConfig } from '../../../core/ui/ui-presentation.types';
import { DynamicFieldControlComponent } from '../../../shared/dynamic-field-control/dynamic-field-control.component';
import { RuntimeField } from '../form-runtime.service';

export interface ChicleFormlyFieldProps extends FormlyFieldProps {
  runtimeField: RuntimeField;
  presentation?: UiPresentationConfig;
  viewportWidth?: number;
  help?: string;
  readonly?: boolean;
}

@Component({
  selector: 'app-chicle-formly-field-type',
  standalone: true,
  imports: [DynamicFieldControlComponent],
  template: `
    <app-dynamic-field-control
      [field]="props.runtimeField"
      [value]="formControl.value"
      [help]="props.help || ''"
      [error]="errorMessage"
      [disabled]="props.disabled === true || formControl.disabled"
      [readonly]="props.readonly === true"
      [presentation]="props.presentation"
      [viewportWidth]="props.viewportWidth"
      (valueChange)="updateValue($event)"
    ></app-dynamic-field-control>
  `
})
export class ChicleFormlyFieldTypeComponent extends FieldType<
  FieldTypeConfig<ChicleFormlyFieldProps>
> {
  updateValue(value: unknown) {
    this.formControl.setValue(value);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  get errorMessage() {
    if (!this.formControl.touched || !this.formControl.errors) {
      return '';
    }

    const errorKey = Object.keys(this.formControl.errors)[0];
    const configured = this.field.validation?.messages?.[errorKey];
    if (typeof configured === 'function') {
      const resolved = configured(this.formControl.errors[errorKey], this.field);
      if (typeof resolved === 'string') {
        return resolved;
      }
    }
    if (typeof configured === 'string') {
      return configured;
    }

    return errorKey === 'required'
      ? `${this.props.runtimeField.label} es obligatorio.`
      : `${this.props.runtimeField.label} contiene un valor inválido.`;
  }
}

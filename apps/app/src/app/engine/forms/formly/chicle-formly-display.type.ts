import { Component } from '@angular/core';
import {
  FieldType,
  FieldTypeConfig,
  FormlyFieldProps
} from '@ngx-formly/core';
import { RuntimeField } from '../form-runtime.service';

export interface ChicleFormlyDisplayProps extends FormlyFieldProps {
  runtimeField: RuntimeField;
}

@Component({
  selector: 'app-chicle-formly-display-type',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.15rem;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.55;
      }

      hr {
        margin: 4px 0;
        border: 0;
        border-top: 1px solid var(--ch-color-border);
      }
    `
  ],
  template: `
    @switch (props.runtimeField.type) {
      @case ('title') {
        <h2>{{ props.runtimeField.label }}</h2>
      }
      @case ('paragraph') {
        <p>{{ props.runtimeField.text || props.runtimeField.label }}</p>
      }
      @default {
        <hr />
      }
    }
  `
})
export class ChicleFormlyDisplayTypeComponent extends FieldType<
  FieldTypeConfig<ChicleFormlyDisplayProps>
> {}


import { Injectable } from '@angular/core';

export interface RuntimeField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  config?: Record<string, unknown>;
}

export interface RuntimeForm {
  key: string;
  title: string;
  version: number;
  fields: RuntimeField[];
  actions?: Array<Record<string, unknown>>;
}

@Injectable({ providedIn: 'root' })
export class FormRuntimeService {
  normalize(form: RuntimeForm): RuntimeForm {
    return {
      ...form,
      fields: form.fields ?? []
    };
  }
}

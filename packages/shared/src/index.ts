export type ChicleActionType =
  | 'create_record'
  | 'http_request'
  | 'upload_files'
  | 'show_modal'
  | 'navigate'
  | 'queue_offline'
  | 'capability'
  | 'get_gps';

export interface ChicleAction {
  type: ChicleActionType;
  key?: string;
  offline?: boolean;
  payloadMap?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DynamicFormDefinition {
  key: string;
  title: string;
  version: number;
  fields: DynamicFieldDefinition[];
  actions?: ChicleAction[];
}

export interface DynamicFieldDefinition {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: unknown }>;
  config?: Record<string, unknown>;
}

import { UiKitPreference, UiPresentationConfig, UiRuntimePlatform } from '../../core/ui/ui-presentation.types';
import { RuntimeField } from '../forms/form-runtime.service';

export type DeclarativeComponentActionType =
  | 'navigate'
  | 'execute_service'
  | 'execute_flow'
  | 'submit_form'
  | 'open_modal'
  | 'show_message'
  | 'set_state'
  | 'refresh_data'
  | 'queue_offline';

export interface DeclarativeComponentAction {
  type: DeclarativeComponentActionType;
  [key: string]: unknown;
}

export interface DeclarativeComponentContract {
  schemaVersion?: number;
  kind?: 'dynamic_component';
  id?: string;
  componentKey: string;
  props?: Record<string, unknown>;
  bindings?: Record<string, unknown>;
  actions?: Record<string, DeclarativeComponentAction | DeclarativeComponentAction[]> | DeclarativeComponentAction[];
  permissions?: string[];
  layout?: Record<string, unknown>;
  children?: DeclarativeComponentContract[];
  metadata?: Record<string, unknown>;
}

export interface DeclarativeComponentContext {
  state?: Record<string, unknown>;
  data?: Record<string, unknown>;
  permissions?: string[];
  presentation?: UiPresentationConfig;
  kit?: UiKitPreference;
  viewportWidth?: number;
  platform?: UiRuntimePlatform;
}

export interface DeclarativeComponentActionEvent {
  source: DeclarativeComponentContract;
  eventName: string;
  action: DeclarativeComponentAction;
  value?: unknown;
}

export type DeclarativeFieldProps = {
  field?: RuntimeField;
  value?: unknown;
  help?: string;
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
};

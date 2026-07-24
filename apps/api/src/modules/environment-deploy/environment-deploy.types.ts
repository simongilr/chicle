import {
  EnvironmentKind,
  EnvironmentProfile
} from './environment-profile.entity';
import {
  EnvironmentValueType,
  EnvironmentVariableTarget
} from './environment-variable.entity';
import {
  EnvironmentSecretScopeType,
  EnvironmentSecretStatus
} from './environment-secret.entity';
import {
  ServiceRegistryAuthMode,
  ServiceRegistryType
} from './service-registry-entry.entity';

export interface CreateEnvironmentProfileRequest {
  key?: string;
  name?: string;
  kind?: EnvironmentKind;
  active?: boolean;
  isDefault?: boolean;
  requiresReauth?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateEnvironmentProfileRequest {
  name?: string;
  kind?: EnvironmentKind;
  active?: boolean;
  isDefault?: boolean;
  requiresReauth?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface UpsertEnvironmentVariableRequest {
  groupKey?: string;
  key?: string;
  value?: unknown;
  valueType?: EnvironmentValueType;
  target?: EnvironmentVariableTarget;
  editable?: boolean;
  requiresRestart?: boolean;
  description?: string | null;
}

export interface UpsertEnvironmentSecretRequest {
  scopeType?: EnvironmentSecretScopeType;
  scopeKey?: string;
  key?: string;
  value?: string;
  status?: EnvironmentSecretStatus;
  description?: string | null;
  reauthPassword?: string;
}

export interface UpsertServiceRegistryRequest {
  key?: string;
  name?: string;
  type?: ServiceRegistryType;
  baseUrl?: string;
  healthPath?: string;
  authMode?: ServiceRegistryAuthMode;
  secretRef?: string | null;
  timeoutMs?: number;
  retryPolicy?: Record<string, unknown> | null;
  tlsRequired?: boolean;
  allowedOperations?: string[] | null;
  active?: boolean;
  description?: string | null;
}

export interface EnvironmentValidationItem {
  severity: 'ok' | 'warning' | 'danger';
  key: string;
  title: string;
  detail: string;
}

export interface EnvironmentValidationResult {
  environment: Pick<EnvironmentProfile, 'key' | 'name' | 'kind'>;
  readiness: number;
  status: 'ready' | 'warning' | 'blocked';
  items: EnvironmentValidationItem[];
}

export interface DeploymentBundleFile {
  path: string;
  kind: 'compose' | 'env_template' | 'runtime_config' | 'checklist';
  content: string;
}

export interface DeploymentBundle {
  environment: Pick<EnvironmentProfile, 'key' | 'name' | 'kind'>;
  generatedAt: string;
  files: DeploymentBundleFile[];
}

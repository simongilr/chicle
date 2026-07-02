export type ChicleActionType =
  | 'create_record'
  | 'http_request'
  | 'upload_files'
  | 'show_modal'
  | 'navigate'
  | 'queue_offline'
  | 'capability'
  | 'get_gps'
  | 'execute_flow';

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

export type SetupState = 'not_created' | 'ready' | 'unavailable';

export interface SetupStatus {
  state: Exclude<SetupState, 'unavailable'>;
  initialized: boolean;
  canRunSetup: boolean;
  tenantCount: number;
  requiredAction: 'run_setup' | 'login';
  seedProfile: 'blank';
}

export type SecurityChannel = 'web' | 'mobile' | 'device';

export type AuthMethodType =
  | 'password'
  | 'oauth2'
  | 'oidc'
  | 'saml'
  | 'magic_link'
  | 'device_code'
  | 'passkey';

export type SecurityLevel = 'basic' | 'standard' | 'high';

export interface AuthMethodConfig {
  type: AuthMethodType;
  enabled: boolean;
  label: string;
  channels: SecurityChannel[];
  providerKey?: string;
  primary?: boolean;
}

export interface SecurityPolicy {
  level: SecurityLevel;
  requireMfa: boolean;
  password: {
    enabled: boolean;
    minLength: number;
    hash: 'argon2id' | 'bcrypt';
  };
  session: {
    webMode: 'refresh_cookie' | 'cookie_session' | 'bearer';
    accessTokenTtlMinutes: number;
    refreshTokenTtlDays: number;
  };
  methods: AuthMethodConfig[];
}

export interface PublicAuthConfig {
  tenantSlug?: string;
  setupRequired: boolean;
  security: SecurityPolicy;
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  level: 'standard',
  requireMfa: false,
  password: {
    enabled: true,
    minLength: 12,
    hash: 'bcrypt'
  },
  session: {
    webMode: 'refresh_cookie',
    accessTokenTtlMinutes: 15,
    refreshTokenTtlDays: 14
  },
  methods: [
    {
      type: 'password',
      enabled: true,
      label: 'Email y password',
      channels: ['web', 'mobile'],
      primary: true
    },
    {
      type: 'passkey',
      enabled: false,
      label: 'Passkey',
      channels: ['web', 'mobile']
    },
    {
      type: 'oidc',
      enabled: false,
      label: 'OIDC / OAuth2',
      channels: ['web', 'mobile']
    },
    {
      type: 'device_code',
      enabled: false,
      label: 'Código de dispositivo',
      channels: ['device', 'mobile']
    }
  ]
};

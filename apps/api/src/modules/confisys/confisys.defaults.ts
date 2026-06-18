import type { SecurityPolicy } from '../auth/auth.service';
import { ConfisysValueType } from './confisys.entity';

export interface ConfisysDefault {
  key: string;
  value: string | number | boolean | Record<string, unknown> | unknown[];
  valueType: ConfisysValueType;
  category: string;
  description: string;
  isPublic?: boolean;
  editable?: boolean;
}

export const CONFISYS_DEFAULTS: ConfisysDefault[] = [
  {
    key: 'setup.seedProfile',
    value: 'blank',
    valueType: 'string',
    category: 'setup',
    description: 'Perfil de semilla inicial usado cuando se crea el primer tenant.',
    isPublic: true
  },
  {
    key: 'api.cors.origin',
    value: true,
    valueType: 'boolean',
    category: 'api',
    description: 'Origen CORS permitido por defecto. En producción debe restringirse por despliegue.'
  },
  {
    key: 'files.storage.driver',
    value: 'local',
    valueType: 'string',
    category: 'files',
    description: 'Driver de almacenamiento de evidencias. Preparado para local, MinIO o S3.'
  },
  {
    key: 'files.storage.localPath',
    value: '/app/storage/files',
    valueType: 'string',
    category: 'files',
    description: 'Ruta base para evidencias cuando el driver de storage es local.'
  },
  {
    key: 'security.level',
    value: 'standard',
    valueType: 'string',
    category: 'security',
    description: 'Nivel base de seguridad del sistema: basic, standard o high.',
    isPublic: true
  },
  {
    key: 'security.mfa.required',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Indica si MFA debe ser obligatorio por defecto.',
    isPublic: true
  },
  {
    key: 'security.password.enabled',
    value: true,
    valueType: 'boolean',
    category: 'security',
    description: 'Activa el login por email y password en la política base.',
    isPublic: true
  },
  {
    key: 'security.password.minLength',
    value: 12,
    valueType: 'number',
    category: 'security',
    description: 'Longitud mínima de password para usuarios nuevos.',
    isPublic: true
  },
  {
    key: 'security.password.hash',
    value: 'bcrypt',
    valueType: 'string',
    category: 'security',
    description: 'Algoritmo de hash preparado para passwords: bcrypt o argon2id.',
    isPublic: true
  },
  {
    key: 'security.session.webMode',
    value: 'refresh_cookie',
    valueType: 'string',
    category: 'security',
    description: 'Modo de sesión web por defecto.',
    isPublic: true
  },
  {
    key: 'security.session.accessTokenTtlMinutes',
    value: 15,
    valueType: 'number',
    category: 'security',
    description: 'Minutos de vida para access tokens.',
    isPublic: true
  },
  {
    key: 'security.session.refreshTokenTtlDays',
    value: 14,
    valueType: 'number',
    category: 'security',
    description: 'Días de vida para refresh tokens.',
    isPublic: true
  },
  {
    key: 'security.methods.password.enabled',
    value: true,
    valueType: 'boolean',
    category: 'security',
    description: 'Muestra y permite password como método de login.',
    isPublic: true
  },
  {
    key: 'security.methods.passkey.enabled',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Prepara activación futura de passkeys.',
    isPublic: true
  },
  {
    key: 'security.methods.oidc.enabled',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Prepara activación futura de OIDC/OAuth2.',
    isPublic: true
  },
  {
    key: 'security.methods.deviceCode.enabled',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Prepara activación futura de códigos de dispositivo.',
    isPublic: true
  },
  {
    key: 'features.offlineSync.enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Bandera base para sincronización offline.'
  }
];

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

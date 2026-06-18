import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>
  ) {}

  async publicConfig() {
    const tenant = await this.tenants.findOne({
      where: { active: true },
      order: { name: 'ASC' }
    });
    const configuredSecurity = this.readSecurityPolicy(tenant?.settings);

    return {
      tenantSlug: tenant?.slug,
      setupRequired: !tenant,
      security: configuredSecurity
    };
  }

  private readSecurityPolicy(settings?: Record<string, unknown> | null): SecurityPolicy {
    const security = settings?.security;
    if (!security || typeof security !== 'object') {
      return DEFAULT_SECURITY_POLICY;
    }

    return {
      ...DEFAULT_SECURITY_POLICY,
      ...(security as Partial<SecurityPolicy>),
      password: {
        ...DEFAULT_SECURITY_POLICY.password,
        ...((security as Partial<SecurityPolicy>).password ?? {})
      },
      session: {
        ...DEFAULT_SECURITY_POLICY.session,
        ...((security as Partial<SecurityPolicy>).session ?? {})
      },
      methods: Array.isArray((security as Partial<SecurityPolicy>).methods)
        ? ((security as SecurityPolicy).methods)
        : DEFAULT_SECURITY_POLICY.methods
    };
  }
}

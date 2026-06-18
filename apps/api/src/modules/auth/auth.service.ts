import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfisysService } from '../confisys/confisys.service';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    private readonly confisys: ConfisysService
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
    const defaultSecurity = this.confisys.getSecurityPolicy();
    if (!security || typeof security !== 'object') {
      return defaultSecurity;
    }

    return {
      ...defaultSecurity,
      ...(security as Partial<SecurityPolicy>),
      password: {
        ...defaultSecurity.password,
        ...((security as Partial<SecurityPolicy>).password ?? {})
      },
      session: {
        ...defaultSecurity.session,
        ...((security as Partial<SecurityPolicy>).session ?? {})
      },
      methods: Array.isArray((security as Partial<SecurityPolicy>).methods)
        ? ((security as SecurityPolicy).methods)
        : defaultSecurity.methods
    };
  }
}

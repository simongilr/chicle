import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { Repository } from 'typeorm';
import { ConfisysService } from '../confisys/confisys.service';
import { RbacService } from '../rbac/rbac.service';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { AuthSession } from './auth-session.entity';
import { AuthContext, AuthTokenPayload } from './auth.types';

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

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(AuthSession)
    private readonly sessions: Repository<AuthSession>,
    private readonly confisys: ConfisysService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly rbac: RbacService
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

  async login(request: LoginRequest) {
    const tenant = await this.resolveLoginTenant(request.tenantSlug);
    const user = await this.users.findOne({
      where: {
        tenantId: tenant.id,
        email: request.email.toLowerCase().trim(),
        active: true
      }
    });

    if (!user || !(await compare(request.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access = await this.rbac.getEffectiveAccess(tenant.id, user.id);
    const ttlMinutes = this.readSecurityPolicy(tenant.settings).session.accessTokenTtlMinutes;
    const tokenId = randomUUID();
    const session = await this.sessions.save(
      this.sessions.create({
        tenantId: tenant.id,
        userId: user.id,
        tokenId,
        expiresAt: this.minutesFromNow(ttlMinutes)
      })
    );
    const payload: AuthTokenPayload = {
      sub: user.id,
      tenantId: tenant.id,
      sid: session.id,
      jti: tokenId
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.jwtSecret(),
      expiresIn: `${ttlMinutes}m`
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ttlMinutes * 60,
      user: this.publicUser(user),
      tenant: this.publicTenant(tenant),
      roles: access.roles,
      permissions: access.permissions
    };
  }

  async verifyAccessToken(token: string): Promise<AuthContext> {
    let payload: AuthTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AuthTokenPayload>(token, {
        secret: this.jwtSecret()
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const session = await this.sessions.findOne({
      where: {
        id: payload.sid,
        userId: payload.sub,
        tenantId: payload.tenantId,
        tokenId: payload.jti,
        active: true
      }
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid session');
    }

    const [user, tenant] = await Promise.all([
      this.users.findOne({ where: { id: payload.sub, tenantId: payload.tenantId, active: true } }),
      this.tenants.findOne({ where: { id: payload.tenantId, active: true } })
    ]);

    if (!user || !tenant) {
      throw new UnauthorizedException('Invalid session');
    }

    const access = await this.rbac.getEffectiveAccess(tenant.id, user.id);
    return {
      user,
      tenant,
      sessionId: session.id,
      tokenId: session.tokenId,
      roles: access.roles,
      permissions: access.permissions
    };
  }

  me(auth: AuthContext) {
    return {
      user: this.publicUser(auth.user),
      tenant: this.publicTenant(auth.tenant),
      roles: auth.roles,
      permissions: auth.permissions
    };
  }

  async logout(auth: AuthContext) {
    await this.sessions.update(
      {
        id: auth.sessionId,
        userId: auth.user.id,
        tenantId: auth.tenant.id,
        tokenId: auth.tokenId
      },
      { active: false }
    );

    return { ok: true };
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

  private async resolveLoginTenant(tenantSlug?: string) {
    const tenant = await this.tenants.findOne({
      where: tenantSlug ? { slug: tenantSlug, active: true } : { active: true },
      order: { name: 'ASC' }
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return tenant;
  }

  private jwtSecret() {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret && this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }

    return secret ?? 'local-dev-only-change-me';
  }

  private minutesFromNow(minutes: number) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      systemRole: user.systemRole
    };
  }

  private publicTenant(tenant: Tenant) {
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name
    };
  }
}

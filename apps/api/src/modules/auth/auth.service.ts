import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { ConfisysService } from '../confisys/confisys.service';
import { RbacService } from '../rbac/rbac.service';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { AuthLoginAttempt } from './auth-login-attempt.entity';
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

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: ReturnType<AuthService['publicUser']>;
  tenant: ReturnType<AuthService['publicTenant']>;
  roles: Array<{ key: string; name: string }>;
  permissions: string[];
}

export interface AuthResult {
  body: AuthResponse;
  refreshToken: string;
  refreshMaxAgeMs: number;
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
    @InjectRepository(AuthLoginAttempt)
    private readonly loginAttempts: Repository<AuthLoginAttempt>,
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

  async login(request: LoginRequest, clientKey: string): Promise<AuthResult> {
    await this.assertLoginAllowed(clientKey);
    const tenant = await this.resolveLoginTenant(request.tenantSlug);
    const user = await this.users.findOne({
      where: {
        tenantId: tenant.id,
        email: request.email.toLowerCase().trim(),
        active: true
      }
    });

    if (!user || !(await compare(request.password, user.passwordHash))) {
      await this.registerFailedLogin(clientKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.loginAttempts.delete({ key: this.loginRateKey(clientKey) });
    const access = await this.rbac.getEffectiveAccess(tenant.id, user.id);
    const security = this.readSecurityPolicy(tenant.settings);
    const ttlMinutes = security.session.accessTokenTtlMinutes;
    const refreshDays = security.session.refreshTokenTtlDays;
    const tokenId = randomUUID();
    const refreshToken = this.generateRefreshToken();
    const session = await this.sessions.save(
      this.sessions.create({
        tenantId: tenant.id,
        userId: user.id,
        tokenId,
        expiresAt: this.minutesFromNow(ttlMinutes),
        refreshTokenHash: await hash(refreshToken, 10),
        refreshExpiresAt: this.daysFromNow(refreshDays)
      })
    );
    const accessToken = await this.signAccessToken(user.id, tenant.id, session.id, tokenId, ttlMinutes);

    return {
      body: this.authResponse(accessToken, ttlMinutes, user, tenant, access),
      refreshToken: this.encodeRefreshCookie(session.id, refreshToken),
      refreshMaxAgeMs: refreshDays * 24 * 60 * 60 * 1000
    };
  }

  async refresh(refreshCookie?: string): Promise<AuthResult> {
    const parsed = this.decodeRefreshCookie(refreshCookie);
    if (!parsed) {
      throw new UnauthorizedException('Invalid session');
    }

    const session = await this.sessions.findOne({
      where: {
        id: parsed.sessionId,
        active: true
      }
    });

    if (
      !session ||
      !session.refreshTokenHash ||
      !session.refreshExpiresAt ||
      session.refreshExpiresAt.getTime() <= Date.now() ||
      !(await compare(parsed.refreshToken, session.refreshTokenHash))
    ) {
      if (session) {
        await this.sessions.update({ id: session.id }, { active: false });
      }
      throw new UnauthorizedException('Invalid session');
    }

    const [user, tenant] = await Promise.all([
      this.users.findOne({ where: { id: session.userId, tenantId: session.tenantId, active: true } }),
      this.tenants.findOne({ where: { id: session.tenantId, active: true } })
    ]);
    if (!user || !tenant) {
      await this.sessions.update({ id: session.id }, { active: false });
      throw new UnauthorizedException('Invalid session');
    }

    const security = this.readSecurityPolicy(tenant.settings);
    const ttlMinutes = security.session.accessTokenTtlMinutes;
    const refreshDays = security.session.refreshTokenTtlDays;
    const tokenId = randomUUID();
    const refreshToken = this.generateRefreshToken();

    await this.sessions.update(
      { id: session.id },
      {
        tokenId,
        expiresAt: this.minutesFromNow(ttlMinutes),
        refreshTokenHash: await hash(refreshToken, 10),
        refreshExpiresAt: this.daysFromNow(refreshDays),
        refreshedAt: new Date()
      }
    );

    const access = await this.rbac.getEffectiveAccess(tenant.id, user.id);
    const accessToken = await this.signAccessToken(user.id, tenant.id, session.id, tokenId, ttlMinutes);
    return {
      body: this.authResponse(accessToken, ttlMinutes, user, tenant, access),
      refreshToken: this.encodeRefreshCookie(session.id, refreshToken),
      refreshMaxAgeMs: refreshDays * 24 * 60 * 60 * 1000
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
      { active: false, refreshTokenHash: null, refreshExpiresAt: null }
    );

    return { ok: true };
  }

  async listSessions(auth: AuthContext) {
    const sessions = await this.sessions.find({
      where: { tenantId: auth.tenant.id, userId: auth.user.id },
      order: { updatedAt: 'DESC' }
    });

    return sessions.map((session) => ({
      id: session.id,
      active: session.active,
      current: session.id === auth.sessionId,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
      refreshedAt: session.refreshedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));
  }

  async revokeSession(auth: AuthContext, sessionId: string) {
    const session = await this.sessions.findOne({
      where: { id: sessionId, tenantId: auth.tenant.id, userId: auth.user.id }
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessions.update(
      { id: session.id },
      { active: false, refreshTokenHash: null, refreshExpiresAt: null }
    );

    return { ok: true, current: session.id === auth.sessionId };
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

    if (this.config.get<string>('NODE_ENV') === 'production' && secret && secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }

    return secret ?? 'local-dev-only-change-me';
  }

  private minutesFromNow(minutes: number) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private daysFromNow(days: number) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async signAccessToken(
    userId: string,
    tenantId: string,
    sessionId: string,
    tokenId: string,
    ttlMinutes: number
  ) {
    const payload: AuthTokenPayload = {
      sub: userId,
      tenantId,
      sid: sessionId,
      jti: tokenId
    };
    return this.jwt.signAsync(payload, {
      secret: this.jwtSecret(),
      expiresIn: `${ttlMinutes}m`
    });
  }

  private authResponse(
    accessToken: string,
    ttlMinutes: number,
    user: User,
    tenant: Tenant,
    access: { roles: Array<{ key: string; name: string }>; permissions: string[] }
  ): AuthResponse {
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

  private generateRefreshToken() {
    return randomBytes(32).toString('base64url');
  }

  private encodeRefreshCookie(sessionId: string, refreshToken: string) {
    return `${sessionId}.${refreshToken}`;
  }

  private decodeRefreshCookie(value?: string) {
    const [sessionId, refreshToken] = value?.split('.') ?? [];
    if (!sessionId || !refreshToken) {
      return null;
    }

    return { sessionId, refreshToken };
  }

  private async assertLoginAllowed(rawKey: string) {
    const attempt = await this.loginAttempts.findOne({ where: { key: this.loginRateKey(rawKey) } });
    if (attempt?.blockedUntil && attempt.blockedUntil.getTime() > Date.now()) {
      throw new HttpException('Too many login attempts', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async registerFailedLogin(rawKey: string) {
    const key = this.loginRateKey(rawKey);
    const now = Date.now();
    const windowMs = this.confisys.get<number>('security.loginRateLimit.windowMinutes', 10) * 60 * 1000;
    const blockMs = this.confisys.get<number>('security.loginRateLimit.blockMinutes', 5) * 60 * 1000;
    const maxAttempts = this.confisys.get<number>('security.loginRateLimit.maxAttempts', 5);
    const current = await this.loginAttempts.findOne({ where: { key } });
    const attempt =
      current && current.firstAttemptAt.getTime() + windowMs > now
        ? current
        : this.loginAttempts.create({ key, count: 0, firstAttemptAt: new Date(now), blockedUntil: null });

    attempt.count += 1;
    if (attempt.count >= maxAttempts) {
      attempt.blockedUntil = new Date(now + blockMs);
    }

    await this.loginAttempts.save(attempt);
  }

  private loginRateKey(rawKey: string) {
    return createHash('sha256').update(rawKey).digest('hex');
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

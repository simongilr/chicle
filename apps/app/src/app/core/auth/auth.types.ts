export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name?: string | null;
  systemRole: string;
}

export interface AuthTenant {
  id: string;
  slug: string;
  name: string;
}

export interface AuthRole {
  key: string;
  name: string;
}

export interface AuthSession {
  user: AuthUser;
  tenant: AuthTenant;
  roles: AuthRole[];
  permissions: string[];
}

export interface LoginResponse extends AuthSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

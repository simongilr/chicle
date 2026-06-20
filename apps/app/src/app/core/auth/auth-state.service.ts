import { Injectable, signal } from '@angular/core';
import { AuthSession, LoginResponse } from './auth.types';

const TOKEN_KEY = 'chicle.accessToken';
const SESSION_KEY = 'chicle.session';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  readonly session = signal<AuthSession | null>(this.readSession());
  readonly token = signal<string | null>(this.readToken());
  readonly validated = signal(false);

  get isAuthenticated() {
    return Boolean(this.token() && this.session());
  }

  setLogin(response: LoginResponse) {
    const session: AuthSession = {
      user: response.user,
      tenant: response.tenant,
      roles: response.roles,
      permissions: response.permissions
    };
    sessionStorage.setItem(TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.token.set(response.accessToken);
    this.session.set(session);
    this.validated.set(true);
  }

  setSession(session: AuthSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.session.set(session);
    this.validated.set(true);
  }

  clear() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    this.token.set(null);
    this.session.set(null);
    this.validated.set(false);
  }

  hasPermission(permission: string) {
    return this.session()?.permissions.includes(permission) ?? false;
  }

  hasAllPermissions(permissions: string[]) {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  hasRole(role: string) {
    const session = this.session();
    return session?.user.systemRole === role || (session?.roles.some((item) => item.key === role) ?? false);
  }

  hasAnyRole(roles: string[]) {
    return roles.some((role) => this.hasRole(role));
  }

  get isOwnerOrAdmin() {
    return this.hasAnyRole(['owner', 'admin']);
  }

  private readToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  private readSession(): AuthSession | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}

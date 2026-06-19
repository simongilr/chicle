import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClientService } from '../api/api-client.service';
import { AuthStateService } from './auth-state.service';
import { AuthSession, LoginRequest, LoginResponse } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);
  readonly state = inject(AuthStateService);

  login(request: LoginRequest) {
    return this.api.post<LoginResponse>('auth/login', request);
  }

  hydrate() {
    if (!this.state.token()) {
      return this.refresh();
    }

    return new Promise<boolean>((resolve) => {
      this.api.get<AuthSession>('auth/me').subscribe({
        next: (session) => {
          this.state.setSession(session);
          resolve(true);
        },
        error: () => {
          this.refresh().then(resolve);
        }
      });
    });
  }

  refresh() {
    return new Promise<boolean>((resolve) => {
      this.api.post<LoginResponse>('auth/refresh', {}).subscribe({
        next: (response) => {
          this.state.setLogin(response);
          resolve(true);
        },
        error: () => {
          this.state.clear();
          resolve(false);
        }
      });
    });
  }

  logout() {
    if (!this.state.token()) {
      this.finishLogout();
      return;
    }

    this.api.post<{ ok: true }>('auth/logout', {}).subscribe({
      next: () => this.finishLogout(),
      error: () => {
        this.finishLogout();
      }
    });
  }

  completeLogin(response: LoginResponse) {
    this.state.setLogin(response);
  }

  finishLogout() {
    this.state.clear();
    void this.router.navigateByUrl('/login');
  }
}

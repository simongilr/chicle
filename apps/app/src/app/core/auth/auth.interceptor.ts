import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStateService } from './auth-state.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const state = inject(AuthStateService);
  const token = state.token();
  const isApiRequest = request.url.startsWith(environment.apiUrl);
  const authRequest = isApiRequest
    ? request.clone({
        withCredentials: true,
        setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
      })
    : request;

  return next(authRequest);
};

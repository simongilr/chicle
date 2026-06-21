import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStateService } from './auth-state.service';
import { LoginResponse } from './auth.types';

let refreshRequest$: Observable<LoginResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const state = inject(AuthStateService);
  const http = inject(HttpClient);
  const token = state.token();
  const isApiRequest = request.url.startsWith(environment.apiUrl);
  const isRefreshRequest = request.url === `${environment.apiUrl}/auth/refresh`;
  const isLoginRequest = request.url === `${environment.apiUrl}/auth/login`;
  const shouldAttachToken = token && !isRefreshRequest && !isLoginRequest;
  const authRequest = isApiRequest
    ? request.clone({
        withCredentials: true,
        setHeaders: shouldAttachToken ? { Authorization: `Bearer ${token}` } : {}
      })
    : request;

  return next(authRequest).pipe(
    catchError((error) => {
      const canRefresh =
        isApiRequest &&
        !isRefreshRequest &&
        !isLoginRequest &&
        error instanceof HttpErrorResponse &&
        error.status === 401;

      if (!canRefresh) {
        return throwError(() => error);
      }

      refreshRequest$ ??= http
        .post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          shareReplay(1),
          finalize(() => {
            refreshRequest$ = null;
          })
        );

      return refreshRequest$.pipe(
        switchMap((response) => {
          state.setLogin(response);
          return next(
            request.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${response.accessToken}` }
            })
          );
        }),
        catchError((refreshError) => {
          state.clear();
          return throwError(() => refreshError);
        })
      );
    })
  );
};

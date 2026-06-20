import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.state.isAuthenticated && auth.state.validated()) {
    return true;
  }

  return auth.hydrate().then((authenticated) => authenticated || router.createUrlTree(['/login']));
};

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.state.isAuthenticated && auth.state.validated()) {
    return router.createUrlTree(['/home']);
  }

  if (!auth.state.token()) {
    return true;
  }

  return auth.hydrate().then((authenticated) => authenticated ? router.createUrlTree(['/home']) : true);
};

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permissions = (route.data['permissions'] as string[] | undefined) ?? [];

  if (permissions.length === 0) {
    return true;
  }

  const validate = () =>
    auth.state.isOwnerOrAdmin || auth.state.hasAllPermissions(permissions) || router.createUrlTree(['/home']);

  if (auth.state.isAuthenticated && auth.state.validated()) {
    return validate();
  }

  return auth
    .hydrate()
    .then((authenticated) => (authenticated ? validate() : router.createUrlTree(['/login'])));
};

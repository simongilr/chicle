import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiClientService } from '../api/api-client.service';

interface SetupStatus {
  state: 'not_created' | 'ready';
}

export const setupRedirectGuard: CanActivateFn = () => {
  const api = inject(ApiClientService);
  const router = inject(Router);

  return new Promise((resolve) => {
    api.get<SetupStatus>('setup/status').subscribe({
      next: (status) => {
        resolve(router.createUrlTree([status.state === 'ready' ? '/login' : '/setup']));
      },
      error: () => {
        resolve(router.createUrlTree(['/setup']));
      }
    });
  });
};

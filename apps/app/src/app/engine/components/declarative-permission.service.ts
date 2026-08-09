import { Injectable, inject } from '@angular/core';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { DeclarativeComponentAction, DeclarativeComponentContext, DeclarativeComponentContract } from './declarative-component.types';

@Injectable({ providedIn: 'root' })
export class DeclarativePermissionService {
  private readonly auth = inject(AuthStateService);

  canRender(contract: DeclarativeComponentContract, context?: DeclarativeComponentContext) {
    return this.hasAll(contract.permissions ?? [], context);
  }

  canExecute(action: DeclarativeComponentAction, context?: DeclarativeComponentContext) {
    const permissions = this.permissionsFrom(action);
    return this.hasAll(permissions, context);
  }

  private hasAll(permissions: string[], context?: DeclarativeComponentContext) {
    const required = permissions.filter(Boolean);
    if (!required.length) {
      return true;
    }
    const contextPermissions = context?.permissions;
    if (contextPermissions?.length) {
      return required.every((permission) => contextPermissions.includes(permission));
    }
    return required.every((permission) => this.auth.hasPermission(permission));
  }

  private permissionsFrom(action: DeclarativeComponentAction) {
    if (Array.isArray(action['permissions'])) {
      return action['permissions'].filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
    }
    return typeof action['permission'] === 'string' && action['permission'].trim() ? [action['permission'].trim()] : [];
  }
}


import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthContext } from '../auth.types';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

interface AuthenticatedRequest {
  auth?: AuthContext;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const permissions = new Set(request.auth?.permissions ?? []);
    const allowed = required.every((permission) => permissions.has(permission));
    if (!allowed) {
      throw new ForbiddenException('Missing permission');
    }

    return true;
  }
}

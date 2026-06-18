import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthContext } from '../auth.types';

interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  auth?: AuthContext;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    request.auth = await this.authService.verifyAccessToken(token);
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest) {
    const header = request.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    if (!value) {
      throw new UnauthorizedException('Missing authorization');
    }

    const [type, token] = value.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization');
    }

    return token;
  }
}

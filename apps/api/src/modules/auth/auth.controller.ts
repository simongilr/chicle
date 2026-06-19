import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { AuthResponse, AuthService, LoginRequest } from './auth.service';
import { AuthContext } from './auth.types';
import { CurrentAuth } from './decorators/current-auth.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}

interface CookieResponse {
  cookie: (name: string, value: string, options: Record<string, unknown>) => void;
  clearCookie: (name: string, options: Record<string, unknown>) => void;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  private readonly refreshCookieName = 'chicle_refresh';

  constructor(private readonly authService: AuthService) {}

  @Get('config')
  @ApiOperation({
    summary: 'Consultar configuracion publica de autenticacion',
    description:
      'La UI de login usa esta respuesta para mostrar solo los metodos activos para web, mobile o device.'
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        tenantSlug: 'mi-empresa',
        setupRequired: false,
        security: {
          level: 'standard',
          requireMfa: false,
          password: { enabled: true, minLength: 12, hash: 'bcrypt' },
          session: {
            webMode: 'refresh_cookie',
            accessTokenTtlMinutes: 15,
            refreshTokenTtlDays: 14
          },
          methods: [
            {
              type: 'password',
              enabled: true,
              label: 'Email y password',
              channels: ['web', 'mobile'],
              primary: true
            }
          ]
        }
      }
    }
  })
  config() {
    return this.authService.publicConfig();
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesion',
    description:
      'Devuelve accessToken Bearer y escribe chicle_refresh como cookie HttpOnly para refrescar sesion web.'
  })
  @ApiBody({
    schema: {
      example: {
        tenantSlug: 'mi-empresa',
        email: 'admin@example.com',
        password: 'CambiaEstaClave123'
      }
    }
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: { id: 'user-id', email: 'admin@example.com', systemRole: 'owner' },
        tenant: { id: 'tenant-id', slug: 'mi-empresa', name: 'Mi Empresa' },
        roles: [{ key: 'owner', name: 'Owner' }],
        permissions: ['users.read', 'roles.read', 'confisys.read']
      }
    }
  })
  async login(
    @Body() body: LoginRequest,
    @Req() request: HttpRequest,
    @Res({ passthrough: true }) response: CookieResponse
  ): Promise<AuthResponse> {
    const result = await this.authService.login(body, this.loginRateKey(body, request));
    this.setRefreshCookie(response, result.refreshToken, result.refreshMaxAgeMs);
    return result.body;
  }

  @Post('refresh')
  @ApiCookieAuth('chicle_refresh')
  @ApiOperation({
    summary: 'Refrescar sesion web',
    description:
      'Lee la cookie HttpOnly chicle_refresh, rota el refresh token y devuelve un accessToken nuevo.'
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        accessToken: 'nuevo-jwt',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: { email: 'admin@example.com' },
        roles: [{ key: 'owner', name: 'Owner' }],
        permissions: ['users.read']
      }
    }
  })
  async refresh(
    @Req() request: HttpRequest,
    @Res({ passthrough: true }) response: CookieResponse
  ): Promise<AuthResponse> {
    const result = await this.authService.refresh(this.readCookie(request, this.refreshCookieName));
    this.setRefreshCookie(response, result.refreshToken, result.refreshMaxAgeMs);
    return result.body;
  }

  @Post('login-device')
  @ApiOperation({
    summary: 'Placeholder de login por dispositivo',
    description:
      'Reserva la arquitectura para device_code. Todavia no es un proveedor real de produccion.'
  })
  @ApiBody({
    schema: {
      example: {
        deviceCode: 'ABC-123',
        password: 'opcional'
      }
    }
  })
  loginDevice(@Body() body: { deviceCode: string; password?: string }) {
    return {
      accessToken: 'pending-device-token',
      device: { code: body.deviceCode }
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Consultar usuario, tenant, roles y permisos actuales'
  })
  me(@CurrentAuth() auth: AuthContext) {
    return this.authService.me(auth);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cerrar sesion',
    description: 'Invalida la sesion server-side y limpia la cookie refresh.'
  })
  async logout(@CurrentAuth() auth: AuthContext, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.authService.logout(auth);
    this.clearRefreshCookie(response);
    return result;
  }

  private setRefreshCookie(response: CookieResponse, value: string, maxAge: number) {
    response.cookie(this.refreshCookieName, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge
    });
  }

  private clearRefreshCookie(response: CookieResponse) {
    response.clearCookie(this.refreshCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth'
    });
  }

  private readCookie(request: HttpRequest, name: string) {
    const raw = request.headers.cookie;
    if (!raw) {
      return undefined;
    }

    const cookieHeader = Array.isArray(raw) ? raw.join(';') : raw;
    return cookieHeader
      .split(';')
      .map((item: string) => item.trim())
      .find((item: string) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  }

  private loginRateKey(body: LoginRequest, request: HttpRequest) {
    const forwarded = request.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded ?? request.ip;
    return `${ip}:${body.tenantSlug ?? 'default'}:${body.email.toLowerCase().trim()}`;
  }
}

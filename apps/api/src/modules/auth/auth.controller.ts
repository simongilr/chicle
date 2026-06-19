import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
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
export class AuthController {
  private readonly refreshCookieName = 'chicle_refresh';

  constructor(private readonly authService: AuthService) {}

  @Get('config')
  config() {
    return this.authService.publicConfig();
  }

  @Post('login')
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
  async refresh(
    @Req() request: HttpRequest,
    @Res({ passthrough: true }) response: CookieResponse
  ): Promise<AuthResponse> {
    const result = await this.authService.refresh(this.readCookie(request, this.refreshCookieName));
    this.setRefreshCookie(response, result.refreshToken, result.refreshMaxAgeMs);
    return result.body;
  }

  @Post('login-device')
  loginDevice(@Body() body: { deviceCode: string; password?: string }) {
    return {
      accessToken: 'pending-device-token',
      device: { code: body.deviceCode }
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentAuth() auth: AuthContext) {
    return this.authService.me(auth);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
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

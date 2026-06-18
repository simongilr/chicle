import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService, LoginRequest } from './auth.service';
import { AuthContext } from './auth.types';
import { CurrentAuth } from './decorators/current-auth.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('config')
  config() {
    return this.authService.publicConfig();
  }

  @Post('login')
  login(@Body() body: LoginRequest) {
    return this.authService.login(body);
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
}

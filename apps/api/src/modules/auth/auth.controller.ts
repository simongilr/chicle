import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return {
      accessToken: 'pending-auth-token',
      user: { email: body.email },
      tenant: null
    };
  }

  @Post('login-device')
  loginDevice(@Body() body: { deviceCode: string; password?: string }) {
    return {
      accessToken: 'pending-device-token',
      device: { code: body.deviceCode }
    };
  }

  @Get('me')
  me() {
    return {
      user: null,
      tenant: null,
      permissions: []
    };
  }
}

import { Controller, Get } from '@nestjs/common';

@Controller('tenants')
export class TenantsController {
  @Get('current')
  current() {
    return null;
  }
}

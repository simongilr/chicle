import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { SetupService } from './setup.service';

interface SetupRequest {
  organization: string;
  email: string;
  password: string;
  template?: string;
}

interface ResetRequest {
  confirm: string;
}

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  status() {
    return this.setupService.status();
  }

  @Post()
  create(@Body() body: SetupRequest) {
    return this.setupService.createInitialTenant(body);
  }

  @Post('reset')
  reset(@Body() body: ResetRequest, @Headers('x-chicle-reset-key') resetKey?: string) {
    return this.setupService.resetForDevelopment(body, resetKey);
  }
}

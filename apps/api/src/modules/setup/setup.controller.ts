import { Body, Controller, Get, Post } from '@nestjs/common';
import { SetupService } from './setup.service';

interface SetupRequest {
  organization: string;
  email: string;
  password: string;
  template?: string;
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
}

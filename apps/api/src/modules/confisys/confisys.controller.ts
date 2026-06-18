import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ConfisysService, ConfisysUpdate } from './confisys.service';

@Controller('confisys')
export class ConfisysController {
  constructor(private readonly confisys: ConfisysService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('confisys.read')
  list() {
    return this.confisys.list(true);
  }

  @Get('public')
  publicList() {
    return this.confisys.list(false);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('confisys.update')
  update(@Param('key') key: string, @Body() body: ConfisysUpdate) {
    return this.confisys.upsert(key, body);
  }
}

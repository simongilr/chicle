import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ConfisysService, ConfisysUpdate } from './confisys.service';

@Controller('confisys')
export class ConfisysController {
  constructor(private readonly confisys: ConfisysService) {}

  @Get()
  list() {
    return this.confisys.list(true);
  }

  @Get('public')
  publicList() {
    return this.confisys.list(false);
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() body: ConfisysUpdate) {
    return this.confisys.upsert(key, body);
  }
}

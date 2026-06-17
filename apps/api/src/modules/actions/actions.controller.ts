import { Body, Controller, Post } from '@nestjs/common';

@Controller('actions')
export class ActionsController {
  @Post('execute')
  execute(@Body() body: unknown) {
    return {
      accepted: true,
      result: body
    };
  }
}

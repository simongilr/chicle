import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('records')
export class RecordsController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id };
  }

  @Post()
  create(@Body() body: unknown) {
    return body;
  }
}

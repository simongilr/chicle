import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('forms')
export class DynamicFormsController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':key')
  findByKey(@Param('key') key: string) {
    return {
      key,
      title: key,
      version: 1,
      fields: []
    };
  }

  @Post()
  create(@Body() body: unknown) {
    return body;
  }
}

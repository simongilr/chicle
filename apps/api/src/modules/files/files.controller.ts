import { Controller, Get, Param, Post } from '@nestjs/common';

@Controller('files')
export class FilesController {
  @Post('upload')
  upload() {
    return {
      uploaded: false,
      note: 'StorageService implementation pending'
    };
  }

  @Get('record/:recordId')
  byRecord(@Param('recordId') recordId: string) {
    return {
      recordId,
      files: []
    };
  }
}

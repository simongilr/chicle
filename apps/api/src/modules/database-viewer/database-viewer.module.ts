import { Module } from '@nestjs/common';
import { DatabaseViewerController } from './database-viewer.controller';
import { DatabaseViewerService } from './database-viewer.service';

@Module({
  controllers: [DatabaseViewerController],
  providers: [DatabaseViewerService]
})
export class DatabaseViewerModule {}

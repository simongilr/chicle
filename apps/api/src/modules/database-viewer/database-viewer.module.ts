import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseViewerController } from './database-viewer.controller';
import { DatabaseViewerService } from './database-viewer.service';
import { SchemaChange } from './schema-change.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SchemaChange])],
  controllers: [DatabaseViewerController],
  providers: [DatabaseViewerService]
})
export class DatabaseViewerModule {}

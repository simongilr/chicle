import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowOutboxEvent } from '../flows/flow-outbox-event.entity';
import { RecordEntity } from './record.entity';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecordEntity, FlowOutboxEvent])],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService]
})
export class RecordsModule {}

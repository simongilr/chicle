import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordEntity } from './record.entity';
import { RecordsController } from './records.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecordEntity])],
  controllers: [RecordsController]
})
export class RecordsModule {}

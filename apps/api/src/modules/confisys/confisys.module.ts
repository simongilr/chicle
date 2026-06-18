import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfisysController } from './confisys.controller';
import { ConfisysParam } from './confisys.entity';
import { ConfisysService } from './confisys.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConfisysParam])],
  controllers: [ConfisysController],
  providers: [ConfisysService],
  exports: [ConfisysService]
})
export class ConfisysModule {}

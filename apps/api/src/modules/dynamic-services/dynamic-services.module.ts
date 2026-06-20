import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ConfisysModule } from '../confisys/confisys.module';
import { DynamicService } from './dynamic-service.entity';
import { DynamicServiceRun } from './dynamic-service-run.entity';
import { DynamicServiceVersion } from './dynamic-service-version.entity';
import { DynamicServicesController } from './dynamic-services.controller';
import { DynamicServicesService } from './dynamic-services.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DynamicService, DynamicServiceVersion, DynamicServiceRun]),
    ConfisysModule,
    AuditModule
  ],
  controllers: [DynamicServicesController],
  providers: [DynamicServicesService],
  exports: [DynamicServicesService]
})
export class DynamicServicesModule {}

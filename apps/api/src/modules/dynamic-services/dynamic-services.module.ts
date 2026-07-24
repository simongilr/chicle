import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ConfisysModule } from '../confisys/confisys.module';
import { RbacModule } from '../rbac/rbac.module';
import { Tenant } from '../tenants/tenant.entity';
import { DynamicService } from './dynamic-service.entity';
import { DynamicServiceRun } from './dynamic-service-run.entity';
import { DynamicServiceVersion } from './dynamic-service-version.entity';
import { DynamicServicesController } from './dynamic-services.controller';
import { DynamicServicesPublicController } from './dynamic-services-public.controller';
import { DynamicServicesService } from './dynamic-services.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DynamicService, DynamicServiceVersion, DynamicServiceRun, Tenant]),
    ConfisysModule,
    AuditModule,
    RbacModule
  ],
  controllers: [DynamicServicesController, DynamicServicesPublicController],
  providers: [DynamicServicesService],
  exports: [DynamicServicesService]
})
export class DynamicServicesModule {}

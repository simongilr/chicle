import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { DynamicAppVersion } from './dynamic-app-version.entity';
import { DynamicApp } from './dynamic-app.entity';
import { DynamicAppsController } from './dynamic-apps.controller';
import { DynamicAppsService } from './dynamic-apps.service';
import { DynamicScreenVersion } from './dynamic-screen-version.entity';
import { DynamicScreen } from './dynamic-screen.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DynamicApp, DynamicAppVersion, DynamicScreen, DynamicScreenVersion]),
    AuditModule
  ],
  controllers: [DynamicAppsController],
  providers: [DynamicAppsService],
  exports: [DynamicAppsService]
})
export class DynamicAppsModule {}

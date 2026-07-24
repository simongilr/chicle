import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { DatabaseViewerModule } from './modules/database-viewer/database-viewer.module';
import { ActionsModule } from './modules/actions/actions.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfisysModule } from './modules/confisys/confisys.module';
import { DevicesModule } from './modules/devices/devices.module';
import { DynamicFormsModule } from './modules/dynamic-forms/dynamic-forms.module';
import { DynamicServicesModule } from './modules/dynamic-services/dynamic-services.module';
import { EnvironmentDeployModule } from './modules/environment-deploy/environment-deploy.module';
import { FilesModule } from './modules/files/files.module';
import { FlowsModule } from './modules/flows/flows.module';
import { MenusModule } from './modules/menus/menus.module';
import { RecordsModule } from './modules/records/records.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SetupModule } from './modules/setup/setup.module';
import { SyncModule } from './modules/sync/sync.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ConfisysModule,
    DatabaseViewerModule,
    RbacModule,
    SetupModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    SettingsModule,
    MenusModule,
    DynamicFormsModule,
    DynamicServicesModule,
    EnvironmentDeployModule,
    FlowsModule,
    ActionsModule,
    AiAssistantModule,
    RecordsModule,
    FilesModule,
    DevicesModule,
    SyncModule,
    AuditModule
  ]
})
export class AppModule {}

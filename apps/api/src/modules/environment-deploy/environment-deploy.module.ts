import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ChicleVaultService } from './chicle-vault.service';
import { EnvironmentDeployController } from './environment-deploy.controller';
import { EnvironmentDeployService } from './environment-deploy.service';
import { EnvironmentProfile } from './environment-profile.entity';
import { EnvironmentSecret } from './environment-secret.entity';
import { EnvironmentVariable } from './environment-variable.entity';
import { ServiceRegistryEntry } from './service-registry-entry.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EnvironmentProfile, EnvironmentVariable, EnvironmentSecret, ServiceRegistryEntry]),
    AuditModule
  ],
  controllers: [EnvironmentDeployController],
  providers: [ChicleVaultService, EnvironmentDeployService],
  exports: [ChicleVaultService, EnvironmentDeployService]
})
export class EnvironmentDeployModule {}

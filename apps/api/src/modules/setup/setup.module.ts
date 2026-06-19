import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfisysModule } from '../confisys/confisys.module';
import { RbacModule } from '../rbac/rbac.module';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Tenant, User]), ConfisysModule, RbacModule],
  controllers: [SetupController],
  providers: [SetupService]
})
export class SetupModule {}

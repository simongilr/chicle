import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User])],
  controllers: [SetupController],
  providers: [SetupService]
})
export class SetupModule {}

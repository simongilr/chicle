import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfisysModule } from '../confisys/confisys.module';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User]), ConfisysModule],
  controllers: [SetupController],
  providers: [SetupService]
})
export class SetupModule {}

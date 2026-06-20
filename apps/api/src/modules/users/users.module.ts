import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ConfisysModule } from '../confisys/confisys.module';
import { RbacModule } from '../rbac/rbac.module';
import { TenantMembership } from '../tenants/tenant-membership.entity';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantMembership, User]), RbacModule, ConfisysModule, AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService]
})
export class UsersModule {}

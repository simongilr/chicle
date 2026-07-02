import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { DynamicService } from '../dynamic-services/dynamic-service.entity';
import { DynamicServiceVersion } from '../dynamic-services/dynamic-service-version.entity';
import { Flow } from '../flows/flow.entity';
import { MenusModule } from '../menus/menus.module';
import { Permission } from './permission.entity';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { RolePermission } from './role-permission.entity';
import { RoleResourceGrant } from './role-resource-grant.entity';
import { RoleResourcePolicy } from './role-resource-policy.entity';
import { Role } from './role.entity';
import { UserRole } from './user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      RolePermission,
      RoleResourcePolicy,
      RoleResourceGrant,
      UserRole,
      DynamicService,
      DynamicServiceVersion,
      Flow
    ]),
    AuditModule,
    MenusModule
  ],
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService]
})
export class RbacModule {}

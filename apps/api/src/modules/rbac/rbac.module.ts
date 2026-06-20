import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { MenusModule } from '../menus/menus.module';
import { Permission } from './permission.entity';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { RolePermission } from './role-permission.entity';
import { Role } from './role.entity';
import { UserRole } from './user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role, RolePermission, UserRole]), AuditModule, MenusModule],
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService]
})
export class RbacModule {}

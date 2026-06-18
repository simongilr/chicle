import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './permission.entity';
import { RbacService } from './rbac.service';
import { RolePermission } from './role-permission.entity';
import { Role } from './role.entity';
import { UserRole } from './user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role, RolePermission, UserRole])],
  providers: [RbacService],
  exports: [RbacService]
})
export class RbacModule {}

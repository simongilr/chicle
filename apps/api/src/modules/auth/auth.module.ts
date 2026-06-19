import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfisysModule } from '../confisys/confisys.module';
import { RbacModule } from '../rbac/rbac.module';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { AuthLoginAttempt } from './auth-login-attempt.entity';
import { AuthSession } from './auth-session.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([Tenant, User, AuthSession, AuthLoginAttempt]),
    ConfisysModule,
    RbacModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard]
})
export class AuthModule {}

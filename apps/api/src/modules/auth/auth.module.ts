import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfisysModule } from '../confisys/confisys.module';
import { Tenant } from '../tenants/tenant.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), ConfisysModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}

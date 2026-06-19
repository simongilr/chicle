import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiTags('Tenants')
@ApiBearerAuth('access-token')
export class TenantsController {
  @Get('current')
  @ApiOperation({ summary: 'Consultar tenant actual de la sesión' })
  current(@CurrentAuth() auth: AuthContext) {
    return {
      id: auth.tenant.id,
      slug: auth.tenant.slug,
      name: auth.tenant.name,
      active: auth.tenant.active
    };
  }
}

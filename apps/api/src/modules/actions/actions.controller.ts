import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('actions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Actions')
@ApiBearerAuth('access-token')
export class ActionsController {
  @Post('execute')
  @RequirePermissions('records.create')
  @ApiOperation({ summary: 'Ejecutar acción declarativa autorizada' })
  execute(@Body() body: unknown) {
    return {
      accepted: true,
      result: body
    };
  }
}

import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ConfisysService, ConfisysUpdate } from './confisys.service';

@Controller('confisys')
@ApiTags('Confisys')
export class ConfisysController {
  constructor(private readonly confisys: ConfisysService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('confisys.read')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Listar parametros del sistema',
    description:
      'Requiere confisys.read. La API carga estos parametros en memoria al iniciar y aplica cambios al reiniciar.'
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          key: 'security.password.minLength',
          value: 12,
          valueType: 'number',
          category: 'security',
          isPublic: true,
          editable: true,
          source: 'seed'
        }
      ]
    }
  })
  list() {
    return this.confisys.list(true);
  }

  @Get('public')
  @ApiOperation({
    summary: 'Listar parametros publicos',
    description: 'No requiere token. Solo devuelve parametros marcados como seguros para UI publica.'
  })
  publicList() {
    return this.confisys.list(false);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('confisys.update')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Crear o actualizar parametro confisys',
    description:
      'Requiere confisys.update. El valor queda en DB y normalmente requiere reiniciar API para recargar cache.'
  })
  @ApiParam({ name: 'key', example: 'security.password.minLength' })
  @ApiBody({
    schema: {
      example: {
        value: 14,
        valueType: 'number',
        category: 'security',
        description: 'Longitud minima de password.',
        isPublic: true,
        editable: true
      }
    }
  })
  update(@Param('key') key: string, @Body() body: ConfisysUpdate) {
    return this.confisys.upsert(key, body);
  }
}

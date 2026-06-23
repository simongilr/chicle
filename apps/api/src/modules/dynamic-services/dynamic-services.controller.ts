import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  DynamicServiceExecuteRequest,
  DynamicServiceTestRequest,
  DynamicServiceUpsertRequest,
  DynamicServiceVersionRequest,
  DynamicServicesService
} from './dynamic-services.service';

@Controller('dynamic-services')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Dynamic Services')
@ApiBearerAuth('access-token')
export class DynamicServicesController {
  constructor(private readonly dynamicServices: DynamicServicesService) {}

  @Get()
  @RequirePermissions('services.read')
  @ApiOperation({
    summary: 'Listar servicios dinámicos del tenant',
    description: 'Devuelve servicios configurables, su versión más reciente y la versión publicada.'
  })
  list(@CurrentAuth() auth: AuthContext) {
    return this.dynamicServices.list(auth);
  }

  @Get('trash')
  @RequirePermissions('services.read')
  @ApiOperation({
    summary: 'Listar servicios en papelera',
    description: 'Devuelve servicios enviados a papelera para permitir restaurarlos sin perder versiones ni historial.'
  })
  listTrash(@CurrentAuth() auth: AuthContext) {
    return this.dynamicServices.listTrashed(auth);
  }

  @Get('catalog/tables')
  @RequirePermissions('services.read')
  @ApiOperation({
    summary: 'Catálogo de tablas para diseñar servicios',
    description:
      'Devuelve nombres y columnas visibles para usar selects en el diseñador. No devuelve filas ni permite SQL libre.'
  })
  tableCatalog() {
    return this.dynamicServices.tableCatalog();
  }

  @Post('by-key/:serviceKey/execute')
  @RequirePermissions('services.execute')
  @ApiOperation({
    summary: 'Ejecutar servicio dinámico por key',
    description:
      'Punto estable para pantallas, acciones y componentes del frontend. Permite consumir cualquier servicio publicado sin crear un endpoint nuevo por caso.'
  })
  @ApiParam({ name: 'serviceKey', example: 'buscar_usuario' })
  @ApiBody({
    schema: {
      example: {
        context: {
          name: 'simon'
        }
      }
    }
  })
  executeByKey(
    @CurrentAuth() auth: AuthContext,
    @Param('serviceKey') serviceKey: string,
    @Body() body: DynamicServiceExecuteRequest
  ) {
    return this.dynamicServices.executeByKey(auth, serviceKey, body);
  }

  @Post()
  @RequirePermissions('services.manage')
  @ApiOperation({
    summary: 'Crear servicio dinámico',
    description: 'Crea el objeto de servicio del tenant. Las reglas ejecutables viven en versiones.'
  })
  @ApiBody({
    schema: {
      example: {
        key: 'validar_serial',
        name: 'Validar serial',
        description: 'Consulta un proveedor externo para validar seriales.',
        active: true
      }
    }
  })
  create(@CurrentAuth() auth: AuthContext, @Body() body: DynamicServiceUpsertRequest) {
    return this.dynamicServices.create(auth, body);
  }

  @Patch(':serviceId')
  @RequirePermissions('services.manage')
  @ApiOperation({ summary: 'Actualizar metadatos de un servicio dinámico' })
  @ApiParam({ name: 'serviceId', example: 'service-id' })
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('serviceId') serviceId: string,
    @Body() body: DynamicServiceUpsertRequest
  ) {
    return this.dynamicServices.update(auth, serviceId, body);
  }

  @Post(':serviceId/trash')
  @RequirePermissions('services.manage')
  @ApiOperation({ summary: 'Enviar servicio dinámico a papelera' })
  @ApiParam({ name: 'serviceId', example: 'service-id' })
  trash(@CurrentAuth() auth: AuthContext, @Param('serviceId') serviceId: string) {
    return this.dynamicServices.trash(auth, serviceId);
  }

  @Post(':serviceId/restore')
  @RequirePermissions('services.manage')
  @ApiOperation({ summary: 'Restaurar servicio dinámico desde papelera' })
  @ApiParam({ name: 'serviceId', example: 'service-id' })
  restore(@CurrentAuth() auth: AuthContext, @Param('serviceId') serviceId: string) {
    return this.dynamicServices.restore(auth, serviceId);
  }

  @Post(':serviceId/versions')
  @RequirePermissions('services.manage')
  @ApiOperation({
    summary: 'Crear versión draft de un servicio',
    description: 'Valida y guarda una definición HTTP versionada. La ejecución usa solo versiones publicadas.'
  })
  @ApiParam({ name: 'serviceId', example: 'service-id' })
  @ApiBody({
    schema: {
      example: {
        definition: {
          method: 'POST',
          url: 'https://api.ejemplo.com/validar',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {{input.token}}'
          },
          body: {
            serial: '{{input.serial}}',
            tenant: '{{tenant.slug}}'
          },
          timeoutMs: 8000,
          retry: { attempts: 0, backoffMs: 0 }
        }
      }
    }
  })
  createVersion(
    @CurrentAuth() auth: AuthContext,
    @Param('serviceId') serviceId: string,
    @Body() body: DynamicServiceVersionRequest
  ) {
    return this.dynamicServices.createVersion(auth, serviceId, body);
  }

  @Post(':serviceId/versions/:versionId/publish')
  @RequirePermissions('services.manage')
  @ApiOperation({ summary: 'Publicar una versión de servicio dinámico' })
  @ApiParam({ name: 'serviceId', example: 'service-id' })
  @ApiParam({ name: 'versionId', example: 'version-id' })
  publishVersion(
    @CurrentAuth() auth: AuthContext,
    @Param('serviceId') serviceId: string,
    @Param('versionId') versionId: string
  ) {
    return this.dynamicServices.publishVersion(auth, serviceId, versionId);
  }

  @Post(':serviceId/test')
  @RequirePermissions('services.execute')
  @ApiOperation({
    summary: 'Probar servicio dinámico publicado',
    description:
      'Ejecuta desde backend con timeout, bloqueo de hosts privados por defecto y snapshots sanitizados.'
  })
  @ApiParam({ name: 'serviceId', example: 'service-id' })
  @ApiBody({
    schema: {
      example: {
        context: {
          serial: 'ABC-123',
          token: 'solo-para-prueba'
        }
      }
    }
  })
  test(
    @CurrentAuth() auth: AuthContext,
    @Param('serviceId') serviceId: string,
    @Body() body: DynamicServiceTestRequest
  ) {
    return this.dynamicServices.test(auth, serviceId, body);
  }

  @Get(':serviceId/runs')
  @RequirePermissions('services.read')
  @ApiOperation({ summary: 'Listar ejecuciones recientes de un servicio dinámico' })
  @ApiParam({ name: 'serviceId', example: 'service-id' })
  runs(@CurrentAuth() auth: AuthContext, @Param('serviceId') serviceId: string) {
    return this.dynamicServices.listRuns(auth, serviceId);
  }
}

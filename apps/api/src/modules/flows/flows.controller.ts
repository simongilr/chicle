import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { FlowExecuteRequest, FlowStepRequest, FlowUpsertRequest, FlowsService } from './flows.service';

@Controller('flows')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Flows')
@ApiBearerAuth('access-token')
export class FlowsController {
  constructor(private readonly flows: FlowsService) {}

  @Get()
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar flows del tenant' })
  list(@CurrentAuth() auth: AuthContext) {
    return this.flows.list(auth);
  }

  @Get('trash')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar flows en papelera' })
  listTrash(@CurrentAuth() auth: AuthContext) {
    return this.flows.listTrashed(auth);
  }

  @Post()
  @RequirePermissions('flows.create')
  @ApiOperation({ summary: 'Crear flow configurable' })
  @ApiBody({
    schema: {
      example: {
        key: 'validar_usuario_reporte',
        name: 'Validar usuario y generar reporte',
        description: 'Orquesta servicios, reglas y respuesta final.',
        category: 'operaciones'
      }
    }
  })
  create(@CurrentAuth() auth: AuthContext, @Body() body: FlowUpsertRequest) {
    return this.flows.create(auth, body);
  }

  @Post('by-key/:flowKey/execute')
  @RequirePermissions('flows.execute')
  @ApiOperation({ summary: 'Ejecutar flow publicado por key' })
  @ApiParam({ name: 'flowKey', example: 'validar_usuario_reporte' })
  @ApiBody({
    schema: {
      example: {
        input: {
          email: 'admin@example.com'
        }
      }
    }
  })
  executeByKey(@CurrentAuth() auth: AuthContext, @Param('flowKey') flowKey: string, @Body() body: FlowExecuteRequest) {
    return this.flows.executeByKey(auth, flowKey, body);
  }

  @Get(':flowId')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Obtener flow con pasos y versiones' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  get(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.get(auth, flowId);
  }

  @Get(':flowId/runs')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar ejecuciones recientes de un flow' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  runs(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.listRuns(auth, flowId);
  }

  @Post(':flowId/execute')
  @RequirePermissions('flows.execute')
  @ApiOperation({ summary: 'Ejecutar flow publicado por id' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  @ApiBody({
    schema: {
      example: {
        input: {
          email: 'admin@example.com'
        }
      }
    }
  })
  execute(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string, @Body() body: FlowExecuteRequest) {
    return this.flows.execute(auth, flowId, body);
  }

  @Patch(':flowId')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Actualizar metadatos de flow' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  update(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string, @Body() body: FlowUpsertRequest) {
    return this.flows.update(auth, flowId, body);
  }

  @Post(':flowId/trash')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Enviar flow a papelera' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  trash(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.trash(auth, flowId);
  }

  @Post(':flowId/restore')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Restaurar flow desde papelera' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  restore(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.restore(auth, flowId);
  }

  @Get(':flowId/definition')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Generar preview JSON de definición desde pasos draft' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  definition(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.definition(auth, flowId);
  }

  @Post(':flowId/steps')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Agregar paso draft al flow' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  @ApiBody({
    schema: {
      example: {
        key: 'consultar_usuario',
        name: 'Consultar usuario',
        type: 'dynamic_service',
        position: 10,
        config: { serviceKey: 'buscar_usuario' },
        inputMap: { email: '{{input.email}}' },
        outputKey: 'user'
      }
    }
  })
  createStep(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string, @Body() body: FlowStepRequest) {
    return this.flows.createStep(auth, flowId, body);
  }

  @Patch(':flowId/steps/:stepId')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Actualizar paso draft del flow' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  @ApiParam({ name: 'stepId', example: 'step-id' })
  updateStep(
    @CurrentAuth() auth: AuthContext,
    @Param('flowId') flowId: string,
    @Param('stepId') stepId: string,
    @Body() body: FlowStepRequest
  ) {
    return this.flows.updateStep(auth, flowId, stepId, body);
  }

  @Delete(':flowId/steps/:stepId')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Eliminar paso draft del flow' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  @ApiParam({ name: 'stepId', example: 'step-id' })
  deleteStep(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string, @Param('stepId') stepId: string) {
    return this.flows.deleteStep(auth, flowId, stepId);
  }

  @Get(':flowId/versions')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar versiones de un flow' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  versions(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.listVersions(auth, flowId);
  }

  @Post(':flowId/versions')
  @RequirePermissions('flows.publish')
  @ApiOperation({ summary: 'Crear versión draft desde pasos actuales' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  createVersion(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.createVersion(auth, flowId);
  }

  @Post(':flowId/versions/:versionId/publish')
  @RequirePermissions('flows.publish')
  @ApiOperation({ summary: 'Publicar versión de flow' })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  @ApiParam({ name: 'versionId', example: 'version-id' })
  publishVersion(
    @CurrentAuth() auth: AuthContext,
    @Param('flowId') flowId: string,
    @Param('versionId') versionId: string
  ) {
    return this.flows.publishVersion(auth, flowId, versionId);
  }
}

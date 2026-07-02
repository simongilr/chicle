import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  FlowExecuteRequest,
  FlowDefinitionReplaceRequest,
  FlowPreviewRequest,
  FlowStepRequest,
  FlowTestCaseRequest,
  FlowTriggerRequest,
  FlowUpsertRequest,
  FlowsService
} from './flows.service';
import {
  EmitFlowEventRequest,
  FireFlowTriggerRequest,
  FlowRuntimeService,
  QueueFlowRequest
} from './flow-runtime.service';

@Controller('flows')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Flows')
@ApiBearerAuth('access-token')
export class FlowsController {
  constructor(
    private readonly flows: FlowsService,
    private readonly runtime: FlowRuntimeService
  ) {}

  @Get()
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar flows del tenant' })
  list(@CurrentAuth() auth: AuthContext) {
    return this.flows.list(auth);
  }

  @Get('available')
  @RequirePermissions('flows.execute')
  @ApiOperation({
    summary: 'Listar flows publicados disponibles para el usuario',
    description:
      'Catálogo para pantallas y componentes dinámicos. Aplica permiso general y asignaciones de recursos por rol.'
  })
  listAvailable(@CurrentAuth() auth: AuthContext) {
    return this.flows.listAvailable(auth);
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

  @Get('jobs')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar trabajos asíncronos recientes del tenant' })
  jobs(@CurrentAuth() auth: AuthContext) {
    return this.runtime.listJobs(auth);
  }

  @Get('jobs/:jobId')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Consultar estado de un trabajo asíncrono' })
  job(@CurrentAuth() auth: AuthContext, @Param('jobId') jobId: string) {
    return this.runtime.getJob(auth, jobId);
  }

  @Post('jobs/:jobId/cancel')
  @RequirePermissions('flows.execute')
  @ApiOperation({ summary: 'Cancelar un trabajo pendiente' })
  cancelJob(@CurrentAuth() auth: AuthContext, @Param('jobId') jobId: string) {
    return this.runtime.cancelJob(auth, jobId);
  }

  @Post('jobs/:jobId/retry')
  @RequirePermissions('flows.execute')
  @ApiOperation({ summary: 'Reintentar un trabajo fallido o cancelado' })
  retryJob(@CurrentAuth() auth: AuthContext, @Param('jobId') jobId: string) {
    return this.runtime.retryJob(auth, jobId);
  }

  @Post('events/:eventKey')
  @RequirePermissions('flows.execute')
  @ApiOperation({
    summary: 'Guardar un evento durable en el outbox del tenant'
  })
  emitEvent(@CurrentAuth() auth: AuthContext, @Param('eventKey') eventKey: string, @Body() body: EmitFlowEventRequest) {
    return this.runtime.emitEvent(auth, eventKey, body);
  }

  @Post('triggers/manual/:triggerKey/fire')
  @RequirePermissions('flows.execute')
  @ApiOperation({ summary: 'Disparar manualmente un trigger activo' })
  fireManualTrigger(
    @CurrentAuth() auth: AuthContext,
    @Param('triggerKey') triggerKey: string,
    @Body() body: FireFlowTriggerRequest
  ) {
    return this.runtime.fireTrigger(auth, 'manual', triggerKey, body);
  }

  @Sse('live')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Recibir progreso de jobs del tenant mediante SSE' })
  live(@CurrentAuth() auth: AuthContext) {
    return this.runtime.liveStream(auth);
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

  @Get(':flowId/jobs')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar trabajos asíncronos de un flow' })
  flowJobs(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.runtime.listJobs(auth, flowId);
  }

  @Post(':flowId/enqueue')
  @RequirePermissions('flows.execute')
  @ApiOperation({ summary: 'Encolar una ejecución durable del flow publicado' })
  enqueue(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string, @Body() body: QueueFlowRequest) {
    return this.runtime.enqueue(auth, flowId, body);
  }

  @Get(':flowId/triggers')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar triggers configurados para un flow' })
  triggers(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.listTriggers(auth, flowId);
  }

  @Post(':flowId/triggers')
  @RequirePermissions('flows.update')
  @ApiOperation({
    summary: 'Crear trigger manual, HTTP, evento, formulario o schedule'
  })
  createTrigger(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string, @Body() body: FlowTriggerRequest) {
    return this.flows.createTrigger(auth, flowId, body);
  }

  @Patch(':flowId/triggers/:triggerId')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Actualizar trigger de un flow' })
  updateTrigger(
    @CurrentAuth() auth: AuthContext,
    @Param('flowId') flowId: string,
    @Param('triggerId') triggerId: string,
    @Body() body: FlowTriggerRequest
  ) {
    return this.flows.updateTrigger(auth, flowId, triggerId, body);
  }

  @Delete(':flowId/triggers/:triggerId')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Eliminar trigger de un flow' })
  deleteTrigger(
    @CurrentAuth() auth: AuthContext,
    @Param('flowId') flowId: string,
    @Param('triggerId') triggerId: string
  ) {
    return this.flows.deleteTrigger(auth, flowId, triggerId);
  }

  @Get(':flowId/test-cases')
  @RequirePermissions('flows.read')
  @ApiOperation({ summary: 'Listar casos de prueba persistentes de un flow' })
  listTestCases(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.listTestCases(auth, flowId);
  }

  @Post(':flowId/test-cases')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Crear caso de prueba con assertions' })
  @ApiBody({
    schema: {
      example: {
        name: 'Usuario owner válido',
        target: 'draft',
        expectedStatus: 'success',
        input: { email: 'admin@example.com' },
        assertions: [
          { path: 'output.body.ok', operator: 'equals', expected: true },
          { path: 'output.body.role', operator: 'equals', expected: 'owner' }
        ]
      }
    }
  })
  createTestCase(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string, @Body() body: FlowTestCaseRequest) {
    return this.flows.createTestCase(auth, flowId, body);
  }

  @Patch(':flowId/test-cases/:testCaseId')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Actualizar caso de prueba de un flow' })
  updateTestCase(
    @CurrentAuth() auth: AuthContext,
    @Param('flowId') flowId: string,
    @Param('testCaseId') testCaseId: string,
    @Body() body: FlowTestCaseRequest
  ) {
    return this.flows.updateTestCase(auth, flowId, testCaseId, body);
  }

  @Delete(':flowId/test-cases/:testCaseId')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Eliminar caso de prueba de un flow' })
  deleteTestCase(
    @CurrentAuth() auth: AuthContext,
    @Param('flowId') flowId: string,
    @Param('testCaseId') testCaseId: string
  ) {
    return this.flows.deleteTestCase(auth, flowId, testCaseId);
  }

  @Post(':flowId/test-cases/:testCaseId/run')
  @RequirePermissions('flows.execute')
  @ApiOperation({
    summary: 'Ejecutar un caso de prueba y evaluar sus assertions'
  })
  runTestCase(
    @CurrentAuth() auth: AuthContext,
    @Param('flowId') flowId: string,
    @Param('testCaseId') testCaseId: string
  ) {
    return this.flows.runTestCase(auth, flowId, testCaseId);
  }

  @Post(':flowId/test-suite/run')
  @RequirePermissions('flows.execute')
  @ApiOperation({
    summary: 'Ejecutar todos los casos de prueba activos del flow'
  })
  runTestSuite(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.runTestSuite(auth, flowId);
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

  @Post(':flowId/preview')
  @RequirePermissions('flows.execute')
  @ApiOperation({
    summary: 'Probar el borrador completo o hasta un paso sin publicarlo'
  })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  @ApiBody({
    schema: {
      example: {
        input: { email: 'admin@example.com', total: 100 },
        throughStepKey: 'validar_email'
      }
    }
  })
  preview(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string, @Body() body: FlowPreviewRequest) {
    return this.flows.preview(auth, flowId, body);
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
  @ApiOperation({
    summary: 'Generar preview JSON de definición desde pasos draft'
  })
  @ApiParam({ name: 'flowId', example: 'flow-id' })
  definition(@CurrentAuth() auth: AuthContext, @Param('flowId') flowId: string) {
    return this.flows.definition(auth, flowId);
  }

  @Put(':flowId/definition')
  @RequirePermissions('flows.update')
  @ApiOperation({ summary: 'Reemplazar atómicamente el borrador desde el documento JSON de autoría' })
  replaceDefinition(
    @CurrentAuth() auth: AuthContext,
    @Param('flowId') flowId: string,
    @Body() body: FlowDefinitionReplaceRequest
  ) {
    return this.flows.replaceDefinition(auth, flowId, body);
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

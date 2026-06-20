import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DatabaseViewerService, SchemaDesignRequest } from './database-viewer.service';

@Controller('database')
@ApiTags('Database')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DatabaseViewerController {
  constructor(private readonly databaseViewer: DatabaseViewerService) {}

  @Get('tables')
  @ApiOperation({
    summary: 'Listar tablas visibles para inspección',
    description:
      'Visor web minimalista para owner/admin. Filtra por tenant cuando la entidad tiene tenantId y oculta tablas no seguras.'
  })
  tables(@CurrentAuth() auth: AuthContext) {
    return this.databaseViewer.listTables(auth);
  }

  @Get('tables/:table')
  @ApiOperation({
    summary: 'Leer filas de una tabla visible',
    description: 'Solo lectura, con paginación y enmascarado de columnas sensibles.'
  })
  @ApiParam({ name: 'table', example: 'users' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 25 })
  rows(
    @CurrentAuth() auth: AuthContext,
    @Param('table') table: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.databaseViewer.listRows(auth, table, Number(page), Number(pageSize));
  }

  @Patch('tables/:table/:id')
  @ApiOperation({
    summary: 'Editar una fila desde el visor DB',
    description:
      'Edición controlada para owner/admin. No permite SQL libre ni modificar IDs, tenantId, hashes, sesiones, auditoría o RBAC pivote.'
  })
  @ApiParam({ name: 'table', example: 'menus' })
  @ApiParam({ name: 'id', example: 'row-id' })
  @ApiBody({
    schema: {
      example: {
        values: {
          label: 'Manual operativo',
          active: true
        }
      }
    }
  })
  updateRow(
    @CurrentAuth() auth: AuthContext,
    @Param('table') table: string,
    @Param('id') id: string,
    @Body() body: { values?: Record<string, unknown> }
  ) {
    return this.databaseViewer.updateRow(auth, table, id, body.values ?? {});
  }

  @Post('schema/preview')
  @ApiOperation({
    summary: 'Previsualizar un cambio de esquema',
    description:
      'Genera SQL y migración TypeORM sin aplicar el cambio. Solo permite tablas custom_* y columnas controladas.'
  })
  @ApiBody({
    schema: {
      example: {
        operation: 'create_table',
        tableName: 'custom_clients',
        columns: [
          { name: 'name', type: 'string', length: 180, nullable: false },
          { name: 'status', type: 'string', length: 40, nullable: false, defaultValue: 'active' }
        ]
      }
    }
  })
  previewSchema(@CurrentAuth() auth: AuthContext, @Body() body: SchemaDesignRequest) {
    return this.databaseViewer.previewSchemaChange(auth, body);
  }

  @Post('schema/apply')
  @ApiOperation({
    summary: 'Aplicar un cambio de esquema controlado',
    description:
      'Aplica DDL con QueryRunner, guarda historial en schema_changes y genera una migración TypeORM secuencial.'
  })
  @ApiBody({
    schema: {
      example: {
        operation: 'add_column',
        tableName: 'custom_clients',
        column: { name: 'phone', type: 'string', length: 60, nullable: true }
      }
    }
  })
  applySchema(@CurrentAuth() auth: AuthContext, @Body() body: SchemaDesignRequest) {
    return this.databaseViewer.applySchemaChange(auth, body);
  }

  @Get('schema/changes')
  @ApiOperation({
    summary: 'Listar historial del diseñador de DB',
    description: 'Muestra los últimos cambios de esquema generados desde la pantalla visual.'
  })
  schemaChanges(@CurrentAuth() auth: AuthContext) {
    return this.databaseViewer.schemaHistory(auth);
  }
}

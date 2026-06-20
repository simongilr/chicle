import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DatabaseViewerService } from './database-viewer.service';

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
      'Visor web minimalista y solo lectura. Filtra por tenant cuando la entidad tiene tenantId y oculta tablas no seguras.'
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
}

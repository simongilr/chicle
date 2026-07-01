import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateRecordRequest, RecordsService } from './records.service';

@Controller('records')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Records')
@ApiBearerAuth('access-token')
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Get()
  @RequirePermissions('records.read')
  @ApiOperation({ summary: 'Listar records del tenant actual' })
  findAll(@CurrentAuth() auth: AuthContext) {
    return this.records.findAll(auth);
  }

  @Get(':id')
  @RequirePermissions('records.read')
  @ApiOperation({ summary: 'Consultar un record del tenant actual' })
  async findOne(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.records.findOne(auth, id);
  }

  @Post()
  @RequirePermissions('records.create')
  @ApiOperation({ summary: 'Crear record con tenant scope e idempotency key' })
  create(@CurrentAuth() auth: AuthContext, @Body() body: CreateRecordRequest) {
    return this.records.create(auth, body);
  }
}

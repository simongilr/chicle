import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RecordEntity } from './record.entity';

@Controller('records')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Records')
@ApiBearerAuth('access-token')
export class RecordsController {
  constructor(
    @InjectRepository(RecordEntity)
    private readonly records: Repository<RecordEntity>
  ) {}

  @Get()
  @RequirePermissions('records.read')
  @ApiOperation({ summary: 'Listar records del tenant actual' })
  findAll(@CurrentAuth() auth: AuthContext) {
    return this.records.find({
      where: { tenantId: auth.tenant.id },
      order: { id: 'DESC' }
    });
  }

  @Get(':id')
  @RequirePermissions('records.read')
  @ApiOperation({ summary: 'Consultar un record del tenant actual' })
  async findOne(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    const record = await this.records.findOne({ where: { id, tenantId: auth.tenant.id } });
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    return record;
  }

  @Post()
  @RequirePermissions('records.create')
  @ApiOperation({ summary: 'Crear record con tenant scope e idempotency key' })
  create(@CurrentAuth() auth: AuthContext, @Body() body: Partial<RecordEntity>) {
    if (!body.recordType || !body.idempotencyKey || !body.data) {
      throw new BadRequestException('recordType, idempotencyKey and data are required');
    }

    return this.records.save(
      this.records.create({
        tenantId: auth.tenant.id,
        recordType: body.recordType,
        formKey: body.formKey ?? null,
        formVersion: body.formVersion ?? null,
        idempotencyKey: body.idempotencyKey,
        data: body.data,
        metadata: body.metadata ?? null
      })
    );
  }
}

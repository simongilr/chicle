import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { DynamicForm } from './dynamic-form.entity';

@Controller('forms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Forms')
@ApiBearerAuth('access-token')
export class DynamicFormsController {
  constructor(
    @InjectRepository(DynamicForm)
    private readonly forms: Repository<DynamicForm>
  ) {}

  @Get()
  @RequirePermissions('forms.read')
  @ApiOperation({ summary: 'Listar formularios del tenant actual' })
  findAll(@CurrentAuth() auth: AuthContext) {
    return this.forms.find({
      where: { tenantId: auth.tenant.id },
      order: { key: 'ASC', version: 'DESC' }
    });
  }

  @Get(':key')
  @RequirePermissions('forms.read')
  @ApiOperation({ summary: 'Consultar formulario por key en el tenant actual' })
  async findByKey(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    const form = await this.forms.findOne({
      where: { tenantId: auth.tenant.id, key },
      order: { version: 'DESC' }
    });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  @Post()
  @RequirePermissions('forms.manage')
  @ApiOperation({ summary: 'Crear formulario del tenant actual' })
  create(@CurrentAuth() auth: AuthContext, @Body() body: Partial<DynamicForm>) {
    if (!body.key || !body.title || !body.schema) {
      throw new BadRequestException('key, title and schema are required');
    }

    return this.forms.save(
      this.forms.create({
        tenantId: auth.tenant.id,
        key: body.key,
        title: body.title,
        version: body.version ?? 1,
        schema: body.schema,
        published: body.published ?? false
      })
    );
  }
}

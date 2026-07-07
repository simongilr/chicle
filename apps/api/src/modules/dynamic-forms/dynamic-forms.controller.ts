import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateDynamicFormRequest, DynamicFormsService, SubmitDynamicFormRequest } from './dynamic-forms.service';

@Controller('forms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Forms')
@ApiBearerAuth('access-token')
export class DynamicFormsController {
  constructor(private readonly dynamicForms: DynamicFormsService) {}

  @Get()
  @RequirePermissions('forms.read')
  @ApiOperation({ summary: 'Listar formularios del tenant actual' })
  findAll(@CurrentAuth() auth: AuthContext) {
    return this.dynamicForms.findAll(auth);
  }

  @Get('by-key/:key/runtime')
  @RequirePermissions('forms.read')
  @ApiOperation({ summary: 'Obtener schema runtime publicado por key' })
  runtimeByKey(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    return this.dynamicForms.runtimeByKey(auth, key);
  }

  @Post('by-key/:key/submit')
  @RequirePermissions('forms.submit')
  @ApiOperation({ summary: 'Enviar formulario por key usando el runtime seguro' })
  submitByKey(@CurrentAuth() auth: AuthContext, @Param('key') key: string, @Body() body: SubmitDynamicFormRequest) {
    return this.dynamicForms.submitByKey(auth, key, body);
  }

  @Get(':key')
  @RequirePermissions('forms.read')
  @ApiOperation({ summary: 'Consultar formulario por key en el tenant actual' })
  findByKey(@CurrentAuth() auth: AuthContext, @Param('key') key: string) {
    return this.dynamicForms.findByKey(auth, key);
  }

  @Post()
  @RequirePermissions('forms.manage')
  @ApiOperation({ summary: 'Crear formulario del tenant actual' })
  create(@CurrentAuth() auth: AuthContext, @Body() body: CreateDynamicFormRequest) {
    return this.dynamicForms.create(auth, body);
  }

  @Post(':formId/versions')
  @RequirePermissions('forms.manage')
  @ApiOperation({ summary: 'Crear versión draft desde el schema actual del formulario' })
  createVersion(@CurrentAuth() auth: AuthContext, @Param('formId') formId: string) {
    return this.dynamicForms.createVersion(auth, formId);
  }

  @Post(':formId/versions/:versionId/publish')
  @RequirePermissions('forms.publish')
  @ApiOperation({ summary: 'Publicar una versión de formulario' })
  publishVersion(
    @CurrentAuth() auth: AuthContext,
    @Param('formId') formId: string,
    @Param('versionId') versionId: string
  ) {
    return this.dynamicForms.publishVersion(auth, formId, versionId);
  }
}

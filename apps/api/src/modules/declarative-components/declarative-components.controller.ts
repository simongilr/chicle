import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { DeclarativeComponentsService } from './declarative-components.service';

@Controller('components')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Declarative Components')
@ApiBearerAuth('access-token')
export class DeclarativeComponentsController {
  constructor(private readonly declarativeComponents: DeclarativeComponentsService) {}

  @Get('registry')
  @RequirePermissions('components.read')
  @ApiOperation({ summary: 'List declarative component definitions and kit adapters' })
  registry() {
    return this.declarativeComponents.catalog();
  }

  @Post('validate')
  @RequirePermissions('components.read')
  @ApiOperation({ summary: 'Validate and normalize a declarative component contract' })
  validate(@Body() body: unknown) {
    return this.declarativeComponents.validateContract(body);
  }
}

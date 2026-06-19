import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('files')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Files')
@ApiBearerAuth('access-token')
export class FilesController {
  @Post('upload')
  @RequirePermissions('files.upload')
  @ApiOperation({ summary: 'Subir archivo o evidencia' })
  upload() {
    return {
      uploaded: false,
      note: 'StorageService implementation pending'
    };
  }

  @Get('record/:recordId')
  @RequirePermissions('files.read')
  @ApiOperation({ summary: 'Listar evidencias asociadas a un record' })
  byRecord(@Param('recordId') recordId: string) {
    return {
      recordId,
      files: []
    };
  }
}

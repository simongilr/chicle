import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantRequest } from './ai-assistant.types';

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('AI Assistant')
@ApiBearerAuth('access-token')
export class AiAssistantController {
  constructor(private readonly assistant: AiAssistantService) {}

  @Get('status')
  @RequirePermissions('ai.assistant.use')
  @ApiOperation({
    summary: 'Estado del asistente IA local-first',
    description:
      'Valida configuración, provider y modelos. No falla si Ollama está apagado; devuelve reachable=false.'
  })
  status() {
    return this.assistant.status();
  }

  @Post('chat')
  @RequirePermissions('ai.assistant.use')
  @ApiOperation({
    summary: 'Enviar mensaje al asistente IA',
    description:
      'V1 conversa contra el provider configurado. El asistente no guarda ni publica; las pantallas aplican drafts explícitamente.'
  })
  @ApiBody({
    schema: {
      example: {
        scope: 'services',
        route: '/services',
        prompt: 'Necesito un servicio para consultar usuarios por nombre o correo.',
        screenState: {
          selectedKey: 'buscar_usuario'
        }
      }
    }
  })
  chat(@CurrentAuth() auth: AuthContext, @Body() body: AiAssistantRequest) {
    return this.assistant.chat(auth, body);
  }
}

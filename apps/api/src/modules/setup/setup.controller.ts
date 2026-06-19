import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SetupService } from './setup.service';

interface SetupRequest {
  organization: string;
  email: string;
  password: string;
  template?: string;
}

interface ResetRequest {
  confirm: string;
}

@Controller('setup')
@ApiTags('Setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Consultar estado de creacion del sistema',
    description:
      'Permite distinguir entre sistema no creado, sistema listo y problemas reales de conexion.'
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        state: 'not_created',
        initialized: false,
        canRunSetup: true,
        tenantCount: 0,
        requiredAction: 'run_setup',
        seedProfile: 'blank'
      }
    }
  })
  status() {
    return this.setupService.status();
  }

  @Post()
  @ApiOperation({
    summary: 'Crear el primer tenant y usuario owner',
    description:
      'Este endpoint solo debe ejecutarse cuando /setup/status responde not_created. La pantalla setup web usa este mismo flujo.'
  })
  @ApiBody({
    schema: {
      example: {
        organization: 'Mi Empresa',
        email: 'admin@example.com',
        password: 'CambiaEstaClave123',
        template: 'blank'
      }
    }
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        tenant: { slug: 'mi-empresa', name: 'Mi Empresa', active: true },
        admin: { email: 'admin@example.com', role: 'owner' },
        next: 'login'
      }
    }
  })
  create(@Body() body: SetupRequest) {
    return this.setupService.createInitialTenant(body);
  }

  @Post('reset')
  @ApiOperation({
    summary: 'Reset local protegido para repetir pruebas de setup',
    description:
      'Solo funciona fuera de produccion cuando CHICLE_ALLOW_SYSTEM_RESET=true, CHICLE_RESET_KEY coincide y la frase de confirmacion es exacta.'
  })
  @ApiHeader({
    name: 'x-chicle-reset-key',
    required: true,
    description: 'Llave local definida en CHICLE_RESET_KEY.'
  })
  @ApiBody({
    schema: {
      example: {
        confirm: 'RESET CHICLE ENGINE'
      }
    }
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        ok: true,
        state: 'not_created',
        preserved: ['confisys', 'permissions']
      }
    }
  })
  reset(@Body() body: ResetRequest, @Headers('x-chicle-reset-key') resetKey?: string) {
    return this.setupService.resetForDevelopment(body, resetKey);
  }
}

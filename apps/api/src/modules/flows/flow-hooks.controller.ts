import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FireFlowTriggerRequest, FlowRuntimeService } from './flow-runtime.service';

@Controller('flow-hooks')
@ApiTags('Flow Hooks')
export class FlowHooksController {
  constructor(private readonly runtime: FlowRuntimeService) {}

  @Post(':tenantSlug/:triggerKey')
  @ApiOperation({ summary: 'Encolar un flow mediante webhook firmado' })
  @ApiParam({ name: 'tenantSlug', example: 'mi-organizacion' })
  @ApiParam({ name: 'triggerKey', example: 'pedido_recibido' })
  @ApiHeader({ name: 'x-chicle-hook-secret', required: true })
  @ApiHeader({ name: 'x-idempotency-key', required: false })
  @ApiBody({
    schema: {
      example: {
        input: {
          orderId: 'ORD-1001',
          total: 125
        }
      }
    }
  })
  fire(
    @Param('tenantSlug') tenantSlug: string,
    @Param('triggerKey') triggerKey: string,
    @Headers('x-chicle-hook-secret') secret: string | undefined,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Body() body: FireFlowTriggerRequest
  ) {
    return this.runtime.fireWebhook(tenantSlug, triggerKey, secret, {
      ...body,
      idempotencyKey: idempotencyKey || body.idempotencyKey
    });
  }
}

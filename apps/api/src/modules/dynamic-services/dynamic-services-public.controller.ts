import { All, Body, Controller, Headers, Param, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DynamicServicesService } from './dynamic-services.service';

interface PublicServiceRequest {
  method: string;
  query?: Record<string, unknown>;
}

@Controller('public/:tenantSlug/services')
@ApiTags('Public Dynamic Services')
export class DynamicServicesPublicController {
  constructor(private readonly dynamicServices: DynamicServicesService) {}

  @All(':serviceKey')
  @ApiOperation({
    summary: 'Execute a public dynamic service',
    description:
      'Executes only active, published services whose version explicitly enables public exposure. Security is defined by the service exposure contract.'
  })
  @ApiParam({ name: 'tenantSlug', example: 'meteoro' })
  @ApiParam({ name: 'serviceKey', example: 'public_catalog' })
  @ApiBody({
    required: false,
    schema: {
      example: {
        context: {
          key: 'client'
        }
      }
    }
  })
  executePublic(
    @Param('tenantSlug') tenantSlug: string,
    @Param('serviceKey') serviceKey: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
    @Req() request: PublicServiceRequest
  ) {
    return this.dynamicServices.executePublicByKey(tenantSlug, serviceKey, {
      method: request.method,
      headers,
      query: request.query ?? {},
      body
    });
  }
}

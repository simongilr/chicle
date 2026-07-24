import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthContext } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TranslationsService, UpsertTextBundleRequest, UpsertTranslationKeyRequest } from './translations.service';

@Controller('translations')
@ApiTags('Translations')
export class TranslationsController {
  constructor(private readonly translations: TranslationsService) {}

  @Get('namespaces')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('translations.read')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List managed text namespaces',
    description: 'Returns the translation namespaces available for the admin, generated apps, forms and screens.'
  })
  listNamespaces() {
    return this.translations.listNamespaces();
  }

  @Get('bundles/:namespace')
  @ApiOperation({
    summary: 'Get a public text bundle',
    description:
      'Returns a versioned text bundle for the UI. It is public by design and falls back to seed texts when DB tables are not available.'
  })
  @ApiParam({ name: 'namespace', example: 'admin' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        schemaVersion: 1,
        kind: 'text_bundle',
        namespace: 'admin',
        locale: 'en',
        defaultLocale: 'es',
        supportedLocales: ['es', 'en'],
        version: 'seed-admin-en-v1',
        hash: 'sha256...',
        entries: { 'nav.home': 'Home' },
        source: 'seed'
      }
    }
  })
  getBundle(@Param('namespace') namespace: string, @Query('locale') locale?: string) {
    return this.translations.getBundle(namespace, locale);
  }

  @Put('bundles/:namespace/:locale')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('translations.manage')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Publish a managed text bundle',
    description: 'Requires translations.manage. Publishes a new active bundle version for one namespace and locale.'
  })
  @ApiParam({ name: 'namespace', example: 'admin' })
  @ApiParam({ name: 'locale', example: 'en' })
  @ApiBody({
    schema: {
      example: {
        version: 'admin-en-v2',
        entries: {
          'nav.home': 'Home',
          'preferences.title': 'Admin preferences'
        }
      }
    }
  })
  upsertBundle(
    @CurrentAuth() auth: AuthContext,
    @Param('namespace') namespace: string,
    @Param('locale') locale: string,
    @Body() body: UpsertTextBundleRequest
  ) {
    return this.translations.upsertBundle(auth, namespace, locale, body);
  }

  @Post('keys')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('translations.manage')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create or update a text key across locales',
    description:
      'Requires translations.manage. Adds or updates one stable key in one or more supported locales without forcing the admin to edit a full bundle.'
  })
  @ApiBody({
    schema: {
      example: {
        namespace: 'forms.login',
        key: 'fields.email.label',
        values: {
          es: 'Correo',
          en: 'Email'
        }
      }
    }
  })
  upsertKey(@CurrentAuth() auth: AuthContext, @Body() body: UpsertTranslationKeyRequest) {
    return this.translations.upsertKey(auth, body);
  }

  @Post('missing')
  @ApiOperation({
    summary: 'Record a missing translation key',
    description: 'Public low-risk endpoint used by clients to report missing i18n keys without breaking the UI.'
  })
  recordMissing(@Body() body: { namespace?: string; locale?: string; key?: string; route?: string; context?: Record<string, unknown> }) {
    return this.translations.recordMissingKey(body);
  }
}

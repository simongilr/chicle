import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chicle Engine API')
    .setDescription(
      [
        'Documentacion interactiva para setup, autenticacion, seguridad, roles, permisos y configuracion.',
        'Flujo recomendado: consultar /setup/status, crear tenant inicial si aplica, hacer login, copiar accessToken y usar Authorize con Bearer.'
      ].join(' ')
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token devuelto por POST /api/auth/login.'
      },
      'access-token'
    )
    .addCookieAuth('chicle_refresh', {
      type: 'apiKey',
      in: 'cookie',
      description: 'Refresh cookie HttpOnly usada por POST /api/auth/refresh.'
    })
    .addTag('Setup', 'Estado inicial, creacion del primer tenant y reset local protegido.')
    .addTag('Auth', 'Login, refresh cookie, sesion actual y logout.')
    .addTag('Security / Users', 'Administracion de usuarios del tenant.')
    .addTag('Security / RBAC', 'Roles, permisos y auditoria.')
    .addTag('Confisys', 'Parametros del sistema cargados en memoria al iniciar la API.')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: 'Chicle Engine API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method'
    }
  });

  await app.listen(config.get<number>('PORT', 3000));
}

void bootstrap();

import 'reflect-metadata';
import { timingSafeEqual } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

interface BasicAuthRequest {
  headers: {
    authorization?: string;
  };
}

interface BasicAuthResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => BasicAuthResponse;
  send: (body: string) => void;
}

type NextHandler = () => void;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  setupSecurityHeaders(app, config);
  app.enableCors({
    origin: resolveCorsOrigin(config),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-chicle-reset-key', 'x-chicle-api-key']
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  setupSwagger(app, config);

  await app.listen(config.get<number>('PORT', 3000));
}

void bootstrap();

function setupSecurityHeaders(app: Awaited<ReturnType<typeof NestFactory.create>>, config: ConfigService) {
  const server = app.getHttpAdapter().getInstance() as { disable?: (name: string) => void };
  server.disable?.('x-powered-by');
  const production = config.get<string>('NODE_ENV', 'development') === 'production';

  app.use((_request: unknown, response: { setHeader: (name: string, value: string) => void }, next: NextHandler) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (production) {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
}

function resolveCorsOrigin(config: ConfigService) {
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const raw = config.get<string>('CHICLE_CORS_ORIGINS');
  if (!raw && nodeEnv === 'production') {
    throw new Error('CHICLE_CORS_ORIGINS is required in production');
  }

  if (!raw) {
    return true;
  }

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (nodeEnv === 'production' && origins.includes('*')) {
    throw new Error('CHICLE_CORS_ORIGINS cannot be "*" in production');
  }

  return origins.includes('*') ? true : origins;
}

function setupSwagger(app: Awaited<ReturnType<typeof NestFactory.create>>, config: ConfigService) {
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const explicitlyEnabled = config.get<string>('CHICLE_SWAGGER_ENABLED');
  const enabled = explicitlyEnabled ? explicitlyEnabled === 'true' : nodeEnv !== 'production';

  if (!enabled) {
    return;
  }

  if (nodeEnv === 'production') {
    assertProductionSwaggerAuth(config);
  }

  const basicUser = config.get<string>('CHICLE_SWAGGER_USER');
  const basicPassword = config.get<string>('CHICLE_SWAGGER_PASSWORD');
  if (basicUser && basicPassword) {
    app.use(['/api/docs', '/api/docs-json'], (request: BasicAuthRequest, response: BasicAuthResponse, next: NextHandler) => {
      if (isValidBasicAuth(request.headers.authorization, basicUser, basicPassword)) {
        next();
        return;
      }

      response.setHeader('WWW-Authenticate', 'Basic realm="Chicle Engine API Docs"');
      response.status(401).send('Swagger authentication required');
    });
  }

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
}

function assertProductionSwaggerAuth(config: ConfigService) {
  if (!config.get<string>('CHICLE_SWAGGER_USER') || !config.get<string>('CHICLE_SWAGGER_PASSWORD')) {
    throw new Error(
      'CHICLE_SWAGGER_USER and CHICLE_SWAGGER_PASSWORD are required when Swagger is enabled in production'
    );
  }
}

function isValidBasicAuth(header: string | undefined, expectedUser: string, expectedPassword: string) {
  if (!header?.startsWith('Basic ')) {
    return false;
  }

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator < 0) {
    return false;
  }

  const user = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);
  return safeEqual(user, expectedUser) && safeEqual(password, expectedPassword);
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

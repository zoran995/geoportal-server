import { LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ValidationException } from './common/exceptions';
import {
  HttpExceptionFilter,
  InternalServerErrorExceptionFilter,
  NotFoundExceptionFilter,
} from './common/filters';
import { WWWROOT_TOKEN } from './infrastructure/config';
import { LoggerService } from './infrastructure/logger';

/**
 *
 * PRODUCTION = 'log', 'error'
 * TESTING = 'log', 'error', 'warn'
 * DEVELOPMENT = 'log', 'error', 'warn', 'debug', 'verbose'
 */
function getLoggerLevelByEnvironment(): LogLevel[] {
  const levels: LogLevel[] = ['log', 'error'];

  if (process.env.PRODUCTION === 'true') {
    return levels;
  }

  levels.push('warn');
  if (process.env.TESTING === 'true' || process.env.NODE_ENV === 'test') {
    return levels;
  }

  levels.push('debug', 'verbose');

  return levels;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);
  logger.setLogLevels(getLoggerLevelByEnvironment());
  const compressResponse = configService.get<boolean>('compressResponse');
  if (compressResponse) {
    app.use(compression());
  }

  const trustProxy = configService.get<boolean>('trustProxy');
  if (typeof trustProxy !== 'undefined' && trustProxy !== false) {
    app.set('trust proxy', trustProxy);
  }

  // options.settings.redirectToHttps

  app.enableCors({
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    origin: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const errorMessages: Record<string, unknown> = {};
        errors.forEach((error) => {
          if (error.constraints) {
            errorMessages[error.property] = Object.values(error.constraints)
              .join('. ')
              .trim();
          }
        });
        return new ValidationException(errorMessages);
      },
    }),
  );
  const wwwroot = app.get<string>(WWWROOT_TOKEN);
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new InternalServerErrorExceptionFilter(wwwroot),
    new NotFoundExceptionFilter(configService, wwwroot),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle('Geoportal server')
    .setDescription('The geoportal server API description')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port', 3001);
  await app
    .use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src': [
              "'self'",
              "'unsafe-inline'",
              "'unsafe-eval'",
              ...(configService.get<string[]>('cspScriptSrc') || []),
            ],
            'connect-src': ['*'],
            'img-src': ['self', 'data:', '*']
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
      }),
    )
    .listen(port);
  logger.log(`started listening on port: ${port}`);
}

void bootstrap();

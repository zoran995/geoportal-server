import { LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { patchNestJsSwagger } from 'nestjs-zod';

import { AppModule } from './app.module';
import {
  HttpExceptionFilter,
  InternalServerErrorExceptionFilter,
  NotFoundExceptionFilter,
} from './common/filters';
import { WWWROOT_TOKEN } from './common/utils';
import { LoggerService } from './infrastructure/logger';
import { BasicAuthGuard } from './modules/auth/basic-auth.guard';
import { ConfigurationType } from './modules/config';

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

  const configService =
    app.get<ConfigService<ConfigurationType, true>>(ConfigService);
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);
  logger.setLogLevels(getLoggerLevelByEnvironment());
  const compressResponse = configService.get('compressResponse', {
    infer: true,
  });
  if (compressResponse) {
    app.use(compression());
  }

  const trustProxy = configService.get('trustProxy', { infer: true });
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
  const wwwroot = app.get<string>(WWWROOT_TOKEN);
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new InternalServerErrorExceptionFilter(wwwroot),
    new NotFoundExceptionFilter(configService, wwwroot),
  );

  const authGuard = app.get(BasicAuthGuard);
  app.useGlobalGuards(authGuard);

  // nestjs won't call the guard for the express static so we have to define global middleware to validate request
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (authGuard.validateRequest(req, res)) {
      next();
    }
  });

  const openApiConfig = new DocumentBuilder()
    .setTitle('Geoportal server')
    .setDescription('The geoportal server API description')
    .setVersion('0.1')
    .build();

  patchNestJsSwagger();
  const document = SwaggerModule.createDocument(app, openApiConfig, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('port', 3001, { infer: true });

  const cspConfig = configService.get('csp', { infer: true });

  await app
    .use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src': cspConfig.scriptSrc,
            'connect-src': cspConfig.connectSrc,
            'img-src': cspConfig.imgSrc,
            'frame-ancestors': cspConfig.frameAncestors,
            'frame-src': cspConfig.frameSrc,
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

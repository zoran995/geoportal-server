import { LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import compression from 'compression';
import type { Express, NextFunction, Request, Response } from 'express';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import { patchNestJsSwagger } from 'nestjs-zod';

import {
  HttpExceptionFilter,
  InternalServerErrorExceptionFilter,
  NotFoundExceptionFilter,
} from './common/filters/index.js';
import { WWWROOT_TOKEN } from './common/utils/index.js';
import { ShutdownObserver } from './infrastructure/http/shutdown-observer.js';
import { LoggerService } from './infrastructure/logger/index.js';
import { RateLimiterService } from './infrastructure/rate-limiter/index.js';
import { BasicAuthGuard } from './modules/basic-auth/index.js';
import { type IConfigurationType } from './modules/config/index.js';
import { LOG_LEVEL_TOKEN } from './infrastructure/logger/index.js';

export const buildServer = async (
  app: NestExpressApplication,
  server: Express,
) => {
  const configService =
    app.get<ConfigService<IConfigurationType, true>>(ConfigService);
  const logger = await app.resolve(LoggerService);
  const logLevels: LogLevel[] = await app.resolve(LOG_LEVEL_TOKEN);
  app.useLogger(logger);
  logger.setLogLevels(logLevels);
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
    new NotFoundExceptionFilter(
      configService.get('serveStatic', { infer: true }),
      wwwroot,
    ),
  );

  const rateLimiter = app.get(RateLimiterService);
  app.use(rateLimiter.middleware.bind(rateLimiter));

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
    .init();

  const httpsConfig = configService.get('https', { infer: true });
  const shutdownObserver = app.get(ShutdownObserver);
  const listenHost = configService.get('public', { infer: true })
    ? undefined
    : 'localhost';

  if (httpsConfig) {
    logger.log('Launching server in https mode');

    const https = (await import('https')).default;
    const httpsOptions = {
      key: readFileSync(httpsConfig.keyPath),
      cert: readFileSync(httpsConfig.certPath),
      passphrase: httpsConfig.passphrase,
    };
    const httpsServer = https
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .createServer(httpsOptions, server)
      .listen(port, listenHost);
    shutdownObserver.addHttpServer(httpsServer);
  } else {
    logger.log('Launching server in http mode');
    const http = (await import('http')).default;
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const httpServer = http.createServer(server).listen(port, listenHost);
    shutdownObserver.addHttpServer(httpServer);
  }

  logger.log(`started listening on port: ${port}`);
};

import { LogLevel, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationException } from './common/exceptions/validation.exception';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { InternalServerErrorExceptionFilter } from './common/filters/internal-server-error-exception.filter';
import { NotFoundExceptionFilter } from './common/filters/not-found-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { CustomConfigService } from './config/config.service';

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

  const configService = app.get(CustomConfigService);
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);
  logger.setLogLevels(getLoggerLevelByEnvironment());
  const compressResponse = configService.get('compressResponse');
  if (compressResponse) {
    app.use(compression());
  }

  const trustProxy = configService.get('trustProxy');
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
      exceptionFactory: (errors) => {
        const errorMessages = {};
        errors.forEach((error) => {
          errorMessages[error.property] = Object.values(error.constraints)
            .join('. ')
            .trim();
        });
        return new ValidationException(errorMessages);
      },
    }),
  );
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new InternalServerErrorExceptionFilter(configService),
    new NotFoundExceptionFilter(configService),
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

  const port = configService.get('port' || 3001);
  await app.use(helmet()).listen(port);
  logger.log(`started listening on port: ${port}`);
}

bootstrap();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { CustomConfigService } from './config/config.service';
import compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';

const logger = new LoggerService('main');
/**
 *
 * PRODUCTION = 'log', 'error'
 * TESTING = 'log', 'error', 'warn'
 * DEVELOPMENT = 'log', 'error', 'warn', 'debug', 'verbose'
 */

/* function getLoggerLevelByEnvironment(): LogLevel[] {
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
} */

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    autoFlushLogs: true,
  });

  const configService = app.get(CustomConfigService);
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);
  const compressResponse = configService.get('compressResponse');
  if (compressResponse) {
    app.use(compression());
  }

  // eventually this mime type configuration will need to change
  // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
  // var mime = express.static.mime;
  // mime.define({
  //     'application/json' : ['czml', 'json', 'geojson'],
  //     'text/plain' : ['glsl']
  // });
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
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

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

bootstrap().catch((reason: Error) => {
  logger.error(reason.message);
  logger.error(reason.stack);
});

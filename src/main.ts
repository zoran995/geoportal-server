import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';

import express from 'express';

import { AppModule } from './app.module.js';
import { buildServer } from './build-server.js';

export async function bootstrap() {
  const server = express();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
    {
      bufferLogs: true,
    },
  );

  await buildServer(app, server);

  return app;
}

void bootstrap();

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { ZodValidationPipe } from 'nestjs-zod';

import { HttpLoggerMiddleware } from './common/middleware';
import { AppHttpModule } from './infrastructure/http';
import { LoggerModule } from './infrastructure/logger';
import { AuthModule } from './modules/auth/auth.module';
import { AppConfigModule } from './modules/config';
import { FeedbackModule } from './modules/feedback';
import { InitModule } from './modules/init';
import { PingModule } from './modules/ping';
import { Proj4Module } from './modules/proj4';
import { ProxyModule } from './modules/proxy';
import { AppServeStaticModule } from './modules/serve-static';
import { ServerConfigModule } from './modules/server-config';
import { ShareModule } from './modules/share';

@Module({
  imports: [
    LoggerModule,
    AppHttpModule,
    AppConfigModule,
    AuthModule,
    InitModule,
    ShareModule,
    FeedbackModule,
    ProxyModule,
    AppServeStaticModule,
    PingModule,
    Proj4Module,
    ServerConfigModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { HttpLoggerMiddleware } from './common/middleware';
import { AppConfigModule } from './infrastructure/config';
import { AppHttpModule } from './infrastructure/http';
import { LoggerModule } from './infrastructure/logger';
import { AppServeStaticModule } from './infrastructure/serve-static';
import { FeedbackModule } from './modules/feedback';
import { InitModule } from './modules/init';
import { PingModule } from './modules/ping';
import { Proj4Module } from './modules/proj4';
import { ProxyModule } from './modules/proxy';
import { SearchModule } from './modules/search';
import { ServerConfigModule } from './modules/server-config';
import { ShareModule } from './modules/share';

@Module({
  imports: [
    LoggerModule,
    AppHttpModule,
    AppConfigModule,
    InitModule,
    ShareModule,
    FeedbackModule,
    ProxyModule,
    AppServeStaticModule,
    PingModule,
    Proj4Module,
    ServerConfigModule,
    SearchModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

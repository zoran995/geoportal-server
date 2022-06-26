import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { AppConfigModule } from './infrastructure/config/app-config.module';
import { AppHttpModule } from './infrastructure/http/app-http.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { AppServeStaticModule } from './infrastructure/serve-static/app-serve-static.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { InitModule } from './modules/init/init.module';
import { PingModule } from './modules/ping/ping.module';
import { Proj4Module } from './modules/proj4/proj4.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { ServerConfigModule } from './modules/server-config/server-config.module';
import { ShareModule } from './modules/share/share.module';

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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

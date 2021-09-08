import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { LoggerModule } from './common/logger/logger.module';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { AppConfigModule } from './config/app-config.module';
import { FeedbackModule } from './feedback/feedback.module';
import { CustomHttpModule } from './http/custom-http.module';
import { InitModule } from './init/init.module';
import { PingModule } from './ping/ping.module';
import { Proj4Module } from './proj4/proj4.module';
import { ProxyModule } from './proxy/proxy.module';
import { AppServeStaticModule } from './serve-static/app-serve-static.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [
    LoggerModule,
    CustomHttpModule,
    AppConfigModule,
    InitModule,
    ShareModule,
    FeedbackModule,
    ProxyModule,
    AppServeStaticModule,
    PingModule,
    Proj4Module,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

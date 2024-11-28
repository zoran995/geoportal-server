import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

import { ZodValidationPipe } from 'nestjs-zod';

import { HttpLoggerMiddleware } from './common/middleware';
import { AppHttpModule } from './infrastructure/http';
import { LoggerModule } from './infrastructure/logger';
import { RateLimiterModule } from './infrastructure/rate-limiter';
import { BasicAuthModule } from './modules/basic-auth';
import { AppConfigModule, type ConfigurationType } from './modules/config';
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
    RateLimiterModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        return configService.get('rateLimit', { infer: true });
      },
    }),
    BasicAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        return configService.get('basicAuthentication', { infer: true });
      },
    }),
    InitModule,
    ShareModule.forRoot({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        return configService.get('share', { infer: true });
      },
    }),
    FeedbackModule.forRoot({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        return configService.get('feedback', { infer: true });
      },
    }),
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

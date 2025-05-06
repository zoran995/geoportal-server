import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

import { ZodValidationPipe } from 'nestjs-zod';

import { HttpLoggerMiddleware } from './common/middleware/index.js';
import { AppHttpModule } from './infrastructure/http/index.js';
import { LoggerModule } from './infrastructure/logger/index.js';
import { RateLimiterModule } from './infrastructure/rate-limiter/index.js';
import { BasicAuthModule } from './modules/basic-auth/index.js';
import {
  AppConfigModule,
  type ConfigurationType,
  type IConfigurationType,
} from './modules/config/index.js';
import { FeedbackModule } from './modules/feedback/index.js';
import { InitModule } from './modules/init/index.js';
import { PingModule } from './modules/ping/index.js';
import { Proj4Module } from './modules/proj4/index.js';
import { AppServeStaticModule } from './modules/serve-static/index.js';
import { ServerConfigModule } from './modules/server-config/index.js';
import { ShareModule } from './modules/share/index.js';
import { ProxyWrapperModule } from './modules/proxy-wrapper.module.js';
import { ShutdownObserver } from './infrastructure/http/shutdown-observer.js';
import { HTTPS_OPTIONS } from './common/utils/https-options.token.js';
import { HttpsRedirectMiddleware } from './common/middleware/https-redirect.middleware.js';
import { LOG_LEVEL_TOKEN } from './infrastructure/logger/index.js';

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
    InitModule.forRoot({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<IConfigurationType, true>) => {
        return {
          initPaths: configService.get('initPaths', { infer: true }),
          shouldServeStatic: configService.get('serveStatic.serveStatic', {
            infer: true,
          }),
          configFilePath: configService.get('config-file', { infer: true }),
        };
      },
    }),
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
    ProxyWrapperModule,
    AppServeStaticModule.forRoot({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        return configService.get('serveStatic', { infer: true });
      },
    }),
    PingModule,
    Proj4Module,
    ServerConfigModule,
  ],
  providers: [
    ShutdownObserver,
    {
      provide: HTTPS_OPTIONS,
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        const httpsOptions = configService.get('https', { infer: true });
        return httpsOptions;
      },
      inject: [ConfigService],
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: LOG_LEVEL_TOKEN,
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        const logLevel = configService.get('logLevel', { infer: true });
        return logLevel;
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpsRedirectMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
      .apply(HttpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

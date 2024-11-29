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
import {
  AppConfigModule,
  type ConfigurationType,
  type IConfigurationType,
} from './modules/config';
import { FeedbackModule } from './modules/feedback';
import { InitModule } from './modules/init';
import { PingModule } from './modules/ping';
import { Proj4Module } from './modules/proj4';
import { AppServeStaticModule } from './modules/serve-static';
import { ServerConfigModule } from './modules/server-config';
import { ShareModule } from './modules/share';
import { ProxyWrapperModule } from './modules/proxy-wrapper.module';
import { ShutdownObserver } from './infrastructure/http/shutdown-observer';
import { HTTPS_OPTIONS } from './common/utils/https-options.token';
import { HttpsRedirectMiddleware } from './common/middleware/https-redirect.middleware';

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

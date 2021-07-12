import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { ConfigModule } from './config/config.module';
import { FeedbackModule } from './feedback/feedback.module';
import { HttpModule } from './http/http.module';
import { InitModule } from './init/init.module';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware';
import { ShareModule } from './share/share.module';
import { ProxyModule } from './proxy/proxy.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CustomConfigService } from './config/config.service';
import { ServeStaticDto } from './config/dto/serve-static.dto';
import { existsSync } from 'fs';
import { application } from 'express';
import { extname } from 'path';

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    HttpModule,
    InitModule,
    ShareModule,
    FeedbackModule,
    ProxyModule,
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: CustomConfigService) => {
        // set default wwwroot location
        let wwwroot = process.cwd() + '/wwwroot';
        // take the wwwroot location from config if defined
        if (configService.get<string[]>('_').length > 0) {
          wwwroot = configService.get<string[]>('_')[0];
        }
        // check if the index file actually exists so we can share. If the file
        // doesn't exist disable serve static, so we don't receive error on each
        // access.
        const serveStatic = configService.get<ServeStaticDto>('serveStatic');
        if (!existsSync(wwwroot + serveStatic.resolvePathRelativeToWwwroot)) {
          return [];
        }
        return [
          {
            rootPath: wwwroot,
            renderPath: serveStatic.resolveUnmatchedPathsWithIndexHtml
              ? '*'
              : '/',
            serveStaticOptions: {
              dotfiles: 'ignore',
              index: serveStatic.resolvePathRelativeToWwwroot,
              setHeaders: (res, path) => {
                const type = extname(path);
                if (type === '.czml' || type === '.geojson') {
                  res.header('Content-type', 'application/json');
                } else if (type === '.glsl') {
                  res.header('Content-type', 'text/plain');
                }
              },
            },
          },
        ];
      },
      inject: [CustomConfigService],
    }),
  ],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

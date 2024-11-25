import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';

import { WWWROOT_TOKEN } from 'src/common/utils';

import { AppServeStatic } from './app-serve-static';

@Module({
  imports: [
    ServeStaticModule.forRootAsync({
      useClass: AppServeStatic,
      inject: [ConfigService, WWWROOT_TOKEN],
    }),
  ],
  exports: [ServeStaticModule],
})
export class AppServeStaticModule {}

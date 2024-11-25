import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { WWWROOT_TOKEN } from 'src/common/utils';

import { ConfigLoader } from './config-loader';
import type { ConfigurationType } from './schema/configuration.schema';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ConfigLoader.load],
      isGlobal: true,
      ignoreEnvFile: true,
      ignoreEnvVars: true,
    }),
  ],
  providers: [
    {
      provide: WWWROOT_TOKEN,
      useFactory: (
        configService: ConfigService<ConfigurationType, true>,
      ): string => {
        const wwwroot = configService.get(
          'wwwroot',
          `${process.cwd()}/wwwroot`,
          {
            infer: true,
          },
        );

        return wwwroot;
      },
      inject: [ConfigService],
    },
  ],
  controllers: [],
  exports: [ConfigModule, WWWROOT_TOKEN],
})
export class AppConfigModule {}

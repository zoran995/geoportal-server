import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigLoader } from './config-loader';

export const WWWROOT_TOKEN = 'wwwroot';

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
      useFactory: (configService: ConfigService) => {
        return (
          configService.get<string>('wwwroot') ?? process.cwd() + '/wwwroot'
        );
      },
      inject: [ConfigService],
    },
  ],
  controllers: [],
  exports: [ConfigModule, WWWROOT_TOKEN],
})
export class AppConfigModule {}

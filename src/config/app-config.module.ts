import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProxyModule } from '../proxy/proxy.module';
import { configurator } from './configurator';
import { ServerConfigController } from './server-config.controller';

export const WWWROOT_TOKEN = 'wwwroot';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configurator],
      isGlobal: true,
      ignoreEnvFile: true,
      ignoreEnvVars: true,
    }),
    ProxyModule,
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
  controllers: [ServerConfigController],
  exports: [ConfigModule, WWWROOT_TOKEN],
})
export class AppConfigModule {}

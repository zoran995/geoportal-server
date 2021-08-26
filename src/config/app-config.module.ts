import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProxyModule } from 'src/proxy/proxy.module';
import { configurator } from './configurator';
import { ServerConfigController } from './server-config.controller';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configurator],
      isGlobal: true,
    }),
    ProxyModule,
  ],

  controllers: [ServerConfigController],
  exports: [ConfigModule],
})
export class AppConfigModule {}

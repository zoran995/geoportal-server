import { Module } from '@nestjs/common';
import { ServerConfigController } from './server-config.controller';
import { ProxyModule } from '../proxy/proxy.module';

export const WWWROOT_TOKEN = 'wwwroot';

@Module({
  imports: [ProxyModule],
  controllers: [ServerConfigController],
})
export class ServerConfigModule {}

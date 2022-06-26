import { Module } from '@nestjs/common';

import { ProxyModule } from '../proxy/proxy.module';
import { ServerConfigController } from './server-config.controller';

export const WWWROOT_TOKEN = 'wwwroot';

@Module({
  imports: [ProxyModule],
  controllers: [ServerConfigController],
})
export class ServerConfigModule {}

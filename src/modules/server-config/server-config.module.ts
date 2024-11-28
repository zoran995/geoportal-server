import { Module } from '@nestjs/common';

import { ProxyWrapperModule } from '../proxy-wrapper.module';
import { ServerConfigController } from './server-config.controller';

@Module({
  imports: [ProxyWrapperModule],
  controllers: [ServerConfigController],
})
export class ServerConfigModule {}

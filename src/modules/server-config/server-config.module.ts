import { Module } from '@nestjs/common';

import { ProxyWrapperModule } from '../proxy-wrapper.module.js';
import { ServerConfigController } from './server-config.controller.js';

@Module({
  imports: [ProxyWrapperModule],
  controllers: [ServerConfigController],
})
export class ServerConfigModule {}

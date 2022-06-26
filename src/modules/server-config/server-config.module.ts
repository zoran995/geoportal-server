import { Module } from '@nestjs/common';

import { ProxyModule } from '../proxy';
import { ServerConfigController } from './server-config.controller';

@Module({
  imports: [ProxyModule],
  controllers: [ServerConfigController],
})
export class ServerConfigModule {}

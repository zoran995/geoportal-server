import { HttpModule, Module } from '@nestjs/common';
import Agent, { HttpsAgent } from 'agentkeepalive';
import { ShareConfigService } from './config/share-config.service';
import { ShareServiceManager } from './share-service-manager.service';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';

const agentConfig: Agent.HttpOptions = {
  keepAlive: true,
  maxSockets: 2,
  maxFreeSockets: 2,
  timeout: 60000,
};

@Module({
  imports: [
    HttpModule.register({
      httpAgent: new Agent(agentConfig),
      httpsAgent: new HttpsAgent(agentConfig),
    }),
  ],
  controllers: [ShareController],
  providers: [ShareServiceManager, ShareService, ShareConfigService],
})
export class ShareModule {}

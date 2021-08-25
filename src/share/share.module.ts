import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import Agent, { HttpsAgent } from 'agentkeepalive';
import { POST_SIZE_LIMIT } from 'src/common/interceptor/payload-limit.interceptor';
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
  providers: [
    ShareServiceManager,
    ShareService,
    ShareConfigService,
    {
      provide: POST_SIZE_LIMIT,
      useFactory: (configService: ShareConfigService) => {
        return configService.maxRequestSize;
      },
      inject: [ShareConfigService],
    },
  ],
})
export class ShareModule {}

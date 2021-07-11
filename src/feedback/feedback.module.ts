import { HttpModule, Module } from '@nestjs/common';
import Agent, { HttpsAgent } from 'agentkeepalive';
import { FeedbackConfigService } from './config/feedback.config.service';
import { FeedbackServiceManager } from './feedback-service-manager.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

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
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackServiceManager, FeedbackConfigService],
})
export class FeedbackModule {}

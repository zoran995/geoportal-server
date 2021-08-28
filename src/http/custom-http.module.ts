import { HttpModule as BaseHttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import Agent, { HttpsAgent } from 'agentkeepalive';
import { AxiosLogInterceptor } from './axios-log-interceptors';

const agentConfig: Agent.HttpOptions = {
  keepAlive: true,
  maxSockets: 2,
  maxFreeSockets: 2,
  timeout: 60000,
};

@Global()
@Module({
  imports: [
    BaseHttpModule.register({
      httpAgent: new Agent(agentConfig),
      httpsAgent: new HttpsAgent(agentConfig),
    }),
  ],
  providers: [AxiosLogInterceptor],
  exports: [BaseHttpModule],
})
export class CustomHttpModule extends BaseHttpModule {}

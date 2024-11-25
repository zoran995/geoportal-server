import { HttpModule as BaseHttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';

import http from 'http';
import https from 'https';

import { AxiosLogInterceptor } from './axios-log-interceptors';

const agentConfig: https.AgentOptions = {
  keepAlive: true,
  maxSockets: 2,
  maxFreeSockets: 2,
  timeout: 60000,
};

@Global()
@Module({
  imports: [
    BaseHttpModule.register({
      httpAgent: new http.Agent(agentConfig),
      httpsAgent: new https.Agent(agentConfig),
    }),
  ],
  providers: [AxiosLogInterceptor],
  exports: [BaseHttpModule],
})
export class AppHttpModule extends BaseHttpModule {}

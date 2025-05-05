import { HttpModule as BaseHttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';

import got from 'got';
import http from 'http';
import https from 'https';

import { AppHttpService } from './app-http-service.js';
import { AxiosLogInterceptor } from './axios-log-interceptors.js';
import { GOT_INSTANCE_TOKEN } from './constants.js';

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
  providers: [
    {
      provide: GOT_INSTANCE_TOKEN,
      useValue: got.extend({}),
    },
    AppHttpService,
    AxiosLogInterceptor,
  ],
  exports: [BaseHttpModule, AppHttpService],
})
export class AppHttpModule {}

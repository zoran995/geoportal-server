import { Global, Module } from '@nestjs/common';

import { AppHttpService } from './app-http-service.js';
import { GOT_INSTANCE_TOKEN } from './constants.js';
import { GotLoggingInstance } from './got-log-instance.js';

@Global()
@Module({
  imports: [],
  providers: [
    GotLoggingInstance,
    {
      provide: GOT_INSTANCE_TOKEN,
      useFactory: (gotLoggingInstance: GotLoggingInstance) => {
        return gotLoggingInstance.gotInstance;
      },
      inject: [GotLoggingInstance],
    },

    AppHttpService,
  ],
  exports: [AppHttpService],
})
export class AppHttpModule {}

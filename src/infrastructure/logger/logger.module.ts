import { Global, Module } from '@nestjs/common';

import { LoggerService } from './logger.service.js';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}

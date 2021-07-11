import { Global, Logger as NestLogger, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [{ provide: NestLogger, useClass: LoggerService }],
  exports: [NestLogger],
})
export class LoggerModule {}

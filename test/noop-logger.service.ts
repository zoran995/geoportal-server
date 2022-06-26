/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import { LoggerService as NestLoggerService } from '@nestjs/common';

import { LoggerService } from 'src/common/logger/logger.service';

export class NoopLoggerService
  extends LoggerService
  implements NestLoggerService
{
  log(message: any): void {}
  error(message: any, trace?: string): void {}
  warn(message: any): void {}
  debug(message: any): void {}
  verbose(message: any): void {}
}

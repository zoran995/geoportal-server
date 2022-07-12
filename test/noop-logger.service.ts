import { LoggerService as NestLoggerService } from '@nestjs/common';

import { LoggerService } from 'src/infrastructure/logger/logger.service';

export class NoopLoggerService
  extends LoggerService
  implements NestLoggerService
{
  log(): void {
    // noop
  }
  error(): void {
    // noop
  }
  warn(): void {
    // noop
  }
  debug(): void {
    // noop
  }
  verbose(): void {
    // noop
  }
}

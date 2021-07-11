import {
  Injectable,
  Logger as NestLogger,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends NestLogger implements NestLoggerService {
  log(message: any, context?: string) {
    super.log(message, context);
  }

  error(message: any, trace?: string, context?: string) {
    super.error(message, context);
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
  }

  debug(message: any, context?: string) {
    super.debug(message, context);
  }
  verbose(message: any, context?: string) {
    super.verbose(message, context);
  }
}

import {
  ConsoleLogger,
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger implements NestLoggerService {
  log(message: unknown) {
    super.log(message);
  }

  error(message: unknown, trace?: string) {
    if (trace) {
      super.error(message, trace);
    } else {
      super.error(message);
    }
  }

  warn(message: unknown) {
    super.warn(message);
  }

  debug(message: unknown) {
    super.debug(message);
  }
  verbose(message: unknown) {
    super.verbose(message);
  }
  info(message: unknown) {
    super.log(message);
  }
}

import {
  ConsoleLogger,
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger implements NestLoggerService {
  log(message: any) {
    super.log(message);
  }

  error(message: any, trace?: string) {
    if (trace) {
      super.error(message, trace);
    } else {
      super.error(message);
    }
  }

  warn(message: any) {
    super.warn(message);
  }

  debug(message: any) {
    super.debug(message);
  }
  verbose(message: any) {
    super.verbose(message);
  }
}

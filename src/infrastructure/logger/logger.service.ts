import {
  ConsoleLogger,
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger implements NestLoggerService {}

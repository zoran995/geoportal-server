import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import type { Request, Response } from 'express';
import { LoggerService } from 'src/infrastructure/logger/index.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(protected readonly logger: LoggerService) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      this.logger.debug(
        'Headers already sent, skipping exception handling',
        GlobalExceptionFilter.name,
      );
      return;
    }
    const status =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (exception.getStatus && exception.getStatus?.() === 404) ||
      exception.statusCode === 404 ||
      exception.response?.status === 404
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

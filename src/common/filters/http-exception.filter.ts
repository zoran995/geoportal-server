import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';

import type { Request, Response } from 'express';

import { LoggerService } from 'src/infrastructure/logger/index.js';

import { ValidationException } from '../exceptions/index.js';
import { GlobalExceptionFilter } from './global-exception.filter.js';

@Catch()
export class HttpExceptionFilter extends GlobalExceptionFilter {
  constructor(protected readonly logger: LoggerService) {
    super(logger);
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    if (!(exception instanceof HttpException)) {
      super.catch(exception, host);
      return;
    }
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
      context:
        exception instanceof ValidationException
          ? exception.getResponse()
          : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

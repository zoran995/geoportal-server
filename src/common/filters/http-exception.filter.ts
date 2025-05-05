import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';

import type { Request, Response } from 'express';

import { ValidationException } from '../exceptions';
import { GlobalExceptionFilter } from './global-exception.filter';

@Catch()
export class HttpExceptionFilter extends GlobalExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    if (!(exception instanceof HttpException)) {
      return super.catch(exception, host);
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
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

import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

export function defaultExceptionResponse(
  exception: any,
  response: Response,
  request: Request,
) {
  const status =
    exception instanceof HttpException
      ? exception.getStatus()
      : exception.statusCode === 404 || exception.response?.status === 404
      ? HttpStatus.NOT_FOUND
      : HttpStatus.INTERNAL_SERVER_ERROR;

  response.status(status).json({
    statusCode: status,
    message: exception.message,
    timestamp: new Date().toISOString(),
    path: request.url,
  });
}

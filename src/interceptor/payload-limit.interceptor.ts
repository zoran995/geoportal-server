import {
  CallHandler,
  ExecutionContext,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Check the payload size and compares it with defined limit.
 * @throws {PayloadTooLargeException} - When the payload is larger the limit
 */
export function payloadLimitInterceptor(
  context: ExecutionContext,
  next: CallHandler,
  sizeLimit: number,
): Observable<any> | never {
  const ctx = context.switchToHttp();
  const request = ctx.getRequest();
  const size = request.socket.bytesRead;
  if (sizeLimit && size > sizeLimit) {
    throw new PayloadTooLargeException();
  }
  return next.handle();
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Check the payload size and compares it with defined limit.
 * @throws {PayloadTooLargeException} - When the payload is larger the limit
 */
@Injectable()
export class PayloadLimitInterceptor implements NestInterceptor {
  constructor(private readonly sizeLimit: number) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | never {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const size = request.socket.bytesRead;
    if (size > this.sizeLimit) {
      throw new PayloadTooLargeException();
    }
    return next.handle();
  }
}

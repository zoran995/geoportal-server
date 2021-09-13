import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export const POST_SIZE_LIMIT = 'POST_SIZE_LIMIT';

/**
 * Check the payload size and compares it with defined limit.
 * @throws {@link PayloadTooLargeException} - When the payload is larger the limit
 */
@Injectable()
export class PayloadLimitInterceptor implements NestInterceptor {
  constructor(
    @Inject(POST_SIZE_LIMIT) private readonly postSizeLimit: number,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | never {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const size = request.socket.bytesRead;
    if (this.postSizeLimit && size > this.postSizeLimit) {
      throw new PayloadTooLargeException();
    }
    return next.handle();
  }
}

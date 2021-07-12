import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { payloadLimitInterceptor } from '../../interceptor/payload-limit.interceptor';
import { ShareConfigService } from '../config/share-config.service';

/**
 * Check the payload size and compares it with defined limit.
 * @throws {PayloadTooLargeException} - When the payload is larger the limit
 */
@Injectable()
export class SharePayloadLimitInterceptor implements NestInterceptor {
  constructor(private readonly configService: ShareConfigService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | never {
    return payloadLimitInterceptor(
      context,
      next,
      this.configService.maxRequestSize,
    );
  }
}

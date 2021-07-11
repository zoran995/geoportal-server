import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { processHeaders } from '../utils/processHeaders';

@Injectable()
export class SetResponseHeaders implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const request = context.switchToHttp().getRequest();
        const response: Response = context.switchToHttp().getResponse();
        const maxAgeSeconds =
          response.statusCode >= 400 ? undefined : request.maxAge;
        response.header(processHeaders(response.getHeaders(), maxAgeSeconds));
      }),
    );
  }
}

import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, PayloadTooLargeException } from '@nestjs/common';
import { of } from 'rxjs';
import { payloadLimitInterceptor } from './payload-limit.interceptor';

const createExecutionContextMock = (max: number) => {
  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({
        socket: {
          bytesRead: max,
        },
      }),
    }),
  });
};

const returnData = { data: 'data' };

const next = {
  handle: () => of({ data: 'data' }),
};

describe('SizeLimitInterceptor', () => {
  const sizeLimit = 100;

  it('should block request when limit exceeded', () => {
    const mockExecutionContext = createExecutionContextMock(150);
    try {
      payloadLimitInterceptor(mockExecutionContext, next, sizeLimit);
    } catch (err) {
      expect(err).toBeInstanceOf(PayloadTooLargeException);
    }
  });

  it('should return data', (done) => {
    const mockExecutionContext = createExecutionContextMock(60);
    payloadLimitInterceptor(mockExecutionContext, next, sizeLimit).subscribe({
      next: (value) => {
        expect(value).toEqual(returnData);
      },
      error: (err) => {
        throw err;
      },
      complete: () => {
        done();
      },
    });
  });
});

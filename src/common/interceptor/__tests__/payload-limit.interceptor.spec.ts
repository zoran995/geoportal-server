import { ExecutionContext, PayloadTooLargeException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-jest';
import { of } from 'rxjs';

import { PayloadLimitInterceptor } from '../payload-limit.interceptor.js';

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

describe('PayloadLimitInterceptor', () => {
  const sizeLimit = 100;
  let interceptor: PayloadLimitInterceptor;
  beforeEach(() => {
    interceptor = new PayloadLimitInterceptor(sizeLimit);
  });
  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
  it('should block request when limit exceeded', () => {
    expect.assertions(1);
    const mockExecutionContext = createExecutionContextMock(150);
    try {
      interceptor.intercept(mockExecutionContext, next);
    } catch (err) {
      expect(err).toBeInstanceOf(PayloadTooLargeException);
    }
  });

  it('should return data', (done) => {
    const mockExecutionContext = createExecutionContextMock(60);
    interceptor.intercept(mockExecutionContext, next).subscribe({
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

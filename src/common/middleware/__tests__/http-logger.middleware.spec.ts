import type { Request } from 'express';

import { LoggerService } from 'src/infrastructure/logger/logger.service.js';

import { HttpLoggerMiddleware } from '../http-logger.middleware.js';

vi.mock(import('src/infrastructure/logger/logger.service.js'));

const reqMockObject: Partial<Request> = {
  body: 'test-body',
  params: { test: 'params' },
  query: { test: 'query' },
  originalUrl: '/test',
  protocol: 'http',
  get: vi.fn().mockReturnValue('example.com'),
};

const mockNext = vi.fn();
const mockRes = {};

describe('HttpLoggerMiddleware', () => {
  let httpLogger: HttpLoggerMiddleware;

  beforeEach(() => {
    (LoggerService as any).mockClear();
    httpLogger = new HttpLoggerMiddleware();
  });

  it('should be defined', () => {
    expect(httpLogger).toBeDefined();
  });

  it('properly logs info and calls next', () => {
    httpLogger.use(reqMockObject as any, mockRes as any, mockNext);
    expect(LoggerService).toHaveBeenCalled();
    expect((LoggerService as any).mock.instances).toHaveLength(1);
    const mockLoggerService = (LoggerService as any).mock.instances[0];

    expect(mockLoggerService.verbose.mock.calls.length).toBeGreaterThan(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});

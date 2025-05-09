import type { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock } from '@golevelup/ts-vitest';
import type { Request } from 'express';

import { POST_SIZE_LIMIT } from 'src/common/interceptor/index.js';
import { LoggerService } from 'src/infrastructure/logger/logger.service.js';
import { TestLoggerService } from 'src/infrastructure/logger/test-logger.service.js';

import { SHARE_OPTIONS } from '../share.constants.js';
import { ShareController } from '../share.controller.js';
import { ShareService } from '../share.service.js';

const mockSave = vi.fn();
const mockResolve = vi.fn();

const shareServiceMock = {
  save: mockSave,
  resolve: mockResolve,
};

describe('ShareController', () => {
  const mockExecutionContext = createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () =>
        ({
          protocol: 'http',
          path: '/api/share',
          ip: '127.0.0.1',

          headers: {
            host: 'example.co',
          },
        }) as Request,
    }),
  });

  let controller: ShareController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [ShareController],
      providers: [
        {
          provide: LoggerService,
          useClass: TestLoggerService,
        },
        {
          provide: ShareService,
          useValue: shareServiceMock,
        },
        {
          provide: POST_SIZE_LIMIT,
          useValue: 102400,
        },
        {
          provide: SHARE_OPTIONS,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ShareController>(ShareController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should properly save', async () => {
    const req = mockExecutionContext.switchToHttp().getRequest<Request>();
    mockSave.mockReturnValueOnce('testid');
    const result = await controller.create({}, req);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(result).toEqual('testid');
  });

  it('should properly resolve', async () => {
    mockResolve.mockReturnValueOnce({ data: 'data' });
    const result = await controller.resolve({ id: 'testid' });
    expect(mockResolve).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: 'data' });
  });
});

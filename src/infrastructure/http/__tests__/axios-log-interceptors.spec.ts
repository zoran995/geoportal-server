import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { AxiosLogInterceptor } from '../axios-log-interceptors.js';

const mockInterceptorRequestUse = vi.fn();
const mockInterceptorResponseUse = vi.fn();

const httpServiceMock = {
  axiosRef: {
    interceptors: {
      request: {
        use: mockInterceptorRequestUse,
      },
      response: {
        use: mockInterceptorResponseUse,
      },
    },
  },
};

describe('AxiosLogInterceptors', () => {
  let interceptor: AxiosLogInterceptor;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        AxiosLogInterceptor,
      ],
    }).compile();

    interceptor = module.get<AxiosLogInterceptor>(AxiosLogInterceptor);
    await module.init();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize', () => {
    expect(interceptor).toBeDefined();
  });

  it('should set interceptors', () => {
    expect(mockInterceptorRequestUse).toHaveBeenCalledTimes(1);
    expect(mockInterceptorResponseUse).toHaveBeenCalledTimes(1);
  });
});

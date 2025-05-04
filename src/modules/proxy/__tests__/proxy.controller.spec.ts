import { Test, TestingModule } from '@nestjs/testing';

import { POST_SIZE_LIMIT } from 'src/common/interceptor/index.js';

import { ProxyController } from '../proxy.controller.js';
import { ProxyService } from '../proxy.service.js';

const mockProxyRequest = jest.fn();
const mockProxyService = {
  proxyRequest: mockProxyRequest,
};

describe('ProxyController', () => {
  let controller: ProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: mockProxyService,
        },
        {
          provide: POST_SIZE_LIMIT,
          useValue: 102400,
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should properly call the proxy service with url and duration', () => {
    const duration = '5s';
    const url = 'http://example.com';
    controller.proxy({ url, duration });
    expect(mockProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockProxyRequest).toHaveBeenCalledWith(url, duration);
  });

  it('should properly call the proxy service with url and duration on post', () => {
    const duration = '5s';
    const url = 'http://example.com';
    controller.proxyPost({ url, duration });
    expect(mockProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockProxyRequest).toHaveBeenCalledWith(url, duration);
  });

  it('should properly call the proxy service with url', () => {
    const url = 'http://example.com';
    controller.proxyDefault({ url });
    expect(mockProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockProxyRequest).toHaveBeenCalledWith(url);
  });

  it('should properly call the proxy service with url on post', () => {
    const url = 'http://example.com';
    controller.proxyDefaultPost({ url });
    expect(mockProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockProxyRequest).toHaveBeenCalledWith(url);
  });
});

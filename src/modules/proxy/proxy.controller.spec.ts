import { Test, TestingModule } from '@nestjs/testing';

import { POST_SIZE_LIMIT } from 'src/common/interceptor/payload-limit.interceptor';

import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

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

  it('should properly call the proxy service with url and duration', async () => {
    const duration = '5s';
    const url = 'http://example.com';
    controller.proxy({ '0': url, duration: duration });
    expect(mockProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockProxyRequest).toHaveBeenCalledWith(url, duration);
  });

  it('should properly call the proxy service with url and duration on post', async () => {
    const duration = '5s';
    const url = 'http://example.com';
    controller.proxyPost({ '0': url, duration: duration });
    expect(mockProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockProxyRequest).toHaveBeenCalledWith(url, duration);
  });

  it('should properly call the proxy service with url', async () => {
    const url = 'http://example.com';
    controller.proxyDefault({ '0': url });
    expect(mockProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockProxyRequest).toHaveBeenCalledWith(url);
  });

  it('should properly call the proxy service with url on post', async () => {
    const url = 'http://example.com';
    controller.proxyDefaultPost({ '0': url });
    expect(mockProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockProxyRequest).toHaveBeenCalledWith(url);
  });
});

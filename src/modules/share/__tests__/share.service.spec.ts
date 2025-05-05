import {
  BadRequestException,
  NotFoundException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

import { createMock } from '@golevelup/ts-vitest';

import { shareGist } from '../schema/share-gist.schema.js';
import {
  shareConfig as shareConfigSchema,
  ShareConfigType,
} from '../schema/share.config.schema.js';
import { ShareServiceManager } from '../share-service-manager.service.js';
import { ShareService } from '../share.service.js';

const mockHttpPost = vi.fn();
const mockHttpGet = vi.fn();

class HttpServiceMock {
  post = mockHttpPost;
  get = mockHttpGet;
}

class LoggerServiceMock {
  log = vi.fn();
  verbose = vi.fn();
  error = vi.fn();
}

const gistConfig = shareGist.parse({
  service: 'gist',
  prefix: 'test',
  apiUrl: 'http://example.co',
  accessToken: 'test-access-token',
});

const shareConfig: ShareConfigType = shareConfigSchema.parse({
  newPrefix: 'test',
  maxRequestSize: 200,
  availablePrefixes: [gistConfig],
});

describe('ShareService', () => {
  const shareServiceManager = new ShareServiceManager(
    new HttpServiceMock() as never,
    new LoggerServiceMock() as never,
  );
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('save', () => {
    it('should throw a NotFoundException when newPrefix is not specified in config', async () => {
      const req = mockExecutionContext.switchToHttp().getRequest<Request>();
      const shareConf = { ...shareConfig, newPrefix: undefined };

      const service = new ShareService(shareConf, shareServiceManager);

      await expect(() => service.save({}, req)).rejects.toThrow();
    });

    it('should throw a NotFoundException when there is no availablePrefixes configured', async () => {
      const req = mockExecutionContext.switchToHttp().getRequest<Request>();

      await shareServiceManager.initializeProviders([]);
      const service = new ShareService(shareConfig, shareServiceManager);

      await expect(() => service.save({}, req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('properly saves', async () => {
      const req = mockExecutionContext.switchToHttp().getRequest<Request>();
      mockHttpPost.mockResolvedValue({ id: 'test-gist-id' });

      await shareServiceManager.initializeProviders([gistConfig]);
      const service = new ShareService(shareConfig, shareServiceManager);

      const shareServiceSpy = vi.spyOn(service, 'save');
      const result = await service.save({}, req);
      expect(shareServiceSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: `${shareConfig.newPrefix}-test-gist-id`,
        path: `/api/share/${shareConfig.newPrefix}-test-gist-id`,
        url: `http://example.co/api/share/${shareConfig.newPrefix}-test-gist-id`,
      });
    });
  });

  describe('resolve', () => {
    it('throws an error when id is in form prefix-id', async () => {
      mockHttpGet.mockResolvedValue({ files: [{ content: 'test content' }] });

      await shareServiceManager.initializeProviders([gistConfig]);
      const service = new ShareService(shareConfig, shareServiceManager);

      await expect(() => service.resolve('testId')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('properly resolves', async () => {
      mockHttpGet.mockResolvedValue({ files: [{ content: 'test content' }] });

      await shareServiceManager.initializeProviders([gistConfig]);
      const service = new ShareService(shareConfig, shareServiceManager);

      const result = await service.resolve('test-id');

      expect(result).toBe('test content');
    });
    it('throws a NotFoundException on unknown prefix', async () => {
      mockHttpGet.mockResolvedValue({ files: [{ content: 'test' }] });
      await shareServiceManager.initializeProviders([]);
      const service = new ShareService(shareConfig, shareServiceManager);

      await expect(() => service.resolve('test1-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

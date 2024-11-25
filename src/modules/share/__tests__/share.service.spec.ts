import { HttpService } from '@nestjs/axios';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { of } from 'rxjs';

import { POST_SIZE_LIMIT } from 'src/common/interceptor';
import { LoggerService } from 'src/infrastructure/logger';
import { TestLoggerService } from 'src/infrastructure/logger/test-logger.service';

import { shareGist } from '../config/schema/share-gist.schema';
import {
  shareConfig as shareConfigSchema,
  ShareConfigType,
} from '../config/schema/share.config.schema';
import { ShareConfigService } from '../config/share-config.service';
import { ShareServiceManager } from '../share-service-manager.service';
import { ShareService } from '../share.service';

const mockHttpPost = jest.fn();
const mockHttpGet = jest.fn();
const configGet = jest.fn();

class ConfigServiceMock {
  get = configGet;
}

class HttpServiceMock {
  post = mockHttpPost;
  get = mockHttpGet;
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
  let service: ShareService;
  let shareConfigService: ShareConfigService;
  let shareServiceManager: ShareServiceManager;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigModule, ShareService],
      providers: [
        {
          provide: ConfigService,
          useClass: ConfigServiceMock,
        },
        ShareConfigService,
        ShareServiceManager,
        ShareService,
        {
          provide: HttpService,
          useClass: HttpServiceMock,
        },
        {
          provide: POST_SIZE_LIMIT,
          useValue: 102400,
        },
        {
          provide: LoggerService,
          useClass: TestLoggerService,
        },
      ],
    }).compile();

    service = module.get(ShareService);
    shareConfigService = module.get<ShareConfigService>(ShareConfigService);
    shareServiceManager = module.get<ShareServiceManager>(ShareServiceManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    configGet.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('shareConfigService should be defined', () => {
    expect(shareConfigService).toBeDefined();
  });

  it('shareServiceManager should be defined', () => {
    expect(shareServiceManager).toBeDefined();
  });

  describe('save', () => {
    it('should throw a NotFoundException when newPrefix is not specified in config', () => {
      const shareConf = { ...shareConfig, newPrefix: undefined };
      configGet.mockReturnValue(shareConf);

      expect(() => service.save({})).rejects.toThrow();
    });

    it('should throw a NotFoundException when there is no availablePrefixes configured', async () => {
      configGet.mockReturnValue(shareConfig);

      await shareServiceManager.initializeProviders([]);

      expect(() => service.save({})).rejects.toThrow(NotFoundException);
    });

    it('properly saves', async () => {
      configGet.mockReturnValue(shareConfig);
      mockHttpPost.mockReturnValue(of({ data: { id: 'test-gist-id' } }));

      await shareServiceManager.initializeProviders([gistConfig]);

      const shareServiceSpy = jest.spyOn(service, 'save');
      const result = await service.save({});
      expect(shareServiceSpy).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(`${shareConfig.newPrefix}-test-gist-id`);
    });
  });

  describe('resolve', () => {
    it('throws an error when id is in form prefix-id', async () => {
      const data = { files: [{ content: 'test content' }] };
      configGet.mockReturnValue(shareConfig);
      mockHttpGet.mockReturnValue(of({ data }));
      await shareServiceManager.initializeProviders([gistConfig]);

      expect(() => service.resolve('testId')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('properly resolves ', async () => {
      const data = { files: [{ content: 'test content' }] };
      configGet.mockReturnValue(shareConfig);
      mockHttpGet.mockReturnValue(of({ data }));
      await shareServiceManager.initializeProviders([gistConfig]);

      const result = await service.resolve('test-id');

      expect(result).toBe('test content');
    });

    it('throws a NotFoundException on unknown prefix ', () => {
      const data = { files: [{ content: 'test' }] };
      configGet.mockReturnValue(shareConfig);
      mockHttpGet.mockReturnValue(of({ data }));

      expect(() => service.resolve('test1-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

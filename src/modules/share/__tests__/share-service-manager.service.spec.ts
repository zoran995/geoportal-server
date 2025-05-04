import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from 'src/infrastructure/logger/index.js';

import { shareGist } from '../schema/share-gist.schema.js';
import { shareS3 } from '../schema/share-s3.schema.js';
import { GistShareService } from '../providers/gist-share.service.js';
import { S3ShareService } from '../providers/s3-share.service.js';
import { ShareServiceManager } from '../share-service-manager.service.js';

const gistConf = shareGist.parse({
  service: 'gist',
  prefix: 'test',
  accessToken: 'a',
});

const gistConf2 = shareGist.parse({
  service: 'gist',
  prefix: 'test2',
  accessToken: 'a',
});

const s3Conf = shareS3.parse({
  service: 's3',
  prefix: 's3test',
  region: 'test',
  bucket: 'test',
});

const s3Conf2 = shareS3.parse({
  service: 's3',
  prefix: 's3test2',
  region: 'test',
  bucket: 'test',
});

const unknownService = {
  service: 'test-unknown',
  id: 'test',
};

const mockHttpPost = jest.fn();

describe('ShareServiceManager', () => {
  let service: ShareServiceManager;
  let httpService: HttpService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: HttpService,
          useValue: {
            post: mockHttpPost,
          },
        },
        {
          provide: LoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
        ShareServiceManager,
      ],
    }).compile();

    service = module.get<ShareServiceManager>(ShareServiceManager);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(httpService).toBeDefined();
  });

  describe('initializeProviders', () => {
    it('should initialize providers successfully', async () => {
      await service.initializeProviders([gistConf, s3Conf]);

      const gistProvider = service.getProvider(gistConf.prefix);
      const s3Provider = service.getProvider(s3Conf.prefix);

      expect(gistProvider).toBeInstanceOf(GistShareService);
      expect(s3Provider).toBeInstanceOf(S3ShareService);
      expect(service.providers.size).toBe(2);
    });

    it('should initialize multiple providers of same type with different prefixes', async () => {
      await service.initializeProviders([gistConf, gistConf2, s3Conf, s3Conf2]);

      const gistProvider = service.getProvider(gistConf.prefix);
      const gistProvider2 = service.getProvider(gistConf2.prefix);
      const s3Provider = service.getProvider(s3Conf.prefix);
      const s3Provider2 = service.getProvider(s3Conf2.prefix);

      expect(gistProvider).toBeInstanceOf(GistShareService);
      expect(gistProvider2).toBeInstanceOf(GistShareService);
      expect(s3Provider).toBeInstanceOf(S3ShareService);
      expect(s3Provider2).toBeInstanceOf(S3ShareService);
      expect(service.providers.size).toBe(4);
    });

    it('should throw error for unknown service type', async () => {
      await expect(
        service.initializeProviders([unknownService as never]),
      ).rejects.toThrow('Unknown provider type');
    });
  });

  describe('getProvider', () => {
    beforeEach(async () => {
      await service.initializeProviders([gistConf]);
    });

    it('should get provider successfully', () => {
      const provider = service.getProvider(gistConf.prefix);
      expect(provider).toBeInstanceOf(GistShareService);
    });

    it('should throw error when prefix is not provided', () => {
      expect(() => service.getProvider(undefined)).toThrow(
        'Prefix is required',
      );
    });

    it('should throw NotFoundException when provider not found', () => {
      expect(() => service.getProvider('non-existent')).toThrow(
        'Share provider non-existent not found',
      );
    });
  });
});

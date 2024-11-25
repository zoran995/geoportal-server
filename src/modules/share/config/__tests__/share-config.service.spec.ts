import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { shareConfig as shareConfigSchema } from '../schema/share.config.schema';
import { ShareConfigService } from '../share-config.service';

const shareConfig = shareConfigSchema.parse({
  newPrefix: 'test',
  maxRequestSize: 200,
  availablePrefixes: [
    {
      service: 'gist',
      prefix: 'test',
      accessToken: 'test-access-token',
    },
    {
      service: 's3',
      prefix: 'test',
      region: 'test-region',
      bucket: 'test-bucket',
      keyLength: 54,
    },
  ],
});

const configGet = jest.fn(() => {
  return shareConfig;
});

class ConfigServiceMock {
  get = configGet;
}

describe('ShareConfigService', () => {
  let service: ShareConfigService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: ConfigService,
          useClass: ConfigServiceMock,
        },
        ShareConfigService,
      ],
    }).compile();

    service = module.get<ShareConfigService>(ShareConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    configGet.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('properly resolve newPrefix', () => {
    const newPrefix = service.newPrefix;
    expect(configGet).toBeCalledTimes(1);
    expect(newPrefix).toEqual('test');
  });

  it('properly resolve max request size', () => {
    const maxRequestSize = service.maxRequestSize;
    expect(configGet).toBeCalledTimes(1);
    expect(maxRequestSize).toEqual(200 * 1024);
  });

  it('properly resolves availablePrefixes', () => {
    const prefixes = service.availablePrefixes;
    expect(configGet).toBeCalledTimes(1);
    expect(prefixes).toHaveLength(2);
    expect(prefixes).toBeDefined();
    if (prefixes) {
      expect(
        prefixes.filter((option) => option.service === 'gist'),
      ).toHaveLength(1);
      expect(prefixes.filter((option) => option.service === 's3')).toHaveLength(
        1,
      );
    }
  });
});

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { plainToClass } from 'class-transformer';

import { FeedbackConfigDto } from '../dto/feedback.config.dto';
import { FeedbackConfigService } from './feedback.config.service';

const feedbackConfig = plainToClass(FeedbackConfigDto, {
  primaryId: 'test',
  options: [
    {
      service: 'github',
      id: 'test',
      accessToken: 'test',
      issuesUrl: 'https://example.com',
    },
    {
      service: 'github',
      id: 'test-git',
      accessToken: 'test',
      issuesUrl: 'https://example.com',
    },
    {
      service: 'mail',
      id: 'test1',
      smtpHost: 'test',
      smtpPort: 25,
      issuesUrl: 'https://example.com',
      email: 'example@test.com',
    },
    {
      service: 'redmine',
      id: 'test2',
      project_id: 12,
      issuesUrl: 'https://example.com',
      username: 'test',
      password: 'test',
    },
  ],
});

const configGet = jest.fn(() => {
  return feedbackConfig;
});

class ConfigServiceMock {
  get = configGet;
}

describe('FeedbackConfigService', () => {
  let service: FeedbackConfigService;
  let configService: ConfigService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useClass: ConfigServiceMock,
        },
        FeedbackConfigService,
      ],
    }).compile();

    service = module.get<FeedbackConfigService>(FeedbackConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('configService should be defined', () => {
    expect(configService).toBeDefined();
  });

  it('properly resolves primary id', () => {
    const primaryId = service.primaryId;
    expect(configGet).toBeCalledTimes(1);
    expect(primaryId).toEqual('test');

    configGet.mockClear();
  });

  it('properly resolves feedback options', () => {
    const options = service.options;
    expect(configGet).toBeCalledTimes(1);
    expect(options).toBeDefined();
    expect(options).toHaveLength(4);
    expect(
      options?.filter((option) => option.service === 'github'),
    ).toHaveLength(2);
    expect(
      options?.filter((option) => option.service === 'redmine'),
    ).toHaveLength(1);
    expect(options?.filter((option) => option.service === 'mail')).toHaveLength(
      1,
    );

    configGet.mockClear();
  });
});

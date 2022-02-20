import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import {
  ExecutionContext,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { Observable, of } from 'rxjs';
import { LoggerModule } from '../common/logger/logger.module';
import { FeedbackConfigService } from './config/feedback.config.service';
import { FeedbackConfigDto } from './dto/feedback.config.dto';
import { FeedbackServiceManager } from './feedback-service-manager.service';
import { FeedbackService } from './feedback.service';

const feedbackConfig = plainToClass(FeedbackConfigDto, {
  primaryId: 'test',
  options: [
    {
      service: 'github',
      id: 'test',
      accessToken: 'test',
      issuesUrl: 'https://example.com',
    },
  ],
});

const mockExecutionContext = createMock<ExecutionContext>({
  switchToHttp: () => ({
    getRequest: () => ({
      ip: '127.0.0.1',
      header: () => {
        return 'test';
      },
      pipe: jest.fn(),
    }),
  }),
});
const req = mockExecutionContext.switchToHttp().getRequest();

const mockHttpPost = jest.fn();
const configGet = jest.fn();

class ConfigServiceMock {
  get = configGet;
}

describe('FeedbackService', () => {
  let service: FeedbackService;
  let feedbackConfigService: FeedbackConfigService;
  let feedbackServiceManager: FeedbackServiceManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ConfigService,
          useClass: ConfigServiceMock,
        },
        FeedbackConfigService,
        FeedbackServiceManager,
        FeedbackService,
        {
          provide: HttpService,
          useValue: {
            post: mockHttpPost,
          },
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    feedbackConfigService = module.get(FeedbackConfigService);

    feedbackServiceManager = module.get(FeedbackServiceManager);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('feedbackConfigService should be defined', () => {
    expect(feedbackConfigService).toBeDefined();
  });

  it('feedbackServiceManager should be defined', () => {
    expect(feedbackServiceManager).toBeDefined();
  });

  it('should throw a NotFoundException when no primary key', async () => {
    const feedbackConf = { ...feedbackConfig };
    feedbackConf.primaryId = undefined;
    configGet.mockReturnValue(feedbackConf);
    try {
      await service.create({}, req as any);
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
    }
  });

  it("should throw an InternalServerErrorException when corresponding feedback doesn't exist", async () => {
    const feedbackConf = { ...feedbackConfig };
    feedbackConf.primaryId = 'test1';
    configGet.mockReturnValue(feedbackConf);
    try {
      await service.create({}, req as any);
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });

  it('should reuse connection', async () => {
    configGet.mockReturnValue(feedbackConfig);
    const feedbackServiceSpy = jest.spyOn(service, 'create');
    const feedbackManagerHasSpy = jest.spyOn(feedbackServiceManager, 'has');

    const feedbackManagerGetSpy = jest.spyOn(feedbackServiceManager, 'get');
    const feedbackManagerCreateSpy = jest.spyOn(
      feedbackServiceManager,
      'register',
    );
    mockHttpPost.mockReturnValue(of(new Observable()));
    await service.create({}, req as any);

    expect(feedbackServiceSpy).toHaveBeenCalledTimes(1);
    expect(feedbackManagerHasSpy).toHaveBeenCalledTimes(1);
    expect(feedbackManagerCreateSpy).toHaveBeenCalledTimes(1);
    expect(feedbackManagerGetSpy).not.toHaveBeenCalled();

    await service.create({}, req as any);
    expect(feedbackServiceSpy).toHaveBeenCalledTimes(2);
    expect(feedbackManagerHasSpy).toHaveBeenCalledTimes(2);
    expect(feedbackManagerCreateSpy).toHaveBeenCalledTimes(1);
    expect(feedbackManagerGetSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw InternalServerErrorException when unknown service', async () => {
    const feedbackConf = { ...feedbackConfig };
    (<any>feedbackConf.options)[0].service = 'test';
    configGet.mockReturnValue(feedbackConf);
    try {
      await service.create({}, req as any);
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});

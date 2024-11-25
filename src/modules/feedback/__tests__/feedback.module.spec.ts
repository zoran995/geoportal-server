import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';

import { LoggerService } from 'src/infrastructure/logger';

import { FeedbackService } from '../common/feedback-service';
import {
  feedbackConfig,
  type FeedbackConfigType,
} from '../config/schema/feedback.config.schema';
import { feedbackServiceFactory } from '../feeback-service.factory';
import { DefaultFeedbackService } from '../providers/default-feedback.service';
import { GithubFeedbackService } from '../providers/github-feedback.service';
import { MailFeedbackService } from '../providers/mail-feedback.service';
import { RedmineFeedbackService } from '../providers/redmine-feedback.service';

describe('FeedbackModule', () => {
  let app: TestingModuleBuilder;
  const getConfigMock = jest.fn();
  beforeEach(() => {
    app = Test.createTestingModule({
      imports: [],
      providers: [
        feedbackServiceFactory,
        {
          provide: ConfigService,
          useValue: {
            get: getConfigMock,
          },
        },
        {
          provide: HttpService,
          useValue: jest.fn(),
        },
        {
          provide: LoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    });
  });

  it('should create default feedback service with default config', async () => {
    getConfigMock.mockReturnValue(feedbackConfig.parse({}));

    const module = await app.compile();

    const service = module.get(FeedbackService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(DefaultFeedbackService);
  });

  it('should create github feedback service with github config', async () => {
    getConfigMock.mockReturnValue(
      feedbackConfig.parse({
        primaryId: 'g1',
        options: [
          {
            id: 'g1',
            service: 'github',
            issuesUrl: 'https://test.com',
            accessToken: 'test',
            userAgent: 'test',
          },
        ],
      } satisfies FeedbackConfigType),
    );

    const module = await app.compile();

    const service = module.get(FeedbackService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(GithubFeedbackService);
  });

  it('should create mail feedback service with mail config', async () => {
    getConfigMock.mockReturnValue(
      feedbackConfig.parse({
        primaryId: 'm1',
        options: [
          {
            id: 'm1',
            service: 'mail',
            email: 'test@example.com',
            smtpPort: 22,
            smtpHost: 'mail.example.com',
            secure: false,
          },
        ],
      } satisfies FeedbackConfigType),
    );

    const module = await app.compile();

    const service = module.get(FeedbackService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(MailFeedbackService);
  });

  it('should create redmine feedback service with redmine config', async () => {
    getConfigMock.mockReturnValue(
      feedbackConfig.parse({
        primaryId: 'r1',
        options: [
          {
            id: 'r1',
            service: 'redmine',
            issuesUrl: 'https://test.com',
            username: 'test',
            password: 'password',
            project_id: 1,
          },
        ],
      } satisfies FeedbackConfigType),
    );

    const module = await app.compile();

    const service = module.get(FeedbackService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(RedmineFeedbackService);
  });
});

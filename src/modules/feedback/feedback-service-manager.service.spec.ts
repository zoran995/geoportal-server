import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { GithubFeedbackDto } from './dto/github-feedback.dto';
import { MailFeedbackDto } from './dto/mail-feedback.dto';
import { RedmineFeedbackDto } from './dto/redmine-feedback.dto';
import { FeedbackServiceManager } from './feedback-service-manager.service';
import { GithubFeedbackService } from './providers/github-feedback.service';
import { MailFeedbackService } from './providers/mail-feedback.service';
import { RedmineFeedbackService } from './providers/redmine-feedback.service';

const githubConf = plainToClass(GithubFeedbackDto, {
  service: 'github',
  id: 'test-git',
  accessToken: 'test',
  issuesUrl: 'https://example.com',
});
const mailConf = plainToClass(MailFeedbackDto, {
  service: 'mail',
  id: 'test-mail',
  smtpHost: 'test',
  smtpPort: 25,
  email: 'example@test.com',
});
const redmineConf = plainToClass(RedmineFeedbackDto, {
  service: 'redmine',
  id: 'test-redmine',
  project_id: 12,
  issuesUrl: 'https://example.com',
  username: 'test',
  password: 'test',
});

const unknownService = {
  service: 'test-unknown',
  id: 'test',
};

const mockHttpPost = jest.fn();

describe('FeedbackServiceManager', () => {
  let serviceManager: FeedbackServiceManager;
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
        FeedbackServiceManager,
      ],
    }).compile();

    serviceManager = module.get<FeedbackServiceManager>(FeedbackServiceManager);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(serviceManager).toBeDefined();
  });

  it('httpService should be defined', () => {
    expect(httpService).toBeDefined();
  });

  describe('github', () => {
    it('successfully create service instance and stores it', async () => {
      const feedback = serviceManager.register(githubConf);
      expect(feedback).toBeInstanceOf(GithubFeedbackService);
      expect(serviceManager.feedbackServices).toHaveLength(1);
    });

    it('keep instance stored', () => {
      const exists = serviceManager.has(githubConf.id);
      expect(exists).toBe(true);
      expect(serviceManager.feedbackServices).toHaveLength(1);
    });

    it('successfully resolve stored instance', () => {
      const feedback = serviceManager.get(githubConf.id);
      expect(feedback).toBeInstanceOf(GithubFeedbackService);
      expect(serviceManager.feedbackServices).toHaveLength(1);
    });

    it('successfully removes stored instance', () => {
      const removed = serviceManager.remove(githubConf.id);
      expect(removed).toBeTruthy();
      expect(serviceManager.feedbackServices).toHaveLength(0);
    });

    it("throws an error when getting instance of service that doesn't exist", () => {
      expect.assertions(3);
      let feedback;
      try {
        feedback = serviceManager.get(githubConf.id);
      } catch (err: any) {
        expect(feedback).toBeUndefined();
        expect(err).toBeDefined();
        expect(JSON.stringify(err.message)).toContain(githubConf.id);
      }
    });
  });

  it('successfully create service instance and stores it', async () => {
    const feedback = serviceManager.register(mailConf);
    expect(feedback).toBeInstanceOf(MailFeedbackService);
    expect(serviceManager.feedbackServices).toHaveLength(1);
  });

  it('successfully create service instance and stores it', async () => {
    const feedback = serviceManager.register(redmineConf);
    expect(feedback).toBeInstanceOf(RedmineFeedbackService);
    expect(serviceManager.feedbackServices).toHaveLength(2);
  });

  it("return false when removing service that doesn't exist", () => {
    const removed = serviceManager.remove(githubConf.id);
    expect(removed).toBe(false);
    expect(serviceManager.feedbackServices).toHaveLength(2);
  });

  it('successfully recreates service instance', () => {
    expect(serviceManager.feedbackServices).toHaveLength(2);
    const feedback = serviceManager.register(mailConf);
    expect(feedback).toBeInstanceOf(MailFeedbackService);
    expect(serviceManager.feedbackServices).toHaveLength(2);
  });

  it('throws an error on unknown service type', () => {
    expect.assertions(3);
    let feedback;
    try {
      feedback = serviceManager.register(unknownService as any);
    } catch (err: any) {
      expect(feedback).toBeUndefined();
      expect(err).toBeDefined();
      expect(JSON.stringify(err.message)).toContain(unknownService.service);
    }
  });
});

import { HttpService } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from 'src/http/http.module';
import { GithubFeedbackDto } from './dto/github-feedback.dto';
import { MailFeedbackDto } from './dto/mail-feedback.dto';
import { RedmineFeedbackDto } from './dto/redmine-feedback.dto';
import { FeedbackServiceManager } from './feedback-service-manager.service';
import { GithubFeedbackService } from './providers/github-feedback.service';
import { MailFeedbackService } from './providers/mail-feedback.service';
import { RedmineFeedbackService } from './providers/redmine-feedback.service';

const githubConf: GithubFeedbackDto = {
  service: 'github',
  id: 'test-git',
  accessToken: 'test',
  issuesUrl: 'https://example.com',
};
const mailConf: MailFeedbackDto = {
  service: 'mail',
  id: 'test-mail',
  smtpHost: 'test',
  smtpPort: 25,
  email: 'example@test.com',
};
const redmineConf: RedmineFeedbackDto = {
  service: 'redmine',
  id: 'test-redmine',
  project_id: 12,
  issuesUrl: 'https://example.com',
  username: 'test',
  password: 'test',
};

const unknownService = {
  service: 'test-unknown',
  id: 'test',
};

const mockHttpPost = jest.fn();

describe('FeedbackServiceManager', () => {
  let service: FeedbackServiceManager;
  let httpService: HttpService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
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

    service = module.get<FeedbackServiceManager>(FeedbackServiceManager);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('httpService should be defined', () => {
    expect(httpService).toBeDefined();
  });

  describe('github', () => {
    it('successfully create service instance and stores it', async () => {
      const feedback = service.create(githubConf);
      expect(feedback).toBeInstanceOf(GithubFeedbackService);
      expect(service.feedbackServices).toHaveLength(1);
    });

    it('keep instance stored', () => {
      const exists = service.has(githubConf.id);
      expect(exists).toBe(true);
      expect(service.feedbackServices).toHaveLength(1);
    });

    it('successfully resolve stored instance', () => {
      const feedback = service.get(githubConf.id);
      expect(feedback).toBeInstanceOf(GithubFeedbackService);
      expect(service.feedbackServices).toHaveLength(1);
    });

    it('successfully removes stored instance', () => {
      const removed = service.remove(githubConf.id);
      expect(removed).toBeTruthy();
      expect(service.feedbackServices).toHaveLength(0);
    });

    it("throws an error when getting instance of service that doesn't exist", () => {
      try {
        const feedback = service.get(githubConf.id);
        expect(feedback).toBeUndefined();
      } catch (err) {
        expect(err).toBeDefined();
        expect(JSON.stringify(err.message)).toContain(githubConf.id);
      }
    });
  });

  it('successfully create service instance and stores it', async () => {
    const feedback = service.create(mailConf);
    expect(feedback).toBeInstanceOf(MailFeedbackService);
    expect(service.feedbackServices).toHaveLength(1);
  });

  it('successfully create service instance and stores it', async () => {
    const feedback = service.create(redmineConf);
    expect(feedback).toBeInstanceOf(RedmineFeedbackService);
    expect(service.feedbackServices).toHaveLength(2);
  });

  it("return false when removing service that doesn't exist", () => {
    const removed = service.remove(githubConf.id);
    expect(removed).toBe(false);
    expect(service.feedbackServices).toHaveLength(2);
  });

  it('successfully recreates service instance', () => {
    expect(service.feedbackServices).toHaveLength(2);
    const feedback = service.create(mailConf);
    expect(feedback).toBeInstanceOf(MailFeedbackService);
    expect(service.feedbackServices).toHaveLength(2);
  });

  it('throws an error on unknown service type', () => {
    try {
      const feedback = service.create(unknownService as any);
      expect(feedback).toBeUndefined();
    } catch (err) {
      expect(err).toBeDefined();
      expect(JSON.stringify(err.message)).toContain(unknownService.service);
    }
  });
});

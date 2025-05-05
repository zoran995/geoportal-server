import type { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';

import { vol } from 'memfs';
import { http, HttpResponse, passthrough } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';

import { AppHttpModule } from 'src/infrastructure/http/index.js';
import {
  LoggerModule,
  LoggerService,
} from 'src/infrastructure/logger/index.js';
import { AppConfigModule } from 'src/modules/config/index.js';

import { FeedbackService } from '../common/feedback-service.js';
import { feedbackConfig } from '../config/schema/feedback.config.schema.js';
import { FeedbackModule } from '../feedback.module.js';
import { DefaultFeedbackService } from '../providers/default-feedback.service.js';
import { GithubFeedbackService } from '../providers/github-feedback.service.js';
import { MailFeedbackService } from '../providers/mail-feedback.service.js';
import { RedmineFeedbackService } from '../providers/redmine-feedback.service.js';

vi.mock('fs');

describe('FeedbackModule', () => {
  const moduleFixture = Test.createTestingModule({
    imports: [FeedbackModule, LoggerModule, AppHttpModule, AppConfigModule],
    providers: [
      {
        provide: APP_PIPE,
        useClass: ZodValidationPipe,
      },
    ],
  })
    .overrideProvider(LoggerService)
    .useValue({
      error: vi.fn(),
    });

  describe('with default config', () => {
    let app: INestApplication;

    beforeAll(async () => {
      moduleFixture.overrideModule(FeedbackModule).useModule(
        FeedbackModule.forRoot({
          useFactory: () => {
            return feedbackConfig.parse({});
          },
        }),
      );
      app = (await moduleFixture.compile()).createNestApplication();
    });

    it('should create default feedback service with default config', () => {
      const service = app.get(FeedbackService);

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DefaultFeedbackService);
    });
  });

  describe('with github config', () => {
    let app: INestApplication;

    beforeAll(async () => {
      moduleFixture.overrideModule(FeedbackModule).useModule(
        FeedbackModule.forRoot({
          useFactory: () => {
            return feedbackConfig.parse({
              primaryId: 'g1',
              options: [
                {
                  id: 'g1',
                  service: 'github',
                  issuesUrl: 'https://test.com/api/issues/url',
                  accessToken: 'test',
                },
              ],
            });
          },
        }),
      );

      app = (await moduleFixture.compile()).createNestApplication();

      app.setGlobalPrefix('api');

      await app.init();
    });

    it('should create github feedback service with github config', () => {
      const service = app.get(FeedbackService);

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(GithubFeedbackService);
    });

    it('should post feedback to github api', async () => {
      const server = setupServer(
        ...[
          http.post('*', ({ request }) => {
            if (request.url.includes('127.0.0.1')) {
              passthrough();
            }
          }),
          http.post('https://test.com/api/issues/url', () => {
            return HttpResponse.json({});
          }),
        ],
      );
      server.listen();

      await server.boundary(async () => {
        await request(app.getHttpServer())
          .post('/api/feedback')
          .send({
            title: 'feedback',
            name: 'description',
            email: 'test@example.com',
            comment: 'This long to satisfy the minimum length',
          })
          .expect(201);
      })();

      server.close();
    });

    it('should throw an error on invalid feedback data', async () => {
      const server = setupServer(
        ...[
          http.post('*', ({ request }) => {
            if (request.url.includes('127.0.0.1')) {
              passthrough();
            }
          }),
          http.post('https://test.com/api/issues/url', () => {
            return HttpResponse.json({});
          }),
        ],
      );
      server.listen();

      await server.boundary(async () => {
        await request(app.getHttpServer())
          .post('/api/feedback')
          .send({
            title: 'feedback',
            name: 'description',
            email: 'test',
            comment: 'short',
          })
          .expect(400);
      })();

      server.close();
    });

    it('should throw an error if post request fails', async () => {
      const server = setupServer(
        ...[
          http.post('*', ({ request }) => {
            if (request.url.includes('127.0.0.1')) {
              passthrough();
            }
          }),
          http.post('https://test.com/api/issues/url', () => {
            return HttpResponse.error();
          }),
        ],
      );

      server.listen();

      await server.boundary(async () => {
        await request(app.getHttpServer())
          .post('/api/feedback')
          .send({
            title: 'feedback',
            name: 'description',
            email: 'test@example.com',
            comment: 'This long to satisfy the minimum length',
          })
          .expect(500);
      })();

      server.close();
    });

    afterAll(async () => {
      vol.reset();
      await app.close();
    });
  });

  describe('with mail config', () => {
    let app: INestApplication;

    beforeAll(async () => {
      moduleFixture.overrideModule(FeedbackModule).useModule(
        FeedbackModule.forRoot({
          useFactory: () => {
            return feedbackConfig.parse({
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
            });
          },
        }),
      );

      app = (await moduleFixture.compile()).createNestApplication();
    });

    it('should create mail feedback service with mail config', () => {
      const service = app.get(FeedbackService);

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(MailFeedbackService);
    });

    afterAll(async () => {
      vol.reset();
      await app.close();
    });
  });

  describe('with redmine config', () => {
    let app: INestApplication;

    beforeAll(async () => {
      moduleFixture.overrideModule(FeedbackModule).useModule(
        FeedbackModule.forRoot({
          useFactory: () => {
            return feedbackConfig.parse({
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
            });
          },
        }),
      );

      app = (await moduleFixture.compile()).createNestApplication();
    });

    it('should create redmine feedback service with redmine config', () => {
      const service = app.get(FeedbackService);

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(RedmineFeedbackService);
    });

    afterAll(async () => {
      vol.reset();
      await app.close();
    });
  });
});

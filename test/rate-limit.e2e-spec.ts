import type { INestApplication } from '@nestjs/common';
import { type TestingModule, Test } from '@nestjs/testing';

import request from 'supertest';
import { vol } from 'memfs';

import { AppModule } from 'src/app.module.js';
import type { ConfigurationType } from 'src/modules/config/index.js';
import { RateLimiterService } from 'src/infrastructure/rate-limiter/index.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';
import { NoopLoggerService } from './helpers/noop-logger.service.js';

vi.mock('fs');

describe('Rate limit(e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    vol.fromJSON({
      './serverconfig.json': JSON.stringify({
        rateLimit: {
          points: 10,
          duration: 60,
          blockDuration: 0,
        } satisfies ConfigurationType['rateLimit'],
      }),
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useClass(NoopLoggerService)
      .compile();

    app = moduleFixture.createNestApplication();

    const rateLimiter = app.get(RateLimiterService);
    app.use(rateLimiter.middleware.bind(rateLimiter));

    await app.listen(0);
  });

  it(
    'should allow 10 requests per minute and return 200 status code',
    () =>
      new Promise((done) => {
        let count = 0;
        const agent = request(app.getHttpServer());

        const interval = setInterval(() => {
          agent
            .get('/ping')
            .expect(200)
            .end((err, res) => {
              count++;
              if (err || res.statusCode !== 200) {
                return done(err ?? new Error('Expected 200 status code'));
              }
              if (count === 10) {
                clearInterval(interval);
                done('done');
              }
            });
        }, 200);
      }),
    20_000,
  );

  it(
    'should reject requests after 10 requests and return 429 status code',
    () =>
      new Promise((done) => {
        let count = 0;
        const server = app.getHttpServer();
        const agent = request(server);
        const interval = setInterval(() => {
          agent.get('/ping').end((err, res) => {
            count++;
            if (count === 11) {
              if (res.statusCode === 429) {
                clearInterval(interval);
                return done('success');
              } else {
                return done(new Error('Expected request to be rejected'));
              }
            }
            expect(res.statusCode).toBe(200);
          });
        }, 200);
      }),
    20_000,
  );

  afterEach(async () => {
    await app.close();
  });
});

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { http, HttpResponse, passthrough } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';

import { AppHttpModule } from 'src/infrastructure/http/index.js';
import {
  LoggerModule,
  LoggerService,
} from 'src/infrastructure/logger/index.js';
import { AppConfigModule } from 'src/modules/config/index.js';

import { shareConfig } from '../schema/share.config.schema.js';
import { ShareModule } from '../share.module.js';

const handlers = [
  // we need to let local request pass through
  http.all('*', ({ request }) => {
    if (request.url.includes('127.0.0.1')) {
      return passthrough();
    }
  }),

  http.post('https://api.github.com/gists', () => {
    return HttpResponse.json({
      id: 'test-response-id',
      url: 'test-url',
    });
  }),

  http.get('https://api.github.com/gists/:gistId', ({ params }) => {
    params.gistId;
    if (params.gistId === 'test-response-id') {
      return HttpResponse.json({
        files: {
          'test-file': {
            content: {
              data: 'test-content',
            },
          },
        },
      });
    }

    return HttpResponse.json({
      files: {},
    });
  }),
];

jest.mock('fs');

export const server = setupServer(...handlers);

describe('Share Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppConfigModule,
        AppHttpModule,
        LoggerModule,
        ShareModule.forRoot({
          useFactory: () => {
            return shareConfig.parse({
              newPrefix: 'git',
              maxRequestSize: 1024 * 1024,
              availablePrefixes: [
                {
                  service: 'gist',
                  prefix: 'git',
                  apiUrl: 'https://api.github.com/gists',
                  accessToken: 'test-token',
                },
                {
                  service: 's3',
                  prefix: 's3',
                  region: 'test-region',
                  bucket: 'test-bucket',
                },
              ],
            });
          },
        }),
      ],
    })
      .overrideProvider(LoggerService)
      .useValue({
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    server.listen();
  });

  describe('POST /api/share', () => {
    const testShare = { data: 'test content' };

    it('should save share via gist provider', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/share')
        .send(testShare)
        .expect(201);

      expect(JSON.parse(response.text)).toEqual({
        id: 'git-test-response-id',
        path: '/api/share/git-test-response-id',
        url: expect.stringMatching(
          /http:\/\/127.0.0.1:\d+\/api\/share\/git-test-response-id/,
        ),
      });
    });

    it('should reject oversized payload', async () => {
      const largeShare = { data: 'x'.repeat(1024 * 1024 + 1) };

      await request(app.getHttpServer())
        .post('/api/share')
        .send(largeShare)
        .expect(413);
    });
  });

  describe('GET /api/share/:id', () => {
    it('should retrieve share via gist provider', async () => {
      await request(app.getHttpServer())
        .get('/api/share/git-test-response-id')
        .expect(200)
        .expect('Content-Type', /json/);
    });

    it('should return 404 if no files found', async () => {
      await request(app.getHttpServer())
        .get('/api/share/git-undefined')
        .expect(404);
    });

    it('should return 404 for non-existent share', async () => {
      await request(app.getHttpServer())
        .get('/api/share/test-nonexistent')
        .expect(404);
    });

    it('should return 400 for invalid share ID format', async () => {
      await request(app.getHttpServer()).get('/api/share/invalid').expect(400);
    });
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });
});

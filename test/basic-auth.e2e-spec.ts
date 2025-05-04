import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { vol } from 'memfs';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from 'src/app.module.js';
import { BasicAuthGuard } from 'src/modules/basic-auth/index.js';
import type { ConfigurationType } from 'src/modules/config/index.js';

jest.mock('fs');

describe('Basic auth', () => {
  let app: INestApplication;

  beforeAll(async () => {
    vol.fromJSON({
      './serverconfig.json': JSON.stringify({
        basicAuthentication: {
          username: 'user',
          password: 'pa\\$\\$word',
        } satisfies ConfigurationType['basicAuthentication'],
        serveStatic: {
          serveStatic: true,
          resolvePathRelativeToWwwroot: '/index.html',
          resolveUnmatchedPathsWithIndexHtml: true,
        } satisfies ConfigurationType['serveStatic'],
      }),
      './wwwroot/index.html': 'Hello world',
      './wwwroot/about.html': '<div>About</div>',
    });

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const authGuard = app.get(BasicAuthGuard);
    app.useGlobalGuards(authGuard);
    // nestjs won't call the guard for the express static so we have to define global middleware to validate request
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (authGuard.validateRequest(req, res)) {
        next();
      }
    });

    await app.init();
  });

  it('should return 401 without credentials', async () => {
    await request(app.getHttpServer()).get('/ping').expect(401);
  });

  it('should return 401 with invalid credentials', async () => {
    await request(app.getHttpServer())
      .get('/ping')
      .auth('user', 'invalid')
      .expect(401);
  });

  it('should return 200 with credentials', async () => {
    await request(app.getHttpServer())
      .get('/ping')
      .auth('user', 'pa$$word')
      .expect(200);
  });

  it('should return 401 with invalid credentials on static files', async () => {
    await request(app.getHttpServer()).get('/about.html').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});

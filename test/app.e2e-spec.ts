import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DirectoryJSON, vol } from 'memfs';
import request from 'supertest';

import { AppModule } from 'src/app.module.js';

import { NoopLoggerService } from './helpers/noop-logger.service.js';

vi.mock('fs');
vi.mock(import('src/infrastructure/logger/logger.service.js'));

const volJson: DirectoryJSON = {
  './serverconfig.json': JSON.stringify({}),
};

vol.fromJSON(volJson);

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(new NoopLoggerService());
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/ping').expect(200).expect('OK');
  });

  afterAll(async () => {
    await app.close();
  });
});

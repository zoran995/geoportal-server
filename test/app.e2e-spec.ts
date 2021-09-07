import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { NoopLoggerService } from './noop-logger.service';

jest.mock('src/common/logger/logger.service');

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

import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  LocalstackContainer,
  type StartedLocalStackContainer,
} from '@testcontainers/localstack';
import { setTimeout } from 'node:timers/promises';
import request from 'supertest';

import { AppModule } from 'src/app.module.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';
import { configuration } from 'src/modules/config/index.js';
import { ShareConfigType } from 'src/modules/share/index.js';
import { SHARE_OPTIONS } from 'src/modules/share/share.constants.js';

import { NoopLoggerService } from '../helpers/noop-logger.service.js';

// in this test we can't mock file system as it will break down the testcontainers setup and tests won't work
describe('Share Module (e2e) - S3', () => {
  let app: INestApplication;
  let localstackContainer: StartedLocalStackContainer;

  beforeAll(async () => {
    localstackContainer = await new LocalstackContainer().start();

    await setTimeout(5000);

    const client = new S3Client({
      endpoint: localstackContainer.getConnectionUri(),
      forcePathStyle: true,
      region: 'us-east-1',
      credentials: {
        secretAccessKey: 'test',
        accessKeyId: 'test',
      },
    });

    const createBucketResponse = await client.send(
      new CreateBucketCommand({ Bucket: 'sample-bucket' }),
    );
    expect(createBucketResponse.$metadata.httpStatusCode).toEqual(200);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useClass(NoopLoggerService)
      .overrideProvider(SHARE_OPTIONS)
      .useValue(
        configuration.parse({
          share: {
            newPrefix: 's3',
            maxRequestSize: 1024 * 1024,
            availablePrefixes: [
              {
                service: 's3',
                prefix: 's3',
                endpoint: localstackContainer.getConnectionUri(),
                region: 'us-east-1',
                bucket: 'sample-bucket',
                credentials: {
                  accessKeyId: 'test',
                  secretAccessKey: 'test',
                },
                keyLength: 54,
                forcePathStyle: true,
              },
            ],
          } satisfies ShareConfigType,
        }).share,
      )
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  }, 60000);

  it('should save share via s3 provider', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/share')
      .send({ data: 'test content' })
      .expect(201);

    expect(JSON.parse(response.text)).toEqual(
      expect.objectContaining({
        id: 's3-aqJr26G16vOvgbBGgrfzSYLIcy',
      }),
    );
  }, 60000);

  it('should resolve share via s3 provider', async () => {
    await request(app.getHttpServer())
      .get('/api/share/s3-aqJr26G16vOvgbBGgrfzSYLIcy')
      .expect(200, { data: 'test content' });
  }, 60000);

  afterAll(async () => {
    await app.close();
    await localstackContainer?.stop();
  });
});

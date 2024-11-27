import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  LocalstackContainer,
  type StartedLocalStackContainer,
} from '@testcontainers/localstack';
import request from 'supertest';

import { AppHttpModule } from 'src/infrastructure/http';
import { LoggerModule, LoggerService } from 'src/infrastructure/logger';
import { AppConfigModule, configuration } from 'src/modules/config';
import { ShareConfigType, ShareModule } from 'src/modules/share';

import { setTimeout } from 'timers/promises';
import { ShareConfigService } from '../../src/modules/share/config/share-config.service';
import type { INestApplication } from '@nestjs/common';
import { NoopLoggerService } from '../noop-logger.service';

describe('Share Module (e2e) - S3', () => {
  jest.setTimeout(60000);

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
      imports: [AppConfigModule, AppHttpModule, LoggerModule, ShareModule],
    })
      .overrideProvider(LoggerService)
      .useClass(NoopLoggerService)
      .overrideProvider(ShareConfigService)
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
  });

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
  });

  it('should resolve share via s3 provider', async () => {
    await request(app.getHttpServer())
      .get('/api/share/s3-aqJr26G16vOvgbBGgrfzSYLIcy')
      .expect(200, { data: 'test content' });
  });

  afterAll(async () => {
    await app.close();
    await localstackContainer?.stop();
  });
});

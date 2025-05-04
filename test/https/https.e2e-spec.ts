import { NestFactory } from '@nestjs/core';
import {
  type NestExpressApplication,
  ExpressAdapter,
} from '@nestjs/platform-express';

import { configDotenv } from 'dotenv';
import express from 'express';
import fs from 'fs';
import { Volume } from 'memfs';
import request from 'supertest';
import { IUnionFs } from 'unionfs';

import { AppModule } from 'src/app.module.js';
import { buildServer } from 'src/build-server.js';
import type { ConfigurationType } from 'src/modules/config/index.js';

jest.mock('fs', () => {
  const fs = jest.requireActual(`fs`);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const unionfs = require(`unionfs`).default;
  unionfs.reset = () => {
    unionfs.fss = [fs];
  };
  return unionfs.use(fs);
});

const fsMock: IUnionFs & { reset: () => void } = fs as never;

describe('http/https server and redirect (e2e)', () => {
  beforeAll(() => {
    configDotenv({ path: './test/https/.env-e2e' });
  });
  beforeEach(() => {
    const vol = Volume.fromJSON({
      './test/https/key.pem': process.env.KEY as string,
      './test/https/cert.pem': process.env.CERT as string,
    });
    fsMock.use(vol as never);
  });

  afterEach(() => {
    fsMock.reset();
  });

  it('should not redirect to https when https disabled', async () => {
    const vol = Volume.fromJSON({
      './serverconfig.json': JSON.stringify({
        port: 23322,
        https: undefined,
      }),
    });
    fsMock.use(vol as never);

    const server = express();
    const app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(server),
      {
        bufferLogs: true,
      },
    );

    await buildServer(app, server);
    await request(app.getHttpServer()).get('/api/serverConfig').expect(200);

    await app.close();
  });

  it('should not redirect to https when redirect not active', async () => {
    const vol = Volume.fromJSON({
      './serverconfig.json': JSON.stringify({
        port: 23322,
        https: {
          keyPath: './test/https/key.pem',
          redirectToHttps: false,
          certPath: './test/https/cert.pem',
          httpAllowedHosts: [],
        } satisfies ConfigurationType['https'],
      }),
    });
    fsMock.use(vol as never);

    const server = express();
    const app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(server),
      {
        bufferLogs: true,
      },
    );

    await buildServer(app, server);
    await request(app.getHttpServer()).get('/api/serverConfig').expect(200);

    await app.close();
  });

  it('should redirect to https when redirect active', async () => {
    const vol = Volume.fromJSON({
      './serverconfig.json': JSON.stringify({
        port: 23322,
        https: {
          keyPath: './test/https/key.pem',
          redirectToHttps: true,
          certPath: './test/https/cert.pem',
          httpAllowedHosts: [],
        } satisfies ConfigurationType['https'],
      }),
    });
    fsMock.use(vol as never);

    const server = express();
    const app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(server),
      {
        bufferLogs: true,
      },
    );

    await buildServer(app, server);
    await request(app.getHttpServer())
      .get('/api/serverConfig')
      .expect(301, /https:\/\/127.0.0.1:\d+\/api\/serverConfig/);

    await app.close();
  });

  it('should not redirect to https when host is in httpAllowedHosts', async () => {
    const vol = Volume.fromJSON({
      './serverconfig.json': JSON.stringify({
        port: 23322,
        https: {
          keyPath: './test/https/key.pem',
          redirectToHttps: true,
          certPath: './test/https/cert.pem',
          httpAllowedHosts: ['127.0.0.1'],
        } satisfies ConfigurationType['https'],
      }),
    });
    fsMock.use(vol as never);

    const server = express();
    const app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(server),
      {
        bufferLogs: true,
      },
    );
    await buildServer(app, server);

    await request(app.getHttpServer()).get('/api/serverConfig').expect(200);

    await app.close();
  });

  it('should set Strict-Transport-Security header when redirecting to https', async () => {
    const vol = Volume.fromJSON({
      './serverconfig.json': JSON.stringify({
        port: 23322,
        https: {
          keyPath: './test/https/key.pem',
          redirectToHttps: true,
          certPath: './test/https/cert.pem',
          httpAllowedHosts: [],
          strictTransportSecurity: 'max-age=200000; includeSubDomains',
        } satisfies ConfigurationType['https'],
      }),
    });
    fsMock.use(vol as never);

    const server = express();
    const app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(server),
      {
        bufferLogs: true,
      },
    );
    await buildServer(app, server);

    await request(app.getHttpServer())
      .get('/api/serverConfig')
      .expect(301, /https:\/\/127.0.0.1:\d+\/api\/serverConfig/)
      .expect('Strict-Transport-Security', 'max-age=200000; includeSubDomains');

    await app.close();
  });
});

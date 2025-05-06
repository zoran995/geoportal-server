import { Test } from '@nestjs/testing';
import { configDotenv } from 'dotenv';
import { vol } from 'memfs';
import request from 'supertest';

import { AppModule } from 'src/app.module.js';
import { LoggerService } from 'src/infrastructure/logger/logger.service.js';
import { ConfigurationType } from 'src/modules/config/index.js';
import { NoopLoggerService } from 'test/helpers/noop-logger.service.js';

vi.mock('fs');

describe('http/https server and redirect (e2e)', () => {
  beforeAll(() => {
    configDotenv({ path: './test/https/.env-e2e' });
  });

  afterEach(() => {
    vol.reset();
  });

  it('should not redirect to https when https disabled', async () => {
    vol.fromJSON({
      './test/https/key.pem': process.env.KEY!,
      './test/https/cert.pem': process.env.CERT!,
      './serverconfig.json': JSON.stringify({
        port: 23322,
        https: undefined,
      }),
    });

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useClass(NoopLoggerService)
      .compile();

    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    await request(app.getHttpServer()).get('/api/serverConfig').expect(200);

    await app.close();
  });

  it('should not redirect to https when redirect not active', async () => {
    vol.fromJSON({
      './test/https/key.pem': process.env.KEY!,
      './test/https/cert.pem': process.env.CERT!,
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

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useClass(NoopLoggerService)
      .compile();

    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    await request(app.getHttpServer()).get('/api/serverConfig').expect(200);

    await app.close();
  });

  it('should redirect to https when redirect active', async () => {
    vol.fromJSON({
      './test/https/key.pem': process.env.KEY!,
      './test/https/cert.pem': process.env.CERT!,
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

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useClass(NoopLoggerService)
      .compile();

    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/serverConfig')
      .expect(301, /https:\/\/127.0.0.1:\d+\/api\/serverConfig/);

    await app.close();
  });

  it('should not redirect to https when host is in httpAllowedHosts', async () => {
    vol.fromJSON({
      './test/https/key.pem': process.env.KEY!,
      './test/https/cert.pem': process.env.CERT!,
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

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useClass(NoopLoggerService)
      .compile();

    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    await request(app.getHttpServer()).get('/api/serverConfig').expect(200);

    await app.close();
  });

  it('should set Strict-Transport-Security header when redirecting to https', async () => {
    vol.fromJSON({
      './test/https/key.pem': process.env.KEY!,
      './test/https/cert.pem': process.env.CERT!,
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

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useClass(NoopLoggerService)
      .compile();

    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/serverConfig')
      .expect(301, /https:\/\/127.0.0.1:\d+\/api\/serverConfig/)
      .expect('Strict-Transport-Security', 'max-age=200000; includeSubDomains');

    await app.close();
  });
});

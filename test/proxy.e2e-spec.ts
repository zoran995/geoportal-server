// eslint-disable-next-line @typescript-eslint/no-var-requires
const yargs = require('yargs');

import { Controller, Get, INestApplication, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Response } from 'express';
import { DirectoryJSON, vol } from 'memfs';
import supertest from 'supertest';

import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { InternalServerErrorExceptionFilter } from 'src/common/filters/internal-server-error-exception.filter';
import { NotFoundExceptionFilter } from 'src/common/filters/not-found-exception.filter';
import { WWWROOT_TOKEN } from 'src/infrastructure/config/app-config.module';
import { LoggerService } from 'src/infrastructure/logger/logger.service';

import { ProxyConfigDto } from 'src/modules/proxy/dto/proxy-config.dto';

import { Cancel, CancelToken } from './helpers/axios-cancel';
import { NoopLoggerService } from './noop-logger.service';

// mock our logger service so there is no logs when testing
jest.mock('src/infrastructure/logger/logger.service');
jest.mock('axios');
jest.mock('fs');
const data = 'success';
const requestHeaders = {
  fakeheader: 'fakevalue',
  'Cache-Control': 'no-cache',
  'Proxy-Connection': 'delete me',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const axiosRequest: any = axios.request;

axios.Cancel = Cancel;
axios.CancelToken = CancelToken;
axiosRequest.mockImplementation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (reqConfig: InternalAxiosRequestConfig): Promise<AxiosResponse<any>> => {
    let status = 200;
    if (reqConfig.headers && 'x-give-response-status' in reqConfig.headers) {
      status = reqConfig.headers['x-give-response-status'] as unknown as number;
    }

    return Promise.resolve({
      data: data,
      status: status,
      statusText: `${status}`,
      headers: requestHeaders,
      config: reqConfig,
    });
  },
);

const openProxyConfig: Partial<ProxyConfigDto> = {
  proxyAllDomains: true,
};

const volJson: DirectoryJSON = {
  './serverconfig.json': JSON.stringify({ proxy: openProxyConfig }),
  './redirect.json': JSON.stringify({
    proxy: { proxyAllDomains: true, blacklistedAddresses: ['202.168.1.1'] },
  }),
  './redirect2.json': JSON.stringify({
    proxy: {
      allowProxyFor: ['127.0.0.1'],
      blacklistedAddresses: ['202.168.1.1'],
    },
  }),
};

vol.fromJSON(volJson);

@Controller('test')
export class TestRedirectController {
  @Get('redirect')
  redirect(@Res() res: Response) {
    return res.redirect('/test/response');
  }

  @Get('redirect2')
  redirect2(@Res() res: Response) {
    return res.redirect('http://202.168.1.1/test');
  }

  @Get('response')
  getHello(): string {
    return 'test-redirect';
  }
}

async function buildApp(configFile: string) {
  yargs(`--config-file ${configFile}`);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [TestRedirectController],
  })
    .overrideProvider(LoggerService)
    .useClass(NoopLoggerService)
    .compile();

  const app = moduleFixture.createNestApplication();
  const configService = app.get(ConfigService);
  const wwwroot = app.get(WWWROOT_TOKEN);
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new InternalServerErrorExceptionFilter(wwwroot),
    new NotFoundExceptionFilter(configService, wwwroot),
  );
  app.useLogger(new NoopLoggerService());
  await app.init();

  const agent = supertest.agent(app.getHttpServer());
  // agent.use((req) => {
  //   req.set({ 'x-client-id': 'e2e-test-client' });
  // });

  return { app, agent };
}

describe('Proxy (e2e)', () => {
  describe('/ (GET)', () => {
    doCommonTest('GET');

    describe('before redirect', () => {
      it('should follow redirect', async () => {
        const { app, agent } = await buildApp('./redirect.json');
        const { url } = agent.get('/');
        await agent.get(`/proxy/${url}test/redirect`).expect(200);

        app.close();
      });

      it('should block redirect to blacklisted host', async () => {
        const { app, agent } = await buildApp('./redirect2.json');
        const { url } = agent.get('/');
        await agent.get(`/proxy/${url}test/redirect2`).expect(403);

        app.close();
      });
    });
  });

  describe('/ (POST)', () => {
    doCommonTest('POST');
  });
});

function doCommonTest(verb: 'GET' | 'POST') {
  const methodName = verb === 'GET' ? 'get' : 'post';
  let app: INestApplication;
  let agent: ReturnType<typeof supertest.agent>;
  beforeEach(async () => {
    ({ app, agent } = await buildApp('./serverconfig.json'));
  });

  it('should proxy through to the path that is given', async () => {
    const url = 'https://example.com/blah?query=value&otherQuery=otherValue';
    await agent[methodName](`/proxy/${url}`).expect(200);
    expect(axiosRequest).toHaveBeenCalledTimes(1);
    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: verb,
        url: url,
      }),
    );
  });

  it("should add http if it isn't provided", async () => {
    const url = 'example.com/';
    await agent[methodName](`/proxy/${url}`).expect(200);
    expect(axiosRequest).toHaveBeenCalledTimes(1);
    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: verb,
        url: `http://${url}`,
      }),
    );
  });

  it("should add a trailing slash if it isn't provided", async () => {
    const url = 'example.com';
    await agent[methodName](`/proxy/${url}`).expect(200);
    expect(axiosRequest).toHaveBeenCalledTimes(1);
    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: verb,
        url: `http://${url}/`,
      }),
    );
  });

  it('should return 400 if no url is specified', async () => {
    await agent[methodName]('/proxy/').expect(400);
    expect(axiosRequest).toHaveBeenCalledTimes(0);
  });

  it('should return 400 if invalid url is specified', async () => {
    await agent[methodName]('/proxy/test').expect(400);
    expect(axiosRequest).toHaveBeenCalledTimes(0);
  });

  it('should stream back the body and headers of the request made', async () => {
    const response = await agent[methodName]('/proxy/example.com').expect(
      200,
      data,
    );
    //.expect('fakeheader', 'fakevalue');
    expect(axiosRequest).toHaveBeenCalledTimes(1);
    expect(response.headers).toHaveProperty('fakeheader');
  });

  describe('should change headers', () => {
    it('to overwrite cache-control header to two weeks if no max age is specified in req', () => {
      return agent[methodName]('/proxy/example.com')
        .expect(200, data)
        .expect('Cache-Control', 'public,max-age=1209600');
    });

    it('to filter out disallowed ones passed in req', async () => {
      await agent[methodName]('/proxy/example.com')
        .set('Proxy-Connection', 'delete me!')
        .set('unfilteredheader', "don't delete me!")
        .expect(200, data)
        .expect('Cache-Control', 'public,max-age=1209600');

      const apiCallParams = axiosRequest.mock.calls[0][0];
      expect(apiCallParams.headers).not.toHaveProperty('Proxy-Connection');
      expect(apiCallParams.headers).toHaveProperty('unfilteredheader');
    });

    it('to filter out disallowed ones that come back from the response', async () => {
      await agent[methodName]('/proxy/example.com')
        .expect(200, data)
        .expect('Cache-Control', 'public,max-age=1209600');

      const apiCallParams = axiosRequest.mock.calls[0][0];
      expect(apiCallParams.headers).not.toHaveProperty('Proxy-Connection');
    });

    it('should not set max age on error response', async () => {
      await agent[methodName]('/proxy/example.com')
        .set('x-give-response-status', '500')
        .expect(500)
        .expect('Cache-Control', 'no-cache');
    });

    describe('when specifying max age', () => {
      describe('should return 400 for', () => {
        it('a max-age specifying url with no actual url specified', async () => {
          await agent[methodName]('/proxy/_3000ms').expect(400);
          expect(axiosRequest).toHaveBeenCalledTimes(0);
        });

        it("a max-age specifying url with just '/' as a url", async () => {
          await agent[methodName]('/proxy/_3000ms/').expect(400);
          expect(axiosRequest).toHaveBeenCalledTimes(0);
        });

        it('a max-age specifying url with no actual url specified', async () => {
          await agent[methodName]('/proxy/_FUBAR/example.com').expect(400);
          expect(axiosRequest).toHaveBeenCalledTimes(0);
        });

        it('a max-age specifying url with an invalid unit for a max-age value', async () => {
          await agent[methodName]('/proxy/_3000q/example.com').expect(400);
          expect(axiosRequest).toHaveBeenCalledTimes(0);
        });
      });

      it('should properly set max age', async () => {
        await agent[methodName]('/proxy/_3000ms/example.com')
          .expect(200)
          .expect('Cache-Control', 'public,max-age=3');
        expect(axiosRequest).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app?.close();
  });
}

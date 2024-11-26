import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { vol } from 'memfs';
import { http, HttpResponse, passthrough } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';

import { AppModule } from 'src/app.module';
import { LoggerService } from 'src/infrastructure/logger/logger.service';

import { NoopLoggerService } from './noop-logger.service';
import type { ProxyConfigType } from 'src/modules/proxy/config/schema/proxy-config.dto';

jest.mock('fs');

const localRequestHandler = http.all('*', ({ request }) => {
  if (request.url.includes('127.0.0.1')) {
    return passthrough();
  }
});

const handlers = [
  localRequestHandler,

  http.all('https://example.com/redirect', () => {
    return HttpResponse.redirect('https://example.com/response');
  }),

  http.all('https://example.com/redirect2', () => {
    return HttpResponse.redirect('http://202.168.1.1/test');
  }),

  http.all('https://example.com/response', () => {
    return HttpResponse.json({ data: 'response success' });
  }),

  http.all('http://example.com/response', () => {
    return HttpResponse.json({ data: 'response success' });
  }),

  http.all('https://example.com/error', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  http.all('https://example.com', ({ request }) => {
    if (request.headers.get('Proxy-Connection')) {
      throw new Error('Proxy-Connection header should not be passed');
    }

    return HttpResponse.json(
      { data: 'response success root' },
      {
        headers: {
          fakeheader: 'fakevalue',
          'Cache-Control': 'no-cache',
          Connection: 'delete me',
          'Content-Type': 'application/json',
        },
      },
    );
  }),

  http.all('http://example.com', ({ request }) => {
    if (request.headers.get('Proxy-Connection')) {
      throw new Error('Proxy-Connection header should not be passed');
    }

    return HttpResponse.json(
      { data: 'response success root' },
      {
        headers: {
          fakeheader: 'fakevalue',
          'Cache-Control': 'no-cache',
          Connection: 'delete me',
          'Content-Type': 'application/json',
        },
      },
    );
  }),

  http.all('http://example2.com', ({ request }) => {
    if (request.headers.get('Proxy-Connection')) {
      throw new Error('Proxy-Connection header should not be passed');
    }

    return HttpResponse.json(
      { data: 'response success root' },
      {
        headers: {
          fakeheader: 'fakevalue',
          'Cache-Control': 'no-cache',
          Connection: 'delete me',
          'Content-Type': 'application/json',
        },
      },
    );
  }),
];

async function buildApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(LoggerService)
    .useClass(NoopLoggerService)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');

  app.useLogger(new NoopLoggerService());

  await app.init();

  return { app };
}

describe('Proxy (e2e)', () => {
  describe('/ (GET)', () => {
    doCommonTest('get');

    describe('before redirect', () => {
      // it('should follow redirect', async () => {
      //   vol.fromJSON({
      //     './serverconfig.json': JSON.stringify({
      //       proxy: {
      //         proxyAllDomains: true,
      //         blacklistedAddresses: ['202.168.1.1'],
      //       },
      //     }),
      //   });
      //   const { app } = await buildApp();
      //   const { url } = request(app.getHttpServer()).get('/');
      //   await agent.get(`/proxy/${url}test/redirect`).expect(200);
      //   app.close();
      // });
      // it('should block redirect to blacklisted host', async () => {
      //   const { app, agent } = await buildApp('./redirect2.json');
      //   const { url } = agent.get('/');
      //   await agent.get(`/proxy/${url}test/redirect2`).expect(403);
      //   app.close();
      // });
    });
  });

  describe('/ (POST)', () => {
    doCommonTest('post');
  });
});

function doCommonTest(methodName: 'get' | 'post') {
  describe('default config', () => {
    let app: INestApplication;
    const server = setupServer(...handlers);

    beforeAll(async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({}),
      });

      ({ app } = await buildApp());

      server.listen({
        onUnhandledRequest: 'error',
      });
    });

    it('should not allow proxy by default', () => {
      return request(app.getHttpServer())
        [methodName]('/api/proxy/example.com')
        .expect(403);
    });

    afterAll(async () => {
      await app?.close();
      server.close();
    });
  });
  describe('simple config', () => {
    let app: INestApplication;
    const server = setupServer(...handlers);

    beforeAll(async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            blacklistedAddresses: ['202.168.1.1'],
          },
        }),
      });

      ({ app } = await buildApp());

      server.listen({
        onUnhandledRequest: 'error',
      });
    });

    it('should proxy through to the path that is given', async () => {
      const url = 'https://example.com/response';

      await request(app.getHttpServer())
        [methodName](`/api/proxy/${url}`)
        .expect(200, { data: 'response success' });
    });

    it("should add protocol if it isn't provided", async () => {
      const url = 'example.com/response';
      await request(app.getHttpServer())
        [methodName](`/api/proxy/${url}`)
        .expect(200, { data: 'response success' });
    });

    it('should proxy to just domain', async () => {
      const url = 'example.com';

      await request(app.getHttpServer())
        [methodName](`/api/proxy/${url}`)
        .expect(200, { data: 'response success root' });
    });

    it('should return 400 if no url is specified', async () => {
      await request(app.getHttpServer())[methodName]('/api/proxy/').expect(400);
    });

    it('should return 400 if invalid url is specified', async () => {
      await request(app.getHttpServer())
        [methodName]('/api/proxy/test')
        .expect(400);
    });

    it('should stream back the body and headers of the request made', async () => {
      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com')
        .expect(200, { data: 'response success root' })
        .expect('fakeheader', 'fakevalue');
    });

    describe('should change headers', () => {
      it('to overwrite cache-control header to two weeks if no max age is specified in req', () => {
        return request(app.getHttpServer())
          [methodName]('/api/proxy/example.com')
          .expect(200, { data: 'response success root' })
          .expect('Cache-Control', 'public,max-age=1209600');
      });

      it('to filter out disallowed ones passed in req', async () => {
        await request(app.getHttpServer())
          [methodName]('/api/proxy/example.com')
          .set('Proxy-Connection', 'delete me!')
          .set('unfilteredheader', "don't delete me!")
          .expect(200, { data: 'response success root' })
          .expect('Cache-Control', 'public,max-age=1209600');
      });

      it('to filter out disallowed ones that come back from the response', async () => {
        const response = await request(app.getHttpServer())
          [methodName]('/api/proxy/example.com')
          .expect(200, { data: 'response success root' })
          .expect('Cache-Control', 'public,max-age=1209600');

        expect(response.headers['Connection']).not.toBeDefined();
      });

      it('should not set max age on error response', async () => {
        await request(app.getHttpServer())
          [methodName]('/api/proxy/https://example.com/error')
          .expect(500);
      });
    });

    describe('when specifying max age', () => {
      describe('should return 400 for', () => {
        it('a max-age specifying url with no actual url specified', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_3000ms')
            .expect(400);
        });

        it("a max-age specifying url with just '/' as a url", async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_3000ms/')
            .expect(400);
        });

        it('a max-age specifying url with invalid max age value', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_FUBAR/example.com')
            .expect(400);
        });

        it('a max-age specifying url with an invalid unit for a max-age value', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_3000q/example.com')
            .expect(400);
        });
      });

      describe('should properly interpret max age', () => {
        it('ms (millisecond)', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_3000ms/example.com')
            .expect(200)
            .expect('Cache-Control', 'public,max-age=3');
        });

        it('s (second)', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_3s/example.com')
            .set('Cache-Control', 'no-cache')
            .expect(200)
            .expect('Cache-Control', 'public,max-age=3');
        });

        it('m (minute)', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_2m/example.com')
            .set('Cache-Control', 'no-cache')
            .expect(200)
            .expect('Cache-Control', 'public,max-age=120');
        });

        it('h (hour)', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_2h/example.com')
            .set('Cache-Control', 'no-cache')
            .expect(200)
            .expect('Cache-Control', 'public,max-age=7200');
        });

        it('d (day)', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_2d/example.com')
            .set('Cache-Control', 'no-cache')
            .expect(200)
            .expect('Cache-Control', 'public,max-age=172800');
        });

        it('w (week)', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_2w/example.com')
            .set('Cache-Control', 'no-cache')
            .expect(200)
            .expect('Cache-Control', 'public,max-age=1209600');
        });

        it('y (year)', async () => {
          await request(app.getHttpServer())
            [methodName]('/api/proxy/_2y/example.com')
            .set('Cache-Control', 'no-cache')
            .expect(200)
            .expect('Cache-Control', 'public,max-age=63072000');
        });
      });
    });

    afterAll(async () => {
      await app?.close();
      server.close();
    });
  });

  describe('with an upstream proxy', () => {
    const server = setupServer(...handlers);

    beforeAll(() => {
      server.listen({
        onUnhandledRequest: 'error',
      });
    });

    it.skip('should proxy through upstream proxy', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            upstreamProxy: 'http://proxy/',
            proxyAllDomains: true,
            blacklistedAddresses: ['202.168.1.1'],
          },
        }),
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/example.com')
        .expect(200);

      await app.close();
    });

    it('is not used when host is in bypassUpstreamProxyHosts', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            upstreamProxy: 'http://proxy/',
            bypassUpstreamProxyHosts: { 'example.com': true },
            proxyAllDomains: true,
            blacklistedAddresses: ['202.168.1.1'],
          },
        }),
      });

      const { app } = await buildApp();
      await request(app.getHttpServer())
        [methodName]('/api/proxy/example.com')
        .expect(200);
      request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/response')
        .expect(200, { data: 'response success' });

      await app.close();
    });

    it.skip('is still used when bypassUpstreamProxyHosts is defined but host is not in it', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            upstreamProxy: 'http://proxy/',
            bypassUpstreamProxyHosts: { 'example2.com': true },
            proxyAllDomains: true,
            blacklistedAddresses: ['202.168.1.1'],
          },
        }),
      });

      const { app } = await buildApp();
      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/blah')
        .expect(200);

      await app.close();
    });

    afterAll(() => {
      server.close();
    });
  });

  describe('when specifying an allowed list of domains to proxy', function () {
    const server = setupServer(...handlers);

    beforeAll(() => {
      server.listen({
        onUnhandledRequest: 'error',
      });
    });

    it('should proxy a domain on that list', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
          },
        }),
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/example.com/response')
        .expect(200, { data: 'response success' });
    });

    it('should block a domain not on that list', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
          },
        }),
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/example2.com/blah')
        .expect(403);
    });

    it('should not block a domain on the list if proxyAllDomains is true', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
          },
        }),
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/example2.com')
        .expect(200);
    });

    afterAll(() => {
      server.close();
    });
  });

  describe('when domain has basic authentication specified', function () {
    it('should set an auth header for that domain', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            proxyAuth: {
              'example.com': {
                authorization: 'blahfaceauth',
              },
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/auth', ({ request }) => {
            if (request.headers.get('Authorization') !== 'blahfaceauth') {
              return HttpResponse.error();
            }

            return HttpResponse.json({ data: 'response success' });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/auth')
        .expect(200, { data: 'response success' });

      await app.close();
      server.close();
    });

    it('should not set auth headers for other domains', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            // allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            proxyAuth: {
              'example2.com': {
                authorization: 'blahfaceauth',
              },
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/auth', ({ request }) => {
            if (request.headers.get('authorization')) {
              return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json({ data: 'response success' });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/auth')
        .expect(200, { data: 'response success' });

      await app.close();
      server.close();
    });

    it('should set other headers for that domain', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            proxyAuth: {
              'example.com': {
                authorization: 'blahfaceauth',
                headers: [{ name: 'X-Test-Header', value: 'testvalue' }],
              },
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/auth', ({ request }) => {
            if (
              !request.headers.get('authorization') ||
              request.headers.get('X-Test-Header') !== 'testvalue'
            ) {
              return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json({ data: 'properly set header and auth' });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/auth')
        .expect(200, { data: 'properly set header and auth' });

      await app.close();
      server.close();
    });
  });

  describe('append query params', function () {
    it('append params to the querystring for a specified domain', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            appendParamToQueryString: {
              'example.com': [
                {
                  regexPattern: '.',
                  params: {
                    foo: 'bar',
                  },
                },
              ],
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com', ({ request }) => {
            const url = new URL(request.url);
            if (url.searchParams.get('foo') !== 'bar') {
              return HttpResponse.error();
            }

            return HttpResponse.json({
              data: 'have set search params foo=bar',
            });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com')
        .expect(200, { data: 'have set search params foo=bar' });

      await app.close();
      server.close();
    });

    it('append params to the querystring for a specified domain using specified regex', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            appendParamToQueryString: {
              'example.com': [
                {
                  regexPattern: 'something',
                  params: {
                    foo: 'bar',
                  },
                },
              ],
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/something/else', ({ request }) => {
            const url = new URL(request.url);
            if (url.searchParams.get('foo') !== 'bar') {
              return HttpResponse.error();
            }

            return HttpResponse.json({
              data: 'have set search params foo=bar',
            });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/something/else')
        .expect(200, { data: 'have set search params foo=bar' });

      await app.close();
      server.close();
    });

    it('no params appended when mismatch in regex', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            appendParamToQueryString: {
              'example.com': [
                {
                  regexPattern: 'something',
                  params: {
                    foo: 'bar',
                  },
                },
              ],
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/nothing/else', ({ request }) => {
            const url = new URL(request.url);
            if (url.searchParams.get('foo')) {
              return HttpResponse.error();
            }

            return HttpResponse.json({
              data: 'have not set search params foo=bar',
            });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/nothing/else')
        .expect(200, { data: 'have not set search params foo=bar' });

      await app.close();
      server.close();
    });

    it('no params appended when mismatch in regex', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            appendParamToQueryString: {
              'example.com': [
                {
                  regexPattern: 'something',
                  params: {
                    foo: 'bar',
                  },
                },
                {
                  regexPattern: 'nothing',
                  params: {
                    yep: 'works',
                  },
                },
              ],
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/nothing/else', ({ request }) => {
            const url = new URL(request.url);
            if (
              url.searchParams.get('foo') ||
              url.searchParams.get('yep') !== 'works'
            ) {
              return HttpResponse.error();
            }

            return HttpResponse.json({
              data: 'have set search params yep=works',
            });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/nothing/else')
        .expect(200, { data: 'have set search params yep=works' });

      await app.close();
      server.close();
    });

    it('no params appended when mismatch in regex', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            appendParamToQueryString: {
              'example.com': [
                {
                  regexPattern: '.',
                  params: {
                    foo: 'bar',
                    another: 'val',
                  },
                },
              ],
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/nothing/else', ({ request }) => {
            const url = new URL(request.url);
            if (
              url.searchParams.get('foo') !== 'bar' ||
              url.searchParams.get('another') !== 'val'
            ) {
              return HttpResponse.error();
            }

            return HttpResponse.json({
              data: 'have set search params foo=bar and another=val',
            });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/nothing/else')
        .expect(200, {
          data: 'have set search params foo=bar and another=val',
        });

      await app.close();
      server.close();
    });

    it('no params appended when mismatch in regex', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            appendParamToQueryString: {
              'example.com': [
                {
                  regexPattern: '.',
                  params: {
                    foo: 'bar',
                  },
                },
              ],
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/something', ({ request }) => {
            const url = new URL(request.url);
            if (
              url.searchParams.get('foo') !== 'bar' ||
              url.searchParams.get('already') !== 'here'
            ) {
              return HttpResponse.error();
            }

            return HttpResponse.json({
              data: 'have extended search params with foo=bar',
            });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/something?already=here')
        .expect(200, {
          data: 'have extended search params with foo=bar',
        });

      await app.close();
      server.close();
    });

    it('no params appended when mismatch in regex', async () => {
      vol.fromJSON({
        './serverconfig.json': JSON.stringify({
          proxy: {
            proxyAllDomains: true,
            allowProxyFor: ['example.com'],
            blacklistedAddresses: ['202.168.1.1'],
            appendParamToQueryString: {
              'example2.com': [
                {
                  regexPattern: '.',
                  params: {
                    foo: 'bar',
                  },
                },
              ],
            },
          } satisfies Partial<ProxyConfigType>,
        }),
      });

      const server = setupServer(
        ...[
          localRequestHandler,
          http.all('https://example.com/something', ({ request }) => {
            const url = new URL(request.url);
            if (
              url.searchParams.get('foo') ||
              url.searchParams.get('already') !== 'here'
            ) {
              return HttpResponse.error();
            }

            return HttpResponse.json({
              data: 'haven\t set search params',
            });
          }),
        ],
      );

      server.listen({
        onUnhandledRequest: 'error',
      });

      const { app } = await buildApp();

      await request(app.getHttpServer())
        [methodName]('/api/proxy/https://example.com/something?already=here')
        .expect(200, {
          data: 'haven\t set search params',
        });

      await app.close();
      server.close();
    });
  });
}

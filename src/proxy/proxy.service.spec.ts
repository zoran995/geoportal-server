import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { when } from 'jest-when';
import { of, throwError } from 'rxjs';
import { POST_SIZE_LIMIT } from '../common/interceptor/payload-limit.interceptor';
import { ProxyConfigService } from './config/proxy-config.service';
import { ProxyConfigDto } from './dto/proxy-config.dto';
import { ProxyService } from './proxy.service';
import { ProxyListService } from './utils/proxy-list.service';

const requestData: any = {
  method: 'GET',
  protocol: 'http',
  headers: { hostname: '127.0.0.1' },
};
const defaultProxyConfig: { proxy: ProxyConfigDto } = {
  proxy: new ProxyConfigDto(),
};
defaultProxyConfig.proxy.allowProxyFor = ['example.com'];
defaultProxyConfig.proxy.blacklistedAddresses = ['192.163.0.1'];
const mockHttpRequest = jest.fn();
const mockHttpGet = jest.fn();
const mockHttpPost = jest.fn();

const mockConfigGet = jest.fn();

class ConfigServiceMock {
  get = mockConfigGet;
}

const httpServiceMock = {
  request: mockHttpRequest,
  get: mockHttpGet,
  post: mockHttpPost,
};

async function initService(request: Record<string, any> = requestData) {
  const module = await Test.createTestingModule({
    providers: [
      { provide: ConfigService, useClass: ConfigServiceMock },
      { provide: POST_SIZE_LIMIT, useValue: 102400 },
      { provide: REQUEST, useValue: request },
      ProxyConfigService,
      ProxyListService,
      ProxyService,
      { provide: HttpService, useValue: httpServiceMock },
    ],
  }).compile();
  return module.resolve(ProxyService);
}

async function prepareRequest(
  url: string,
  params?: {
    duration?: string;
    headers: Record<string, any>;
  },
) {
  const reqData = { ...requestData };
  reqData.headers = { ...reqData.headers, ...params?.headers };
  reqData.url = url;
  return initService(reqData);
}

async function sendRequest(
  url: string,
  params?: {
    duration?: string;
    headers: Record<string, any>;
  },
) {
  const service = await prepareRequest(url, params);
  await service.proxyRequest(url, params?.duration);
}

describe('ProxyService', () => {
  const url = 'https://example.com/blah?query=value&otherQuery=otherValue';
  beforeEach(async () => {
    when(mockConfigGet)
      .calledWith('proxy')
      .mockReturnValue(defaultProxyConfig.proxy);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should properly initialize service', async () => {
    const service = await initService();
    expect(service).toBeDefined();
  });

  it('should proxy and properly use defaults', async () => {
    mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
    await sendRequest(url);
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url,
        proxy: undefined,
        data: undefined,
        maxBodyLength: 102400,
        beforeRedirect: expect.any(Function),
        onHttpSocketEvent: expect.any(Function),
      }),
    );
  });

  it('should fix target url', async () => {
    const url = '/example.com/';
    const badUrl = `https:${url}`;
    mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
    await sendRequest(badUrl);
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `https:/${url}`,
      }),
    );
  });

  it("should add http if it isn't provided", async () => {
    const url = 'example.com/';
    mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
    await sendRequest(url);
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `http://${url}`,
      }),
    );
  });

  it("should add a trailing slash if it isn't provided", async () => {
    const url = 'example.com';
    mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
    await sendRequest(url);
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `http://${url}/`,
      }),
    );
  });

  it('blocks a domain not on allowedProxy list ', async () => {
    try {
      await sendRequest('http://example2.com');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
    }
    expect(mockHttpRequest).toHaveBeenCalledTimes(0);
  });

  it('should not block a domain if proxyAllDomains is true', async () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.proxyAllDomains = true;
    proxyConf.allowProxyFor = ['example2.com'];
    when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
    mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
    await sendRequest(url);
    expect(mockHttpRequest).toHaveBeenCalledTimes(1);
  });

  it('should block address on blacklist', async () => {
    try {
      await sendRequest('http://192.163.0.1:8080/test');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(mockHttpRequest).toHaveBeenCalledTimes(0);
    }
  });

  it('should block address on blacklist even when proxyAllDomains is true', async () => {
    try {
      await sendRequest('http://192.163.0.1:8080/test');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(mockHttpRequest).toHaveBeenCalledTimes(0);
    }
  });

  describe('authorization header', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should delete authorization header when using basic auth on server', async () => {
      const authorizationHeader = {
        username: 'test',
        password: 'test',
      };
      when(mockConfigGet)
        .calledWith('basicAuthentication')
        .mockReturnValue(authorizationHeader);
      const service = await prepareRequest(url);
      const spyDeleteAuthorizationHeader = jest.spyOn(
        service as any,
        'deleteAuthorizationHeader',
      );
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      await service.proxyRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      expect(spyDeleteAuthorizationHeader).toHaveBeenCalledTimes(1);
    });

    it('should not call delete authorization header', async () => {
      when(mockConfigGet)
        .calledWith('basicAuthentication')
        .mockReturnValue(undefined);
      const service = await prepareRequest(url);
      const spyDeleteAuthorizationHeader = jest.spyOn(
        service as any,
        'deleteAuthorizationHeader',
      );
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      await service.proxyRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      expect(spyDeleteAuthorizationHeader).not.toHaveBeenCalled();
    });
  });

  describe('upstream proxy', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('used when one is specified', async () => {
      const proxy = 'http://proxy/';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.upstreamProxy = proxy;
      mockConfigGet.mockClear();
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          proxy: proxy,
          method: 'GET',
        }),
      );
    });

    it('non used when none is specified', async () => {
      const proxy = undefined;
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.upstreamProxy = proxy;
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          proxy: undefined,
          method: 'GET',
        }),
      );
    });

    it('not used when host is in bypassUpstreamProxyHosts', async () => {
      const proxy = 'http://proxy/';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.upstreamProxy = proxy;
      proxyConf.bypassUpstreamProxyHosts = new Map();
      proxyConf.bypassUpstreamProxyHosts.set('example.com', true);
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          proxy: undefined,
          method: 'GET',
        }),
      );
    });

    it('still used when bypassUpstreamProxyHosts is defined but host is not in it', async () => {
      const proxy = 'http://proxy/';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.upstreamProxy = proxy;
      proxyConf.bypassUpstreamProxyHosts = new Map();
      proxyConf.bypassUpstreamProxyHosts.set('example2.com', true);
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          proxy: proxy,
          method: 'GET',
        }),
      );
    });
  });

  describe('specifying an domain basic authention', () => {
    it('should set auth header for that domain', async () => {
      const auth = {
        authorization: 'testauth',
      };
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.proxyAuth = {
        'example.com': auth,
      };
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining(auth),
          method: 'GET',
        }),
      );
    });

    it('should not set auth headers for other domains', async () => {
      const auth = {
        authorization: 'testauth',
      };
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.proxyAuth = {
        'example2.com': auth,
      };
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining(auth),
          method: 'GET',
        }),
      );
    });

    it('should try again without auth when ForbiddenException', async () => {
      const auth = {
        authorization: 'testauth',
      };
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.proxyAuth = {
        'example.com': auth,
      };
      mockHttpRequest
        .mockReturnValueOnce(throwError(() => new ForbiddenException()))
        .mockReturnValueOnce(of({ data: 'success' }));
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledTimes(2);
      expect(mockHttpRequest).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          headers: { ...requestData.headers, ...auth },
          method: 'GET',
        }),
      );
      expect(mockHttpRequest).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          headers: { ...requestData.headers },
          method: 'GET',
        }),
      );
    });

    it('should not try again without auth when another exception', async () => {
      const auth = {
        authorization: 'testauth',
      };
      try {
        const proxyConf = { ...defaultProxyConfig.proxy };
        proxyConf.proxyAuth = {
          'example.com': auth,
        };
        mockHttpRequest.mockReturnValueOnce(
          throwError(() => new NotFoundException()),
        );
        when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
        await sendRequest(url);

        expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(mockHttpRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: { ...requestData.headers, ...auth },
            method: 'GET',
          }),
        );
      }
    });

    it('should first try with auth specified in request', async () => {
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));
      const reqHeaders = {
        authorization: 'request-auth',
      };
      await sendRequest(url, { headers: reqHeaders });
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { ...requestData.headers, ...reqHeaders },
          method: 'GET',
        }),
      );
    });

    it('should first try with auth specified in request and then proxy auth', async () => {
      const auth = {
        authorization: 'testauth',
      };
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.proxyAuth = {
        'example.com': auth,
      };
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest
        .mockReturnValueOnce(throwError(() => new ForbiddenException()))
        .mockReturnValueOnce(of({ data: 'success' }));
      const reqHeaders = {
        authorization: 'request-auth',
      };
      await sendRequest(url, { headers: reqHeaders });
      expect(mockHttpRequest).toHaveBeenCalledTimes(2);
      expect(mockHttpRequest).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          headers: { ...requestData.headers, ...auth },
          method: 'GET',
        }),
      );
    });

    it('should first try with auth specified in request and then proxy auth and then without auth', async () => {
      const auth = {
        authorization: 'testauth',
      };
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.proxyAuth = {
        'example.com': auth,
      };
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest
        .mockReturnValueOnce(throwError(() => new ForbiddenException()))
        .mockReturnValueOnce(throwError(() => new ForbiddenException()))
        .mockReturnValueOnce(of({ data: 'success' }));
      const reqHeaders = {
        authorization: 'request-auth',
      };
      await sendRequest(url, { headers: reqHeaders });
      expect(mockHttpRequest).toHaveBeenCalledTimes(3);
      expect(mockHttpRequest).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          headers: { ...requestData.headers, ...auth },
          method: 'GET',
        }),
      );
      expect(mockHttpRequest).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          headers: { ...requestData.headers },
          method: 'GET',
        }),
      );
    });
  });

  describe('when domain has other headers specified', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should set the header for that domain', async () => {
      const headers = [
        {
          name: 'Secret-Key',
          value: 'ABCDE12345',
        },
        {
          name: 'Another-Header',
          value: 'XYZ',
        },
      ];
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.proxyAuth = {
        'example.com': {
          headers: headers,
        },
      };
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Secret-Key': 'ABCDE12345',
            'Another-Header': 'XYZ',
          }),
          method: 'GET',
        }),
      );
    });

    it('should not set the headers for other domains', async () => {
      const headers = [
        {
          name: 'Secret-Key',
          value: 'ABCDE12345',
        },
        {
          name: 'Another-Header',
          value: 'XYZ',
        },
      ];
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.proxyAuth = {
        'example2.com': {
          headers: headers,
        },
      };
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining(headers),
          method: 'GET',
        }),
      );
    });
  });

  describe('append param to query', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should append params for specified domain', async () => {
      const proxyUrl = 'example.com';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.appendParamToQueryString = new Map<string, any>();
      proxyConf.appendParamToQueryString.set('example.com', [
        {
          regexPattern: '.',
          params: {
            foo: 'bar',
          },
        },
      ]);
      mockConfigGet.mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.searchParams.get('foo')).toBe('bar');
    });

    it('should append params for specified domain using specified regex', async () => {
      const proxyUrl = 'example.com/something/else';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.appendParamToQueryString = new Map<string, any>();
      proxyConf.appendParamToQueryString.set('example.com', [
        {
          regexPattern: 'something',
          params: {
            foo: 'bar',
          },
        },
      ]);
      mockConfigGet.mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.searchParams.get('foo')).toBe('bar');
    });

    it('no params appended when mismatch in regex', async () => {
      const proxyUrl = 'example.com/nothing/else';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.appendParamToQueryString = new Map<string, any>();
      proxyConf.appendParamToQueryString.set('example.com', [
        {
          regexPattern: 'something',
          params: {
            foo: 'bar',
          },
        },
      ]);

      mockConfigGet.mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.searchParams.get('foo')).toBeNull();
    });

    it('propperly interpret regex when multiple params specified', async () => {
      const proxyUrl = 'example.com/nothing/else';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.appendParamToQueryString = new Map<string, any>();
      proxyConf.appendParamToQueryString.set('example.com', [
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
      ]);

      mockConfigGet.mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.searchParams.get('foo')).toBeNull();
      expect(hitUrl.searchParams.get('yep')).toBe('works');
    });

    it('propperly interpret regex when multiple params specified', async () => {
      const proxyUrl = 'example.com';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.appendParamToQueryString = new Map<string, any>();
      proxyConf.appendParamToQueryString.set('example.com', [
        {
          regexPattern: '.',
          params: {
            foo: 'bar',
            another: 'val',
          },
        },
      ]);

      mockConfigGet.mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.search).toBe('?foo=bar&another=val');
    });

    it('should combine with existing query', async () => {
      const query = '?already=here';
      const proxyUrl = `example.com${query}`;
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.appendParamToQueryString = new Map<string, any>();
      proxyConf.appendParamToQueryString.set('example.com', [
        {
          regexPattern: '.',
          params: {
            foo: 'bar',
          },
        },
      ]);

      mockConfigGet.mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.search).toBe(`${query}&foo=bar`);
    });

    it("doesn't append params to the querystring for other domains", async () => {
      const proxyUrl = 'example.com?already=here';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.appendParamToQueryString = new Map<string, any>();
      proxyConf.appendParamToQueryString.set('example2.com', [
        {
          regexPattern: '.',
          params: {
            foo: 'bar',
          },
        },
      ]);

      mockConfigGet.mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(of({ data: 'success' }));

      await sendRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.search).toBe('?already=here');
    });
  });

  describe('properly handle error responses from requests', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('interpret NotFoundException exception', async () => {
      mockHttpRequest.mockReturnValueOnce(
        throwError(() => new NotFoundException()),
      );
      try {
        await sendRequest(url);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });

    it('catch ECONNREFUSED', async () => {
      mockHttpRequest.mockReturnValueOnce(
        throwError(() => ({
          code: 'ECONNREFUSED',
          message: 'ECONNREFUSED',
        })),
      );
      try {
        await sendRequest(url);
      } catch (err) {
        expect(mockHttpRequest).toHaveBeenCalledTimes(1);
        expect(err).toBeInstanceOf(BadGatewayException);
      }
    });

    it('catch error status and message', async () => {
      mockHttpRequest.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 400,
          },
          message: 'test-BadRequest-status',
        })),
      );
      try {
        await sendRequest(url);
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(400);
        expect(err.message).toBe('test-BadRequest-status');
      }
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
    });

    it('catch error statusCode and message', async () => {
      mockHttpRequest.mockReturnValueOnce(
        throwError(() => ({
          response: {
            statusCode: 400,
          },
          message: 'test-BadRequest-statusCode',
        })),
      );
      try {
        await sendRequest(url);
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(400);
        expect(err.message).toBe('test-BadRequest-statusCode');
      }
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
    });

    it('should skip when status code is incorrect', async () => {
      mockHttpRequest.mockReturnValueOnce(
        throwError(() => ({
          response: {
            statusCode: 450,
          },
          message: 'test-badStatusCode',
        })),
      );
      try {
        await sendRequest(url);
      } catch (err: any) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException on general error', async () => {
      mockHttpRequest.mockReturnValueOnce(
        throwError(() => new Error('error-proxy-test')),
      );
      try {
        await sendRequest(url);
      } catch (err: any) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
    });
  });
});

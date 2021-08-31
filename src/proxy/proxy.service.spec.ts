import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';
import { of, throwError } from 'rxjs';
import { POST_SIZE_LIMIT } from 'src/common/interceptor/payload-limit.interceptor';
import { ProxyConfigService } from './config/proxy-config.service';
import { ProxyConfigDto } from './dto/proxy-config.dto';
import { ProxyService } from './proxy.service';
import { filterHeaders } from './utils/filterHeaders';
import { ProxyListService } from './utils/proxy-list.service';

jest.mock('./utils/filterHeaders');

const requestData: any = {
  method: 'GET',
  protocol: 'http',
  headers: { hostname: '127.0.0.1' },
};
const defaultProxyConfig: { proxy: ProxyConfigDto } = {
  proxy: new ProxyConfigDto(),
};
defaultProxyConfig.proxy.allowProxyFor = ['example.com'];
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

const mockExecutionContext = createMock<ExecutionContext>({
  switchToHttp: () => ({
    getRequest: () => requestData,
  }),
});
const mockRequest: any = mockExecutionContext.switchToHttp().getRequest();

describe('ProxyService', () => {
  const data = 'success';
  const url = 'https://example.com/blah?query=value&otherQuery=otherValue';
  let service: ProxyService;

  const mockQuery = () => {
    jest
      .spyOn(service as any, 'getQuery')
      .mockImplementationOnce(() => 'query=value&otherQuery=otherValue');
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        ProxyConfigService,
        ProxyListService,
        ProxyService,
        { provide: HttpService, useValue: httpServiceMock },
      ],
    })
      .overrideProvider(ConfigService)
      .useClass(ConfigServiceMock)
      .overrideProvider(REQUEST)
      .useValue(mockRequest)
      .overrideProvider(POST_SIZE_LIMIT)
      .useValue(102400)
      .compile();

    service = await module.resolve<ProxyService>(ProxyService);

    when(mockConfigGet)
      .calledWith('proxy')
      .mockReturnValue(defaultProxyConfig.proxy);

    (filterHeaders as any).mockImplementation(() => ({}));
    mockHttpRequest.mockReturnValue(of({ data }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should proxy and properly use defaults', async () => {
    mockQuery();
    await service.proxyRequest(url);
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url,
        headers: {},
        proxy: undefined,
        data: undefined,
        maxBodyLength: 102400,
        beforeRedirect: expect.any(Function),
        onHttpSocketEvent: expect.any(Function),
      }),
    );
  });

  it('blocks a domain not on allowedProxy list ', async () => {
    try {
      (filterHeaders as any).mockImplementation(() => ({}));
      await service.proxyRequest(url);
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
    }
  });

  it('should not block a domain if proxyAllDomains is true', async () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.proxyAllDomains = true;
    proxyConf.allowProxyFor = ['example.com'];
    mockConfigGet.mockReturnValue(proxyConf);
    jest
      .spyOn(service as any, 'getQuery')
      .mockImplementationOnce(() => 'query=value&otherQuery=otherValue');
    (filterHeaders as any).mockImplementation(() => ({}));
    await service.proxyRequest(url);
    expect(mockHttpRequest).toHaveBeenCalledTimes(1);
  });

  it('should fix target url', async () => {
    mockQuery();
    const url = '/example.com/blah?query=value&otherQuery=otherValue';
    const badUrl = `https:${url}`;
    const fixedUrl = `https:/${url}`;
    await service.proxyRequest(badUrl);
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: fixedUrl,
      }),
    );
  });

  it("should add http if it isn't provided", async () => {
    mockQuery();
    const url = 'example.com/blah?query=value&otherQuery=otherValue';
    const fixedUrl = `http://${url}`;
    await service.proxyRequest(url);
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: fixedUrl,
      }),
    );
  });

  it('should call delete authorization header when using basic auth on server', async () => {
    const authorizationHeader = {
      username: 'test',
      password: 'test',
    };
    when(mockConfigGet)
      .calledWith('basicAuthentication')
      .mockReturnValue(authorizationHeader);
    const spyDeleteAuthorizationHeader = jest.spyOn(
      service as any,
      'deleteAuthorizationHeader',
    );
    await service.proxyRequest(url);
    expect(spyDeleteAuthorizationHeader).toHaveBeenCalledTimes(1);
  });

  it('should not call delete authorization header', async () => {
    when(mockConfigGet)
      .calledWith('basicAuthentication')
      .mockReturnValue(undefined);
    const spyDeleteAuthorizationHeader = jest.spyOn(
      service as any,
      'deleteAuthorizationHeader',
    );
    await service.proxyRequest(url);
    expect(spyDeleteAuthorizationHeader).not.toHaveBeenCalled();
  });

  describe('upstream proxy', () => {
    it('used when one is specified', async () => {
      const proxy = 'http://proxy/';
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.upstreamProxy = proxy;
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      await service.proxyRequest(url);
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
      await service.proxyRequest(url);
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
      await service.proxyRequest(url);
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
      await service.proxyRequest(url);
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
      await service.proxyRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: auth,
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
      await service.proxyRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {},
          method: 'GET',
        }),
      );
    });

    it('should set auth header for that domain', async () => {
      const auth = {
        authorization: 'testauth',
      };
      const proxyConf = { ...defaultProxyConfig.proxy };
      proxyConf.proxyAuth = {
        'example.com': auth,
      };
      when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
      mockHttpRequest.mockReturnValueOnce(
        throwError(() => new ForbiddenException()),
      );
      await service.proxyRequest(url);
      expect(mockHttpRequest).toHaveBeenCalledTimes(2);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: auth,
          method: 'GET',
        }),
      );
    });

    it('should propperly interpret error', async () => {
      const auth = {
        authorization: 'testauth',
      };
      try {
        const proxyConf = { ...defaultProxyConfig.proxy };
        proxyConf.proxyAuth = {
          'example.com': auth,
        };
        mockHttpRequest
          .mockReturnValueOnce(throwError(() => new ForbiddenException()))
          .mockReturnValueOnce(throwError(() => new ForbiddenException()));
        when(mockConfigGet).calledWith('proxy').mockReturnValue(proxyConf);
        await service.proxyRequest(url);

        expect(mockHttpRequest).toHaveBeenCalledTimes(2);
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(mockHttpRequest).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            headers: auth,
            method: 'GET',
          }),
        );
        expect(mockHttpRequest).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            headers: {},
            method: 'GET',
          }),
        );
      }
    });
  });

  describe('when domain has other headers specified', () => {
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
      await service.proxyRequest(url);

      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Secret-Key': 'ABCDE12345',
            'Another-Header': 'XYZ',
          },
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
      await service.proxyRequest(url);

      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {},
          method: 'GET',
        }),
      );
    });
  });

  describe('append param to querry', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'getQuery').mockImplementation(() => '');
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
      await service.proxyRequest(proxyUrl);
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
      await service.proxyRequest(proxyUrl);
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
      await service.proxyRequest(proxyUrl);
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
      await service.proxyRequest(proxyUrl);
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
      await service.proxyRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.search).toBe('?foo=bar&another=val');
    });

    it('should combine with existing query', async () => {
      const query = '?already=here';
      jest
        .spyOn(service as any, 'getQuery')
        .mockImplementationOnce(() => query);
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
      await service.proxyRequest(proxyUrl);
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
      await service.proxyRequest(proxyUrl);
      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const hitUrl = new URL(mockHttpRequest.mock.calls[0][0].url);
      expect(hitUrl.search).toBe('');
    });
  });
});

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { fs, vol } from 'memfs';
import { ProxyConfigService } from '../config/proxy-config.service';
import { ProxyConfigDto } from '../dto/proxy-config.dto';
import { DEFAULT_BLACKLIST } from '../proxy.constants';
import { ProxyListService } from './proxy-list.service';

jest.mock('fs');

vol.fromJSON({
  './blacklist': 'blacklist',
  './whitelist': 'whitelist',
});

const defaultProxyConfig: { proxy: ProxyConfigDto } = {
  proxy: new ProxyConfigDto(),
};
const mockConfigGet = jest.fn();

class ConfigServiceMock {
  get = mockConfigGet;
}

describe('ProxyListService', () => {
  let service: ProxyListService;
  let proxyConfigService: ProxyConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useClass: ConfigServiceMock,
        },
        ProxyListService,
        ProxyConfigService,
      ],
    }).compile();

    service = module.get<ProxyListService>(ProxyListService);
    proxyConfigService = module.get<ProxyConfigService>(ProxyConfigService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('proxyConfigService should be defined', () => {
    expect(proxyConfigService).toBeDefined();
  });

  it('should call file watcher on whitelist', () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.whitelistPath = './whitelist';
    mockConfigGet.mockReturnValue(proxyConf);
    const watchSpy = jest.spyOn(fs, 'watch');
    service.onModuleInit();
    expect(watchSpy).toHaveBeenCalledTimes(1);
    expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    expect(service.whitelist).toEqual(['whitelist']);
    service.onModuleDestroy();
  });

  it('should resolve `allowProxyFor` on invalid path', () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.whitelistPath = './whitelist-bad';
    proxyConf.allowProxyFor = ['allowProxyFor'];
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.whitelist).toEqual(['allowProxyFor']);
    service.onModuleDestroy();
  });

  it('should resolve `allowProxyFor` when whitelistPath not defined', () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.allowProxyFor = ['allowProxyFor'];
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.whitelist).toEqual(['allowProxyFor']);
    service.onModuleDestroy();
  });

  it('should call file watcher on blacklist', () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.blacklistPath = './blacklist';
    mockConfigGet.mockReturnValue(proxyConf);
    const watchSpy = jest.spyOn(fs, 'watch');
    service.onModuleInit();
    expect(watchSpy).toHaveBeenCalledTimes(1);
    expect(service.blacklist).toEqual(['blacklist']);
    expect(service.whitelist).toEqual([]);
    service.onModuleDestroy();
  });

  it('should resolve default blacklist on invalid path and no blacklist in config', () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.blacklistPath = './blacklist-bad';
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    service.onModuleDestroy();
  });

  it('should resolve default blacklist when blacklistPath not defined and no blacklist in config', () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    service.onModuleDestroy();
  });

  it('should resolve `blacklistAddresses` on invalid path and no blacklist in config', () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.blacklistPath = './blacklist-bad';
    proxyConf.blacklistedAddresses = ['blacklistedAddresses'];
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.blacklist).toEqual(['blacklistedAddresses']);
    service.onModuleDestroy();
  });

  it('should resolve `blacklistAddresses` when blacklistPath not defined', () => {
    const proxyConf = { ...defaultProxyConfig.proxy };
    proxyConf.blacklistedAddresses = ['blacklistedAddresses'];
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.blacklist).toEqual(['blacklistedAddresses']);
    service.onModuleDestroy();
  });
});

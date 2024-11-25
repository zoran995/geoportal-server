import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { fs, vol } from 'memfs';

import { ProxyConfigService } from '../../config/proxy-config.service';
import { proxyConfig } from '../../config/schema/proxy-config.dto';
import { DEFAULT_BLACKLIST } from '../../proxy.constants';
import { ProxyListService } from '../proxy-list.service';

jest.mock('fs');

vol.fromJSON({
  './test/blacklist': 'blacklist',
  './test/whitelist': 'whitelist',
});

const defaultProxyConfig = proxyConfig.parse({});
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

  afterEach(() => {
    jest.clearAllMocks();
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('proxyConfigService should be defined', () => {
    expect(proxyConfigService).toBeDefined();
  });

  it('should call file watcher on whitelist', () => {
    const proxyConf = { ...defaultProxyConfig };
    proxyConf.whitelistPath = './test/whitelist';
    mockConfigGet.mockReturnValue(proxyConf);
    const watchSpy = jest.spyOn(fs, 'watch');
    service.onModuleInit();
    expect(watchSpy).toHaveBeenCalledTimes(1);
    expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    expect(service.whitelist).toEqual(['whitelist']);
    service.onModuleDestroy();
  });

  it('should resolve `allowProxyFor` on invalid path', () => {
    const proxyConf = { ...defaultProxyConfig };
    proxyConf.whitelistPath = './test/whitelist-bad';
    proxyConf.allowProxyFor = ['allowProxyFor'];
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.whitelist).toEqual(['allowProxyFor']);
    service.onModuleDestroy();
  });

  it('should resolve `allowProxyFor` when whitelistPath not defined', () => {
    const proxyConf = { ...defaultProxyConfig };
    proxyConf.allowProxyFor = ['allowProxyFor'];
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.whitelist).toEqual(['allowProxyFor']);
    service.onModuleDestroy();
  });

  it('should call file watcher on blacklist', () => {
    const proxyConf = { ...defaultProxyConfig };
    proxyConf.blacklistPath = './test/blacklist';
    mockConfigGet.mockReturnValue(proxyConf);
    const watchSpy = jest.spyOn(fs, 'watch');
    service.onModuleInit();
    expect(watchSpy).toHaveBeenCalledTimes(1);
    expect(service.blacklist).toEqual(['blacklist']);
    expect(service.whitelist).toEqual([]);
    service.onModuleDestroy();
  });

  it('should resolve default blacklist on invalid path and no blacklist in config', () => {
    const proxyConf = { ...defaultProxyConfig };
    proxyConf.blacklistPath = './test/blacklist-bad';
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    service.onModuleDestroy();
  });

  it('should resolve default blacklist when blacklistPath not defined and no blacklist in config', () => {
    const proxyConf = { ...defaultProxyConfig };
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    service.onModuleDestroy();
  });

  it('should resolve `blacklistAddresses` on invalid path', () => {
    const proxyConf = { ...defaultProxyConfig };
    proxyConf.blacklistPath = './test/blacklist-bad';
    proxyConf.blacklistedAddresses = ['blacklistedAddresses'];
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.blacklist).toEqual(['blacklistedAddresses']);
    service.onModuleDestroy();
  });

  it('should resolve `blacklistAddresses` when blacklistPath not defined', () => {
    const proxyConf = { ...defaultProxyConfig };
    proxyConf.blacklistedAddresses = ['blacklistedAddresses'];
    mockConfigGet.mockReturnValue(proxyConf);
    service.onModuleInit();
    expect(service.blacklist).toEqual(['blacklistedAddresses']);
    service.onModuleDestroy();
  });

  describe('addressBlacklisted', () => {
    it('should return true for blacklisted address', () => {
      const proxyConf = { ...defaultProxyConfig };
      proxyConf.blacklistedAddresses = ['192.163.0.1'];
      mockConfigGet.mockReturnValue(proxyConf);
      service.onModuleInit();
      const result = service.addressBlacklisted('192.163.0.1:8080');
      expect(result).toBe(true);
      service.onModuleDestroy();
    });

    it('should return false for non blacklisted address', () => {
      const proxyConf = { ...defaultProxyConfig };
      proxyConf.blacklistedAddresses = ['192.163.0.1'];
      mockConfigGet.mockReturnValue(proxyConf);
      service.onModuleInit();
      const result = service.addressBlacklisted('192.163.0.2');
      expect(result).toBe(false);
      service.onModuleDestroy();
    });

    it('should not use port when checking blacklisted address', () => {
      const proxyConf = { ...defaultProxyConfig };
      proxyConf.blacklistedAddresses = ['192.163.0.1'];
      mockConfigGet.mockReturnValue(proxyConf);
      service.onModuleInit();
      const result = service.addressBlacklisted('192.163.0.1:8080');
      expect(result).toBe(true);
      service.onModuleDestroy();
    });
  });

  describe('file changes', () => {
    it('should listen to file changes in whitelist', async () => {
      const proxyConf = { ...defaultProxyConfig };
      proxyConf.whitelistPath = './test/whitelist';
      proxyConf.blacklistPath = './test/blacklist';
      mockConfigGet.mockReturnValue(proxyConf);
      const watchSpy = jest.spyOn(fs, 'watch');
      replaceInFile(proxyConf.whitelistPath, 'whitelist');
      replaceInFile(proxyConf.blacklistPath, 'blacklist');
      service.onModuleInit();
      expect(watchSpy).toHaveBeenCalledTimes(2);
      expect(service.whitelist).toEqual(['whitelist']);
      expect(service.blacklist).toEqual(['blacklist']);

      replaceInFile(proxyConf.whitelistPath, 'test replace');
      await new Promise((r) => setTimeout(r, 2000));
      expect(service.whitelist).toEqual(['test replace']);
      expect(service.blacklist).toEqual(['blacklist']);
      service.onModuleDestroy();
    });

    it('should listen to file changes in blacklist', async () => {
      const proxyConf = { ...defaultProxyConfig };
      proxyConf.whitelistPath = './test/whitelist';
      proxyConf.blacklistPath = './test/blacklist';
      mockConfigGet.mockReturnValue(proxyConf);
      const watchSpy = jest.spyOn(fs, 'watch');
      replaceInFile(proxyConf.whitelistPath, 'whitelist');
      replaceInFile(proxyConf.blacklistPath, 'blacklist');
      service.onModuleInit();
      expect(watchSpy).toHaveBeenCalledTimes(2);
      expect(service.whitelist).toEqual(['whitelist']);
      expect(service.blacklist).toEqual(['blacklist']);

      replaceInFile(proxyConf.blacklistPath, 'test replace');
      await new Promise((r) => setTimeout(r, 2000));
      expect(service.whitelist).toEqual(['whitelist']);
      expect(service.blacklist).toEqual(['test replace']);
      service.onModuleDestroy();
    });

    it('should reinit on file delete', async () => {
      const proxyConf = { ...defaultProxyConfig };
      proxyConf.whitelistPath = './test/whitelist';
      proxyConf.allowProxyFor = ['allowProxyFor'];
      mockConfigGet.mockReturnValue(proxyConf);
      const watchSpy = jest.spyOn(fs, 'watch');
      replaceInFile(proxyConf.whitelistPath, 'whitelist');
      service.onModuleInit();
      expect(watchSpy).toHaveBeenCalledTimes(1);
      expect(service.whitelist).toEqual(['whitelist']);

      deleteFile(proxyConf.whitelistPath);
      //expect(watchSpy).toHaveBeenCalledTimes(1);
      await new Promise((r) => setTimeout(r, 3000));
      expect(service.whitelist).toEqual(['allowProxyFor']);
      service.onModuleDestroy();
    });
  });
});

function replaceInFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content);
}

function deleteFile(filePath: string) {
  fs.unlinkSync(filePath);
}

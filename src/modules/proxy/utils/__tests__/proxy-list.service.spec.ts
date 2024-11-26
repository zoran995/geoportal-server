import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { fs, vol } from 'memfs';

import { ProxyConfigService } from '../../config/proxy-config.service';
import { proxyConfig } from '../../config/schema/proxy-config.dto';
import { DEFAULT_BLACKLIST } from '../../proxy.constants';
import { ProxyListService } from '../proxy-list.service';
import type { INestApplication } from '@nestjs/common';
import { LoggerService } from 'src/infrastructure/logger';

jest.mock('fs');

describe('ProxyListService', () => {
  let app: INestApplication;

  const mockConfigGet = jest.fn();

  beforeEach(async () => {
    vol.fromJSON({
      './test/blacklist': 'blacklist',
      './test/whitelist': 'whitelist',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: mockConfigGet,
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
          },
        },
        ProxyListService,
        ProxyConfigService,
      ],
    }).compile();

    app = module.createNestApplication();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('should be defined', async () => {
    await app.init();

    const service = app.get(ProxyListService);

    expect(service).toBeDefined();
  });

  it('proxyConfigService should be defined', async () => {
    await app.init();

    const service = app.get(ProxyConfigService);

    expect(service).toBeDefined();
  });
  describe('whitelist', () => {
    it('should resolve `allowProxyFor` when whitelistPath not defined', async () => {
      const proxyConf = proxyConfig.parse({
        allowProxyFor: ['allowProxyFor', 'allowProxyFor2'],
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['allowProxyFor', 'allowProxyFor2']);
    });

    it('should return from whiteListPath', async () => {
      const proxyConf = proxyConfig.parse({
        whitelistPath: './test/whitelist',
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['whitelist']);
    });

    it('should resolve `allowProxyFor` on invalid path', async () => {
      const proxyConf = proxyConfig.parse({
        whitelistPath: './test/whitelist-bad',
        allowProxyFor: ['allowProxyFor'],
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['allowProxyFor']);
    });

    it('should listen to file changes in whitelist', async () => {
      const proxyConf = proxyConfig.parse({
        whitelistPath: './test/whitelist',
        blacklistPath: './test/blacklist',
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['whitelist']);
      expect(service.blacklist).toEqual(['blacklist']);

      replaceInFile('./test/whitelist', 'test replace');
      await new Promise((r) => setTimeout(r, 2000));
      expect(service.whitelist).toEqual(['test replace']);
      expect(service.blacklist).toEqual(['blacklist']);
    });

    it('should reinit on file delete', async () => {
      const proxyConf = proxyConfig.parse({
        whitelistPath: './test/whitelist',
        allowProxyFor: ['allowProxyFor'],
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['whitelist']);

      deleteFile('./test/whitelist');
      await new Promise((r) => setTimeout(r, 2000));

      expect(service.whitelist).toEqual(['allowProxyFor']);
    });
  });

  describe('blacklist', () => {
    it('should resolve `blacklistAddresses` when blacklistPath not defined', async () => {
      const proxyConf = proxyConfig.parse({
        blacklistedAddresses: ['blacklistedAddresses'],
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(['blacklistedAddresses']);
    });

    it('should resolve default blacklist when blacklistPath not defined and no blacklist in config', async () => {
      const proxyConf = proxyConfig.parse({});
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    });

    it('should resolve `blacklistAddresses` on invalid path', async () => {
      const proxyConf = proxyConfig.parse({
        blacklistPath: './test/blacklist-bad',
        blacklistedAddresses: ['blacklistedAddresses'],
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(['blacklistedAddresses']);
    });

    it('should resolve default blacklist on invalid path and no blacklist in config', async () => {
      const proxyConf = proxyConfig.parse({
        blacklistPath: './test/blacklist-bad',
      });
      proxyConf.blacklistPath = './test/blacklist-bad';
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    });

    it('should listen to file changes in blacklist', async () => {
      const proxyConf = proxyConfig.parse({
        whitelistPath: './test/whitelist',
        blacklistPath: './test/blacklist',
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['whitelist']);
      expect(service.blacklist).toEqual(['blacklist']);

      replaceInFile('./test/blacklist', 'test replace');
      await new Promise((r) => setTimeout(r, 2000));

      expect(service.whitelist).toEqual(['whitelist']);
      expect(service.blacklist).toEqual(['test replace']);
    });

    it('should reinit on file delete', async () => {
      const proxyConf = proxyConfig.parse({
        blacklistPath: './test/blacklist',
        blacklistedAddresses: ['blacklistedAddresses'],
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(['blacklist']);

      deleteFile('./test/blacklist');
      await new Promise((r) => setTimeout(r, 2000));

      expect(service.blacklist).toEqual(['blacklistedAddresses']);
    });

    it('should reinit to default list on file delete when no blacklisted address', async () => {
      const proxyConf = proxyConfig.parse({
        blacklistPath: './test/blacklist',
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(['blacklist']);

      deleteFile('./test/blacklist');
      await new Promise((r) => setTimeout(r, 2000));

      expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    });
  });

  describe('addressBlacklisted', () => {
    beforeEach(async () => {
      const proxyConf = proxyConfig.parse({
        blacklistedAddresses: ['192.163.0.1'],
      });
      mockConfigGet.mockReturnValue(proxyConf);

      await app.init();
    });
    it('should return true for blacklisted address', () => {
      const service = app.get(ProxyListService);

      const result = service.addressBlacklisted('192.163.0.1:8080');

      expect(result).toBe(true);
    });

    it('should return false for non blacklisted address', () => {
      const service = app.get(ProxyListService);

      const result = service.addressBlacklisted('192.163.0.2');

      expect(result).toBe(false);
    });

    it('should not use port when checking blacklisted address', () => {
      const service = app.get(ProxyListService);

      const result = service.addressBlacklisted('192.163.0.1:8080');

      expect(result).toBe(true);
    });
  });
});

function replaceInFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content);
}

function deleteFile(filePath: string) {
  fs.unlinkSync(filePath);
}

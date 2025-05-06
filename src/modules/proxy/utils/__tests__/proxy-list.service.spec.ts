import { Test, TestingModule } from '@nestjs/testing';

import { fs, vol } from 'memfs';

import {
  proxyConfig,
  type ProxyConfigType,
} from '../../config/schema/proxy-config.dto.js';
import { DEFAULT_BLACKLIST, PROXY_OPTIONS } from '../../proxy.constants.js';
import { ProxyListService } from '../proxy-list.service.js';
import type { INestApplication } from '@nestjs/common';
import { LoggerService } from 'src/infrastructure/logger/index.js';
import type { ProxyOptions } from '../../proxy-options.js';

vi.mock('fs');

describe('ProxyListService', () => {
  let app: INestApplication;

  const options: ProxyOptions = {
    ...proxyConfig.parse({}),
    basicAuthentication: false,
  };
  const setConfig = (target: Partial<ProxyConfigType>) => {
    Object.getOwnPropertyNames(options).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete options[key as keyof ProxyOptions];
    });

    options.basicAuthentication = false;
    Object.assign(options, proxyConfig.parse(target));
  };

  beforeEach(async () => {
    vol.fromJSON({
      './test/blacklist': 'blacklist',
      './test/whitelist': 'whitelist',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: LoggerService,
          useValue: {
            log: vi.fn(),
          },
        },
        {
          provide: PROXY_OPTIONS,
          useValue: options,
        },
        ProxyListService,
      ],
    }).compile();

    app = module.createNestApplication();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await app.close();
  });

  it('should be defined', async () => {
    await app.init();

    const service = app.get(ProxyListService);

    expect(service).toBeDefined();
  });

  describe('whitelist', () => {
    it('should resolve `allowProxyFor` when whitelistPath not defined', async () => {
      setConfig({ allowProxyFor: ['allowProxyFor', 'allowProxyFor2'] });

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['allowProxyFor', 'allowProxyFor2']);
    });

    it('should return from whiteListPath', async () => {
      setConfig({ whitelistPath: './test/whitelist' });

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['whitelist']);
    });

    it('should resolve `allowProxyFor` on invalid path', async () => {
      setConfig({
        whitelistPath: './test/whitelist-bad',
        allowProxyFor: ['allowProxyFor'],
      });

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.whitelist).toEqual(['allowProxyFor']);
    });

    it('should listen to file changes in whitelist', async () => {
      setConfig({
        whitelistPath: './test/whitelist',
        blacklistPath: './test/blacklist',
      });

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
      setConfig({
        whitelistPath: './test/whitelist',
        allowProxyFor: ['allowProxyFor'],
      });

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
      setConfig({
        blacklistedAddresses: ['blacklistedAddresses'],
      });

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(['blacklistedAddresses']);
    });

    it('should resolve default blacklist when blacklistPath not defined and no blacklist in config', async () => {
      setConfig({});

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    });

    it('should resolve `blacklistAddresses` on invalid path', async () => {
      setConfig({
        blacklistPath: './test/blacklist-bad',
        blacklistedAddresses: ['blacklistedAddresses'],
      });

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(['blacklistedAddresses']);
    });

    it('should resolve default blacklist on invalid path and no blacklist in config', async () => {
      setConfig({
        blacklistPath: './test/blacklist-bad',
      });

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(DEFAULT_BLACKLIST);
    });

    it('should listen to file changes in blacklist', async () => {
      setConfig({
        whitelistPath: './test/whitelist',
        blacklistPath: './test/blacklist',
      });

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
      setConfig({
        blacklistPath: './test/blacklist',
        blacklistedAddresses: ['blacklistedAddresses'],
      });

      await app.init();
      const service = app.get(ProxyListService);

      expect(service.blacklist).toEqual(['blacklist']);

      deleteFile('./test/blacklist');
      await new Promise((r) => setTimeout(r, 2000));

      expect(service.blacklist).toEqual(['blacklistedAddresses']);
    });

    it('should reinit to default list on file delete when no blacklisted address', async () => {
      setConfig({
        blacklistPath: './test/blacklist',
      });

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
      setConfig({
        blacklistedAddresses: ['192.163.0.1'],
      });

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

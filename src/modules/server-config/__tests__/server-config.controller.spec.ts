import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { z } from 'zod';

import { LoggerService } from 'src/infrastructure/logger/index.js';
import { TestLoggerService } from 'src/infrastructure/logger/test-logger.service.js';

import { configuration } from '../../config/index.js';
import { PROXY_OPTIONS, ProxyListService } from '../../proxy/index.js';
import { ShareConfigType } from '../../share/index.js';
import type { serverConfigResponse } from '../schema/safe-settings.schema.js';
import { ServerConfigController } from '../server-config.controller.js';

function path(obj: Record<string, unknown>, path: string) {
  try {
    return eval('obj.' + path);
  } catch {
    return undefined;
  }
}

const defaultConfig = configuration.parse({});

const mockConfigGet = vi.fn();

describe('ServerConfigController', () => {
  let controller: ServerConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: mockConfigGet,
          },
        },
        {
          provide: PROXY_OPTIONS,
          useValue: {},
        },
        ProxyListService,
        {
          provide: LoggerService,
          useClass: TestLoggerService,
        },
      ],
      controllers: [ServerConfigController],
    }).compile();

    controller = module.get<ServerConfigController>(ServerConfigController);
  });

  afterEach(() => {
    mockConfigGet.mockClear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('default config', () => {
    let safeSettings: z.infer<typeof serverConfigResponse>;

    beforeEach(() => {
      mockConfigGet.mockImplementation((propertyPath) => {
        return path(defaultConfig as never, propertyPath);
      });
      safeSettings = controller.serverConfig() as never;
    });

    afterEach(() => {
      mockConfigGet.mockClear();
    });

    it('safeSettings is defined', () => {
      expect(safeSettings).toBeDefined();
    });

    it('allowProxyFor is defined', () => {
      const allowProxyFor = safeSettings.allowProxyFor;
      expect(allowProxyFor).toBeDefined();
      expect(allowProxyFor?.length).toBe(0);
    });

    it('proxyAllDomains is false', () => {
      const proxyAllDomains = safeSettings.proxyAllDomains;
      expect(proxyAllDomains).toBe(false);
    });

    it('newShareUrlPrefix is false', () => {
      const newShareUrlPrefix = safeSettings.newShareUrlPrefix;
      expect(newShareUrlPrefix).toBeUndefined();
    });
  });

  it('when proxyAllDomains is true', () => {
    defaultConfig.proxy.proxyAllDomains = true;
    mockConfigGet.mockImplementation((propertyPath) => {
      return path(defaultConfig as never, propertyPath);
    });
    const safeSettings = controller.serverConfig();
    expect(safeSettings.proxyAllDomains).toBe(true);
    expect(safeSettings.allowProxyFor).toBeUndefined();
  });

  it('properly resolve share prefix', () => {
    defaultConfig.share = { newPrefix: 'test' } as ShareConfigType;
    mockConfigGet.mockImplementation((propertyPath) => {
      return path(defaultConfig as never, propertyPath);
    });
    const safeSettings = controller.serverConfig();
    expect(safeSettings.newShareUrlPrefix).toBe('test');
  });
});

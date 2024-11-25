import type { z } from 'zod';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { configuration } from '../../config';

import { ProxyConfigService, ProxyListService } from '../../proxy';
import { ShareConfigType } from '../../share';
import { ServerConfigController } from '../server-config.controller';
import type { serverConfigResponse } from '../schema/safe-settings.schema';

function path(obj: Record<string, unknown>, path: string) {
  try {
    return eval('obj.' + path);
  } catch (e) {
    return undefined;
  }
}

const defaultConfig = configuration.parse({});

const mockConfigGet = jest.fn();

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
        ProxyListService,
        ProxyConfigService,
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
      safeSettings = controller.serverConfig()!;
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

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { ProxyConfigService } from '../proxy/config/proxy-config.service';
import { ProxyListService } from '../proxy/utils/proxy-list.service';
import { ShareConfigDto } from '../share/dto/share.config.dto';
import { ConfigurationDto } from './dto/configuration.dto';
import {
  ISafeSettings,
  ServerConfigController,
} from './server-config.controller';

function path(obj: Record<string, any>, path: string) {
  try {
    return eval('obj.' + path);
  } catch (e) {
    return undefined;
  }
}

const defaultConfig = plainToClass(ConfigurationDto, {});

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

  it('contains version', () => {
    const version = controller.serverConfig().version;
    expect(version).toBeDefined();
  });

  describe('default config', () => {
    let safeSettings: ISafeSettings;

    beforeEach(() => {
      mockConfigGet.mockImplementation((propertyPath) => {
        return path(defaultConfig, propertyPath);
      });
      safeSettings = controller.serverConfig();
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
      return path(defaultConfig, propertyPath);
    });
    const safeSettings = controller.serverConfig();
    expect(safeSettings.proxyAllDomains).toBe(true);
    expect(safeSettings.allowProxyFor).toBeUndefined();
  });

  it('properly resolve share prefix', () => {
    defaultConfig.share = plainToClass(ShareConfigDto, { newPrefix: 'test' });
    mockConfigGet.mockImplementation((propertyPath) => {
      return path(defaultConfig, propertyPath);
    });
    const safeSettings = controller.serverConfig();
    expect(safeSettings.newShareUrlPrefix).toBe('test');
  });
});

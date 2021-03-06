const mockLoadJsonConfig = jest.fn();
const mockLoadYargs = jest.fn();
const mockValidate = jest.fn((config: unknown) => {
  return config;
});

import { ConfigLoader } from '../config-loader';
import { EnvConfigLoader } from '../utils/load-env.util';
import { DEFAULT_CONFIG_LOCATION } from '../utils/load-yargs.util';

jest.mock('../utils/load-json-config.util', () => ({
  loadJsonConfig: mockLoadJsonConfig,
}));
jest.mock('../utils/load-yargs.util', () => ({
  loadYargs: mockLoadYargs,
}));
jest.mock('../validators/config.validator', () => ({
  validate: mockValidate,
}));

describe('ConfigLoader', () => {
  afterEach(() => {
    mockLoadYargs.mockClear();
    mockLoadJsonConfig.mockClear();
  });

  it('properly loads from json file', () => {
    const configFile = './test/serverconfig1.json';
    mockLoadYargs.mockReturnValueOnce({
      'config-file': configFile,
    });
    mockLoadJsonConfig.mockReturnValueOnce({});
    ConfigLoader.load();
    expect(mockLoadJsonConfig).toHaveBeenCalledWith({ filePath: configFile });
  });

  describe('interprolate config values with env variables', () => {
    beforeEach(() => {
      jest.spyOn(EnvConfigLoader, 'load').mockReturnValueOnce({
        PORT: '4444',
        compress: 'true',
      });
    });

    it('expand values with default yargs config', () => {
      expect.assertions(3);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        port: '$PORT',
        compressResponse: '${compress}',
        test: 'test',
      });

      const config: any = ConfigLoader.load();
      expect(config.port).toBe('4444');
      expect(config.compressResponse).toBe('true');
      expect(config.test).toBe('test');
    });

    it('expand missing env variables to empty string', () => {
      expect.assertions(1);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        port: '$UNDEFINED_ENV_KEY',
      });

      const config = ConfigLoader.load();
      expect(config.port).toBe('');
    });

    it("doesn't expand escaped values", () => {
      expect.assertions(1);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        port: '\\$PORT',
      });

      const config = ConfigLoader.load();
      expect(config.port).toBe('$PORT');
    });

    it('does not expand inline escaped dollar sign', () => {
      expect.assertions(1);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        compressResponse: 'compre\\$\\$',
      });

      const config = ConfigLoader.load();
      expect(config.compressResponse).toBe('compre$$');
    });

    it('handle mixed value', () => {
      expect.assertions(1);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        test: '\\$this$PORT\\$is$compress',
      });
      const config: any = ConfigLoader.load();
      expect(config.test).toBe('$this4444$istrue');
    });

    it('uses default value', () => {
      expect.assertions(1);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        port: '${UNDEFINED_PORT:-3444}',
      });
      const config = ConfigLoader.load();
      expect(config.port).toBe('3444');
    });

    it('should properly expand values nested in object', () => {
      expect.assertions(1);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        serveStatic: {
          resolveUnmatchedPathsWithIndexHtml: '$compress',
        },
      });
      const config = ConfigLoader.load();
      expect(config.serveStatic.resolveUnmatchedPathsWithIndexHtml).toBe(
        'true',
      );
    });

    it('should properly expand value in array', () => {
      expect.assertions(1);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        initPaths: ['test', '$PORT', 'test2'],
      });
      const config = ConfigLoader.load();
      expect(config.initPaths).toStrictEqual(['test', '4444', 'test2']);
    });

    it('should properly expand value in array of object', () => {
      expect.assertions(1);
      mockLoadYargs.mockReturnValueOnce({});
      mockLoadJsonConfig.mockReturnValueOnce({
        proxy: {
          proxyAuth: [{ a: 'b', apiKey: '$compress' }],
        },
      });
      const config = ConfigLoader.load();
      expect(config.proxy.proxyAuth).toStrictEqual([
        { a: 'b', apiKey: 'true' },
      ]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });

  it('properly override json config values with values from yargs', () => {
    mockLoadYargs.mockReturnValue({
      'config-file': DEFAULT_CONFIG_LOCATION,
      port: 3005,
    });
    mockLoadJsonConfig.mockReturnValueOnce({
      port: 3002,
    });
    const loadedConfig = ConfigLoader.load();

    expect(loadedConfig).toBeDefined();
    expect(loadedConfig.port).toBe(3005);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});

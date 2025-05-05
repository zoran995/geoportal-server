import { vol, DirectoryJSON } from 'memfs';
import { ConfigLoader } from '../config-loader.js';

vi.mock('fs');
vi.hoisted(async () => {
  const fsMock = await import('memfs');

  require.cache.fs = { exports: fsMock } as never;
});

const volJson: DirectoryJSON = {
  './test/serverconfig1.json': JSON.stringify({ port: 3001 }),
  './test/serverconfig-expansion.json': JSON.stringify({
    port: '$PORT',
    compressResponse: '${compress}',
    test: 'test',
  }),
  './test/serverconfig-complex.json': JSON.stringify({
    port: '$UNDEFINED_ENV_KEY',
    port1: '\\$PORT',
    compressResponse: 'compre\\$\\$',
    test: '\\$this$PORT\\$is$compress',
    defaultValue: '${UNDEFINED_ENV_KEY:-3444}',
    serveStatic: {
      resolveUnmatchedPathsWithIndexHtml: '$compress',
    },
    initPaths: ['test', '$PORT', 'test2'],
    proxy: {
      proxyAuth: [{ a: 'b', apiKey: '$compress' }],
    },
  }),
  '.env': 'PORT=4444\ncompress=true',
  '.env.example': 'PORT=2222\ncompress=true',
};

vol.fromJSON(volJson);

describe('ConfigLoader', () => {
  const validateMock = vi.fn((config: unknown) => {
    return config as never;
  });

  const originalArgv = [...process.argv];

  beforeEach(() => {
    process.argv = [...originalArgv];
  });

  it('properly loads from json file', () => {
    expect.assertions(2);

    const configFile = './test/serverconfig1.json';
    process.argv.push('--config-file', configFile);

    const config = ConfigLoader.load(validateMock);

    expect(config).toBeDefined();
    expect(config).toEqual(expect.objectContaining({ port: 3001 }));
  });

  describe('interprolate config values with env variables', () => {
    it('expand values with default yargs config', () => {
      expect.assertions(3);
      process.argv.push('--config-file', './test/serverconfig-expansion.json');

      const config: any = ConfigLoader.load(validateMock);
      expect(config.port).toBe('4444');
      expect(config.compressResponse).toBe('true');
      expect(config.test).toBe('test');
    });

    it('expand missing env variables to empty string', () => {
      expect.assertions(1);
      process.argv.push('--config-file', './test/serverconfig-complex.json');

      const config = ConfigLoader.load(validateMock);
      expect(config.port).toBe('');
    });

    it("doesn't expand escaped values", () => {
      expect.assertions(1);
      process.argv.push('--config-file', './test/serverconfig-complex.json');

      const config = ConfigLoader.load(validateMock) as unknown as Record<
        string,
        unknown
      >;

      expect(config.port1).toBe('$PORT');
    });

    it('does not expand inline escaped dollar sign', () => {
      expect.assertions(1);
      process.argv.push('--config-file', './test/serverconfig-complex.json');

      const config = ConfigLoader.load(validateMock);

      expect(config.compressResponse).toBe('compre$$');
    });

    it('handle mixed value', () => {
      expect.assertions(1);
      process.argv.push('--config-file', './test/serverconfig-complex.json');

      const config: any = ConfigLoader.load(validateMock);

      expect(config).toEqual(
        expect.objectContaining({
          test: '$this4444$istrue',
        }),
      );
    });

    it('uses default value', () => {
      expect.assertions(1);

      process.argv.push('--config-file', './test/serverconfig-complex.json');

      const config = ConfigLoader.load(validateMock);

      expect(config).toEqual(
        expect.objectContaining({
          defaultValue: '3444',
        }),
      );
    });

    it('should properly expand values nested in object', () => {
      expect.assertions(1);
      process.argv.push('--config-file', './test/serverconfig-complex.json');

      const config = ConfigLoader.load(validateMock);

      expect(config).toEqual(
        expect.objectContaining({
          serveStatic: {
            resolveUnmatchedPathsWithIndexHtml: 'true',
          },
        }),
      );
    });

    it('should properly expand value in array', () => {
      expect.assertions(1);
      process.argv.push('--config-file', './test/serverconfig-complex.json');

      const config = ConfigLoader.load(validateMock);

      expect(config.initPaths).toStrictEqual(['test', '4444', 'test2']);
    });

    it('should properly expand value in array of object', () => {
      expect.assertions(1);
      process.argv.push('--config-file', './test/serverconfig-complex.json');

      const config = ConfigLoader.load(validateMock);

      expect(config.proxy.proxyAuth).toStrictEqual([
        { a: 'b', apiKey: 'true' },
      ]);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });
  });

  it('properly override json config values with values from yargs', () => {
    process.argv.push(
      '--config-file',
      './test/serverconfig-complex.json',
      '--port',
      '3005',
    );

    const loadedConfig = ConfigLoader.load(validateMock);

    expect(loadedConfig).toBeDefined();
    expect(loadedConfig.port).toBe(3005);
  });
});

import { vol } from 'memfs';
import { loadJsonConfig } from './load-json-config.util';

jest.mock('fs');

const config = {
  port: 3000,
};

const config2 = {
  port: 3001,
  compressResponse: false,
};

vol.fromJSON({
  './test/serverconfig.json': JSON.stringify(config),
  './test/serverconfig2.json': JSON.stringify(config2),
});

describe('loadJsonConfig', () => {
  it('properly loads config', () => {
    const configLoaded = loadJsonConfig({
      filePath: './test/serverconfig.json',
    });
    expect(configLoaded).toBeDefined();
    expect(configLoaded.port).toBe(3000);
  });

  it('properly combines multiple config', () => {
    const configLoaded = loadJsonConfig({
      filePath: ['./test/serverconfig.json', './test/serverconfig2.json'],
      encoding: 'utf-8',
    });

    expect(configLoaded).toBeDefined();
    expect(configLoaded.port).toBe(3001);
    expect(configLoaded.compressResponse).toBe(false);
  });

  it("returns empty object when config file doesn't exist", () => {
    const configLoaded = loadJsonConfig({
      filePath: './test/config.json',
    });
    expect(configLoaded).toMatchObject({});
  });
});

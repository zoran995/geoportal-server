const mockLoadJsonConfig = jest.fn();
const mockLoadYargs = jest.fn();

import { configurator } from './config-loader';
import { DEFAULT_CONFIG_LOCATION } from './utils/load-yargs.util';

jest.mock('./utils/load-json-config.util', () => ({
  loadJsonConfig: mockLoadJsonConfig,
}));
jest.mock('./utils/load-yargs.util', () => ({
  loadYargs: mockLoadYargs,
}));

describe('configurator', () => {
  afterEach(async () => {
    mockLoadYargs.mockClear();
    mockLoadJsonConfig.mockClear();
  });

  it('properly loads from json file', async () => {
    const configFile = './test/serverconfig1.json';
    mockLoadYargs.mockReturnValueOnce({
      'config-file': configFile,
    });
    mockLoadJsonConfig.mockReturnValueOnce({});
    await configurator();
    expect(mockLoadJsonConfig).toHaveBeenCalledWith({ filePath: configFile });
  });

  it('properly override json config values with values from yargs', async () => {
    mockLoadYargs.mockReturnValue({
      'config-file': DEFAULT_CONFIG_LOCATION,
      port: 3005,
    });
    mockLoadJsonConfig.mockReturnValueOnce({
      port: 3002,
    });
    const loadedConfig = await configurator();

    expect(loadedConfig).toBeDefined();
    expect(loadedConfig.port).toBe(3005);
  });
});

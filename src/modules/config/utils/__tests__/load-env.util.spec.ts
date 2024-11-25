import { vol } from 'memfs';
import { loadEnvFile } from '../load-env.util';

jest.mock('fs');

vol.fromJSON({
  './test/.env': 'port=9999',
  './.env': 'port1=1000',
});

describe('loadEnv', () => {
  it('properly load env file from specified path', () => {
    expect.assertions(2);

    const config = loadEnvFile({
      ignoreEnvFile: false,
      envFilePath: ['./test/.env'],
    });

    expect(config).toBeDefined();
    expect(config.port).toBe('9999');
  });

  it('properly load env file from default path', () => {
    expect.assertions(2);

    const config = loadEnvFile({
      ignoreEnvFile: false,
    });

    expect(config).toBeDefined();
    expect(config.port1).toBe('1000');
  });

  it("doesn't load env file when ignoreEnvFile true", () => {
    expect.assertions(1);
    const config = loadEnvFile({
      ignoreEnvFile: true,
      envFilePath: ['./test/.env'],
    });

    expect(config).toEqual({});
  });
});

import { EnvConfigLoader } from './load-env.util';
import { vol } from 'memfs';
import fs from 'fs';
jest.mock('fs');

vol.fromJSON({
  './test/.env': 'port=9999',
  './.env': 'port1=1000',
});

describe('loadEnv', () => {
  let envBackup: NodeJS.ProcessEnv;
  beforeAll(() => {
    envBackup = process.env;
  });
  it('properly load env file from specified path', () => {
    expect.assertions(2);
    const config = EnvConfigLoader.load({
      ignoreEnvFile: false,
      ignoreEnvVars: true,
      envFilePath: './test/.env',
    });
    expect(config).toBeDefined();
    expect(config.port).toBe('9999');
  });

  it('properly load env file from default path', () => {
    expect.assertions(2);
    const config = EnvConfigLoader.load({
      ignoreEnvFile: false,
      ignoreEnvVars: true,
    });
    expect(config).toBeDefined();
    expect(config.port1).toBe('1000');
  });

  it("doesn't load env file when ignoreEnvFile true", () => {
    expect.assertions(1);
    EnvConfigLoader.load({
      ignoreEnvFile: true,
      ignoreEnvVars: true,
      envFilePath: './test/.env',
    });
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');

    expect(readFileSyncSpy).not.toHaveBeenCalled();
  });

  it('properly load env vars', () => {
    expect.assertions(2);
    process.env.port = '2222';
    const config = EnvConfigLoader.load({
      ignoreEnvFile: true,
      ignoreEnvVars: false,
    });
    expect(config).toBeDefined();
    expect(config.port).toBe('2222');
    delete process.env.port;
  });

  it('should return loaded env variables from vars and dotenv', () => {
    expect.assertions(3);
    process.env.name = 'test-var';
    const config = EnvConfigLoader.load({
      ignoreEnvFile: false,
      ignoreEnvVars: false,
      envFilePath: './test/.env',
    });
    expect(config).toBeDefined();
    expect(config.port).toBe('9999');
    expect(config.name).toBe('test-var');
    delete process.env.name;
  });

  it('should choose env vars over dotenv', () => {
    expect.assertions(2);
    process.env.port = '3333';
    const config = EnvConfigLoader.load({
      ignoreEnvFile: false,
      ignoreEnvVars: false,
      envFilePath: './test/.env',
    });
    expect(config).toBeDefined();
    expect(config.port).toBe('3333');
    delete process.env.port;
  });

  it('with default config', () => {
    expect.assertions(2);
    process.env.port = '3333';
    const config = EnvConfigLoader.load();
    expect(config).toBeDefined();
    expect(config.port).toBe('3333');
    delete process.env.port;
  });

  it('should return empty object when dotenv and env vars are ignored', () => {
    expect.assertions(1);
    process.env.port = '3333';
    const config = EnvConfigLoader.load({
      ignoreEnvFile: true,
      ignoreEnvVars: true,
      envFilePath: './test/.env',
    });
    expect(config).toStrictEqual({});
  });

  afterEach(() => {
    process.env = envBackup;
    jest.clearAllMocks();
  });
});

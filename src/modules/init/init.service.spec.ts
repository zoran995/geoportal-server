import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import { IConfigurationType, WWWROOT_TOKEN } from 'src/infrastructure/config';
import { LoggerModule } from 'src/infrastructure/logger';

import { InitService } from './init.service';

jest.mock('fs');

vol.fromJSON({
  './test/init/init.json': 'hello init',
  './test/init/init1/init1.json': 'hello init 1',
  './test/init/init2/init2.json': 'hello init 2',
});

const defaultConfig: Partial<IConfigurationType> = {
  initPaths: ['test/init', 'test/init/init1'],
  'config-file': undefined,
};

const configGet = jest.fn();

const mockConfigReturnValue = (
  config: Record<string, unknown> = defaultConfig,
) => {
  configGet.mockImplementation((key: string) => {
    if (key in config) {
      return config[key];
    }
    return undefined;
  });
};

describe('InitService', () => {
  let service: InitService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        { provide: WWWROOT_TOKEN, useValue: 'test' },
        {
          provide: ConfigService,
          useValue: {
            get: configGet,
          },
        },
        InitService,
      ],
    }).compile();

    service = module.get<InitService>(InitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should properly resolve file path', () => {
    mockConfigReturnValue();
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init.json');
    expect(filePath).toBe(path.resolve('./test/init/init.json'));
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('should properly resolve file path in multiple directories', () => {
    mockConfigReturnValue();
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init1.json');
    expect(filePath).toBe(path.resolve('./test/init/init1/init1.json'));
    expect(existsSyncSpy).toHaveBeenCalledTimes(2);
  });

  it('resolves files only from initPaths directories', () => {
    mockConfigReturnValue();
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init2.json');
    expect(filePath).toBeUndefined();
    expect(existsSyncSpy).toHaveBeenCalledTimes(2);
  });

  it('should properly add WWWROOT_TOKEN init location and use it as a config location', () => {
    const config = { ...defaultConfig };
    config['config-file'] = 'test/test.json';
    config.initPaths = ['init', 'init/init1'];
    mockConfigReturnValue(config);
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init.json');
    expect(configGet).toBeCalledTimes(3);

    expect(filePath).toBeDefined();
    expect(filePath).toBe(path.resolve('.', 'test/init/init.json'));
    expect(existsSyncSpy).toBeCalledTimes(1);
    configGet.mockClear();
  });

  it("should return undefined when file doesn't exist", () => {
    const config = { ...defaultConfig };
    config.initPaths = ['test/init', 'test/init/init1'];
    mockConfigReturnValue(config);
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init-not-found.json');
    expect(filePath).toBeUndefined();
    expect(existsSyncSpy).toHaveBeenCalledTimes(2);
  });
});

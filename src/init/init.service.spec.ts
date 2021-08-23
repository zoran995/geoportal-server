import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import fs from 'fs';
import { when } from 'jest-when';
import { vol } from 'memfs';
import * as path from 'path';
import { LoggerModule } from 'src/common/logger/logger.module';
import { InitService } from './init.service';

jest.mock('fs');

vol.fromJSON({
  './test/init/init.json': 'hello init',
  './test/init/init1/init1.json': 'hello init 1',
  './test/init/init2/init2.json': 'hello init 2',
});

const configGet = jest.fn((key: string): string | string[] | undefined => {
  switch (key) {
    case 'initPaths':
      return ['test/init', 'test/init/init1'];
    case 'config-file':
      return undefined;
  }
  return undefined;
});

describe('InitService', () => {
  let service: InitService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
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

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should properly resolve file path', async () => {
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init.json');
    expect(filePath).toBe(path.resolve('./test/init/init.json'));
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('should properly resolve file path in multiple directories', async () => {
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init1.json');
    expect(filePath).toBe(path.resolve('./test/init/init1/init1.json'));
    expect(existsSyncSpy).toHaveBeenCalledTimes(2);
  });

  it('resolves files only from initPaths directories', async () => {
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init2.json');
    expect(filePath).toBeUndefined();
    expect(existsSyncSpy).toHaveBeenCalledTimes(2);
  });

  it('should properly use config location', async () => {
    const configFile = 'test/test.json';
    when(configGet).calledWith('config-file').mockReturnValueOnce(configFile);
    when(configGet)
      .calledWith('initPaths')
      .mockReturnValueOnce(['init', 'init/init1']);
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init.json');
    expect(configGet).toBeCalledTimes(2);

    expect(filePath).toBeDefined();
    expect(filePath).toBe(path.resolve('.', 'test/init/init.json'));
    expect(existsSyncSpy).toBeCalledTimes(1);
    configGet.mockClear();
  });

  it("should return undefined when file doesn't exist", async () => {
    when(configGet)
      .calledWith('initPaths')
      .mockReturnValueOnce(['test/init', 'test/init/init1']);
    const existsSyncSpy = jest.spyOn(fs, 'existsSync');
    const filePath = service.getFilePath('init-not-found.json');
    expect(filePath).toBeUndefined();
    expect(existsSyncSpy).toHaveBeenCalledTimes(2);
  });
});

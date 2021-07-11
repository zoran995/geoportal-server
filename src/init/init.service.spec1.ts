/* import { NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import fs from 'fs';
import { when } from 'jest-when';
import * as path from 'path';
import { LoggerModule } from 'src/common/logger/logger.module';
import { InitService } from './init.service';
jest.mock('path');
jest.mock('fs');

const configGet = jest.fn((key: string) => {
  switch (key) {
    case 'initPaths':
      return ['test/init', 'test/init/init1'];
    case 'configFile':
      return undefined;
  }
  return undefined;
});

describe('InitService', () => {
  let service: InitService;
  let config: ConfigService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, LoggerModule],
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
    config = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should properly resolve file path', async () => {
    const resolveSpy = jest
      .spyOn(path, 'resolve')
      .mockReturnValue('test/init/init.json');
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const filePath = service.getFilePath('init.json');
    expect(filePath).toBe('test/init/init.json');
    expect(resolveSpy).toHaveBeenCalledTimes(1);
    expect(existsSyncSpy).toHaveBeenCalled();
    expect(existsSyncSpy).toHaveBeenCalledWith('test/init/init.json');
    resolveSpy.mockReset();
    existsSyncSpy.mockReset();
  });

  it('should properly use config location', async () => {
    const configFile = 'test-config-file';
    when(configGet).calledWith('configFile').mockReturnValueOnce(configFile);
    when(configGet)
      .calledWith('initPaths')
      .mockReturnValueOnce(['test/init', 'test/init/init1']);
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const resolveSpy = jest
      .spyOn(path, 'resolve')
      .mockImplementation((...args: string[]) => {
        if (args.length === 1 && args[0] === 'test-config-file') {
          return 'test-config-file';
        }
        return 'test/init/init.json';
      });
    const filePath = service.getFilePath('init.json');
    expect(configGet).toBeCalledTimes(2);

    expect(existsSyncSpy).toHaveBeenCalled();
    expect(existsSyncSpy).toHaveBeenCalledWith('test/init/init.json');
    expect(resolveSpy).toHaveBeenNthCalledWith(1, 'test-config-file');
    expect(resolveSpy).toHaveBeenNthCalledWith(
      2,
      'test-config-file',
      'test/init',
      'init.json',
    );
    expect(filePath).toBeDefined();
    resolveSpy.mockReset();
    existsSyncSpy.mockReset();
    configGet.mockClear();
  });

  it("should return undefined when file doesn't exist", async () => {
    when(configGet)
      .calledWith('initPaths')
      .mockReturnValueOnce(['test/init', 'test/init/init1']);
    const resolveSpy = jest
      .spyOn(path, 'resolve')
      .mockReturnValue('test/init/init.json');
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const filePath = await service.getFilePath('init-not-found.json');
    expect(filePath).toBeUndefined();
    resolveSpy.mockReset();
    existsSyncSpy.mockReset();
  });
});
 */

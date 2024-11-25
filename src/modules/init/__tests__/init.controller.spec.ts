import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock } from '@golevelup/ts-jest';
import { Response } from 'express';
import { vol } from 'memfs';
import * as path from 'path';

import { WWWROOT_TOKEN } from 'src/common/utils';
import { LoggerModule } from 'src/infrastructure/logger';

import { InitController } from '../init.controller';
import { InitService } from '../init.service';

jest.mock('fs');

vol.fromJSON({
  './test/serverconfig.json': 'server config',
  './test/init/init.json': 'hello init',
  './test/init/init1/init1.json': 'hello init 1',
  './test/init/init2/init2.json': 'hello init 2',
});

class ConfigServiceMock {
  get = jest.fn().mockImplementation((key: string) => {
    if (key === 'initPaths') {
      return ['test/init', 'test/init/init1'];
    }
  });
}

const responseMock = createMock<Response>();

describe('InitController', () => {
  let controller: InitController;
  let initService: InitService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [InitController],
      providers: [
        { provide: WWWROOT_TOKEN, useValue: 'test' },
        {
          provide: ConfigService,
          useClass: ConfigServiceMock,
        },
        InitService,
      ],
    }).compile();

    controller = module.get<InitController>(InitController);
    initService = module.get<InitService>(InitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should sanitize filename', () => {
    expect.assertions(3);
    const getFilePathSpy = jest.spyOn(initService, 'getFilePath');
    try {
      controller.serveInitFile(
        { fileName: '../serverconfig.json' },
        responseMock,
      );
    } catch (error) {
      expect(getFilePathSpy).toHaveBeenCalledWith('..serverconfig.json');
      expect(responseMock.sendFile).toBeCalledTimes(0);
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });

  it('should return file', () => {
    controller.serveInitFile({ fileName: 'init.json' }, responseMock);
    expect(responseMock.sendFile).toBeCalledTimes(1);
    expect(responseMock.sendFile).toBeCalledWith(
      path.resolve('.', 'test/init/init.json'),
    );
  });

  it('should return 404 - file not found', () => {
    expect.assertions(2);
    try {
      controller.serveInitFile(
        { fileName: 'init-not-found.json' },
        responseMock,
      );
    } catch (error) {
      expect(responseMock.sendFile).toBeCalledTimes(0);
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });
});

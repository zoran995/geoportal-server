import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { createMock } from '@golevelup/ts-jest';
import { Response } from 'express';
import { vol } from 'memfs';
import * as path from 'path';

import { WWWROOT_TOKEN } from 'src/common/utils';
import { LoggerModule } from 'src/infrastructure/logger';

import { AppConfigModule } from '../../config';
import { InitController } from '../init.controller';
import { InitService } from '../init.service';

jest.mock('fs');

vol.fromJSON({
  './serverconfig.json': JSON.stringify({
    initPaths: ['test/init', 'test/init/init1'],
  }),
  './test/init/init.json': 'hello init',
  './test/init/init1/init1.json': 'hello init 1',
  './test/init/init2/init2.json': 'hello init 2',
});

const responseMock = createMock<Response>();

describe('InitController', () => {
  let controller: InitController;
  let initService: InitService;
  beforeEach(async () => {
    const module = await (
      await Test.createTestingModule({
        imports: [LoggerModule, AppConfigModule],
        controllers: [InitController],
        providers: [{ provide: WWWROOT_TOKEN, useValue: 'test' }, InitService],
      }).compile()
    ).init();

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
      expect(responseMock.sendFile).toHaveBeenCalledTimes(0);
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });

  it('should return file', () => {
    controller.serveInitFile({ fileName: 'init.json' }, responseMock);
    expect(responseMock.sendFile).toHaveBeenCalledTimes(1);
    expect(responseMock.sendFile).toHaveBeenCalledWith(
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
      expect(responseMock.sendFile).toHaveBeenCalledTimes(0);
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });
});

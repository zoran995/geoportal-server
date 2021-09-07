import { createMock } from '@golevelup/ts-jest';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { vol } from 'memfs';
import * as path from 'path';
import { LoggerModule } from 'src/common/logger/logger.module';
import { WWWROOT_TOKEN } from 'src/config/app-config.module';
import { InitController } from './init.controller';
import { InitService } from './init.service';
jest.mock('fs');

vol.fromJSON({
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return file', async () => {
    await controller.serveInitFile({ fileName: 'init.json' }, responseMock);
    expect(responseMock.sendFile).toBeCalledTimes(1);
    expect(responseMock.sendFile).toBeCalledWith(
      path.resolve('.', 'test/init/init.json'),
    );
  });

  it('should return 404 - file not found', async () => {
    try {
      await controller.serveInitFile(
        { fileName: 'init-not-found.json' },
        responseMock,
      );
      expect(responseMock.sendFile).toBeCalledTimes(0);
      expect(responseMock.status).toBe(HttpStatus.NOT_FOUND);
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });
});

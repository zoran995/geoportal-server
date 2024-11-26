import { Test, TestingModule } from '@nestjs/testing';

import { vol } from 'memfs';
import * as path from 'path';

import { LoggerModule } from 'src/infrastructure/logger';

import type { INestApplication } from '@nestjs/common';
import { AppConfigModule } from 'src/modules/config';

import { InitService } from '../init.service';
import { WWWROOT_TOKEN } from 'src/common/utils';

jest.mock('fs');

vol.fromJSON({
  './serverconfig.json': JSON.stringify({
    initPaths: ['test/init', 'test/init/init1'],
  }),
  './test2/init/init2/init.json': 'hello test2 init 2',
  './test/init/init.json': 'hello init',
  './test/init/init1/init1.json': 'hello init 1',
  './test/init/init2/init2.json': 'hello init 2',
});

describe('InitService', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, AppConfigModule],
      providers: [InitService],
    }).compile();

    app = module.createNestApplication();
  });

  it('should be defined', async () => {
    await app.init();

    const service = app.get(InitService);

    expect(service).toBeDefined();
  });

  it('should properly resolve file path', async () => {
    await app.init();
    const service = app.get(InitService);

    const filePath = service.getFilePath('init.json');

    expect(filePath).toBe(path.resolve('./test/init/init.json'));

    await app.close();
  });

  it('should properly resolve file path in multiple directories', async () => {
    vol.fromJSON({
      './serverconfig.json': JSON.stringify({
        initPaths: ['test/init', 'test/init/init1'],
      }),
      './test2/init/init2/init.json': 'hello test2 init 2',
      './test/init/init.json': 'hello init',
      './test/init/init1/init1.json': 'hello init 1',
      './test/init/init2/init2.json': 'hello init 2',
    });
    await app.init();
    const service = app.get(InitService);

    const filePath = service.getFilePath('init1.json');

    expect(filePath).toBe(path.resolve('./test/init/init1/init1.json'));

    await app.close();
  });

  it('resolves files only from initPaths directories', async () => {
    vol.fromJSON({
      './serverconfig.json': JSON.stringify({
        initPaths: ['test/init', 'test/init/init1'],
        'config-file': undefined,
      }),
      './test2/init/init2/init5.json': 'hello test2 init 2',
      './test/init/init.json': 'hello init',
      './test/init/init1/init1.json': 'hello init 1',
      './test/init/init2/init2.json': 'hello init 2',
    });
    await app.init();
    const service = app.get(InitService);

    const filePath = service.getFilePath('init2.json');

    expect(filePath).toBeUndefined();

    await app.close();
  });

  it('should properly add WWWROOT_TOKEN init location and use it as a config location', async () => {
    vol.fromJSON({
      './serverconfig.json': JSON.stringify({
        initPaths: ['test/init', 'test/init/init1'],
      }),
      './test2/init/init5.json': 'hello test2 init 5',
      './test/init/init.json': 'hello init',
      './test/init/init1/init1.json': 'hello init 1',
      './test/init/init2/init2.json': 'hello init 2',
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, AppConfigModule],
      providers: [InitService],
    })
      .overrideProvider(WWWROOT_TOKEN)
      .useValue('./test2')
      .compile();

    app = module.createNestApplication();

    await app.init();
    const service = app.get(InitService);

    const filePath = service.getFilePath('init5.json');

    expect(filePath).toBeDefined();
    expect(filePath).toBe(path.resolve('./test2/init/init5.json'));

    await app.close();
  });
});

import { Test } from '@nestjs/testing';

import { vol } from 'memfs';
import path from 'path';

import { WWWROOT_TOKEN } from 'src/common/utils';

import { serveStatic, type ServeStaticType } from 'src/common/schema';
import { AppServeStatic } from '../app-serve-static';
import { SERVE_STATIC_OPTIONS } from '../serve-static.constants';

jest.mock('fs');

vol.fromJSON({
  'testwwwroot/index.html': 'index.html',
});

describe('AppServeStatic', () => {
  let service: AppServeStatic;
  const options = serveStatic.parse({});

  const setConfig = (target?: Partial<ServeStaticType>) => {
    Object.getOwnPropertyNames(options).forEach((key) => {
      delete options[key as keyof ServeStaticType];
    });
    if (target) {
      Object.assign(options, serveStatic.parse(target));
    }
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: SERVE_STATIC_OPTIONS,
          useValue: options,
        },
        {
          provide: WWWROOT_TOKEN,
          useValue: 'testwwwroot',
        },
        AppServeStatic,
      ],
    }).compile();

    service = module.get<AppServeStatic>(AppServeStatic);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty array when serve static undefined', () => {
    expect.assertions(3);
    setConfig(undefined);

    const serveStaticOptions = service.createLoggerOptions();
    expect(serveStaticOptions).toBeDefined();
    expect(Array.isArray(serveStaticOptions)).toBe(true);
    expect(serveStaticOptions.length).toBe(0);
  });

  it('should return empty array when serveStatic.serveStatic is false', () => {
    expect.assertions(3);
    setConfig({ serveStatic: false });

    const serveStaticOptions = service.createLoggerOptions();
    expect(serveStaticOptions).toBeDefined();
    expect(Array.isArray(serveStaticOptions)).toBe(true);
    expect(serveStaticOptions.length).toBe(0);
  });

  it("should return empty array when index file doesn't exist", () => {
    expect.assertions(3);
    setConfig({
      resolvePathRelativeToWwwroot: 'index1.html',
    });

    const serveStaticOptions = service.createLoggerOptions();
    expect(serveStaticOptions).toBeDefined();
    expect(Array.isArray(serveStaticOptions)).toBe(true);
    expect(serveStaticOptions.length).toBe(0);
  });

  it('should properly resolve options when serve static set', () => {
    setConfig({});
    const options = service.createLoggerOptions();
    expect(options).toBeDefined();
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBe(1);
    expect(options[0]).toMatchObject({
      rootPath: path.resolve('testwwwroot'),
      renderPath: '/',
      serveStaticOptions: expect.anything(),
    });
  });
});

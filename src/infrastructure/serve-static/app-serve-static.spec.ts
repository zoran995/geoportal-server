import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { plainToClass } from 'class-transformer';
import { vol } from 'memfs';
import path from 'path';

import { WWWROOT_TOKEN } from '../config';
import { AppServeStatic } from './app-serve-static';
import { ServeStaticDto } from './dto/serve-static.dto';

jest.mock('fs');
const mockConfigGet = jest.fn();

const defaultConfig = plainToClass(ServeStaticDto, {});
vol.fromJSON({
  'testwwwroot/index.html': 'index.html',
});

const mockConfigReturnValue = (
  serveStaticConfig: ServeStaticDto | undefined,
) => {
  mockConfigGet.mockImplementation((key) => {
    if (key === 'serveStatic') {
      return serveStaticConfig;
    }
    return undefined;
  });
};

describe('AppServeStatic', () => {
  let service: AppServeStatic;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: mockConfigGet,
          },
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
    mockConfigReturnValue(undefined);

    emptyOptions(service);
  });

  it('should return empty array when serveStatic.serveStatic is false', () => {
    expect.assertions(3);
    const config = { ...defaultConfig };
    config.serveStatic = false;
    mockConfigReturnValue(config);

    emptyOptions(service);
  });

  it("should return empty array when index file doesn't exist", () => {
    expect.assertions(3);
    const config = { ...defaultConfig };
    config.resolvePathRelativeToWwwroot = 'index1.html';
    mockConfigReturnValue(config);

    emptyOptions(service);
  });

  it('should properly resolve options when serve static set', () => {
    mockConfigReturnValue(defaultConfig);
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

function emptyOptions(service: AppServeStatic) {
  const options = service.createLoggerOptions();
  expect(options).toBeDefined();
  expect(Array.isArray(options)).toBe(true);
  expect(options.length).toBe(0);
}

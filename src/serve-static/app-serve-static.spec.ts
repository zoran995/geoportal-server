import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { when } from 'jest-when';
import { vol } from 'memfs';
import { WWWROOT_TOKEN } from 'src/config/app-config.module';
import { AppServeStatic } from './app-serve-static';
import { ServeStaticDto } from './dto/serve-static.dto';

jest.mock('fs');
const mockConfigGet = jest.fn();

const defaultConfig = plainToClass(ServeStaticDto, {});
vol.fromJSON({
  'testwwwroot/index.html': 'index.html',
});

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

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty array when serve static undefined', () => {
    mockConfigGet.mockReturnValueOnce(undefined);

    emptyOptions(service);
  });

  it('should return empty array when serveStatic.serveStatic is false', () => {
    const config = { ...defaultConfig };
    config.serveStatic = false;
    when(mockConfigGet).calledWith('serveStatic').mockReturnValueOnce(config);

    emptyOptions(service);
  });

  it("should return empty array when index file doesn't exist", () => {
    const config = { ...defaultConfig };
    config.resolvePathRelativeToWwwroot = 'index1.html';
    when(mockConfigGet).calledWith('serveStatic').mockReturnValueOnce(config);

    emptyOptions(service);
  });

  it('should properly resolve options when serve static set', () => {
    when(mockConfigGet)
      .calledWith('serveStatic')
      .mockReturnValueOnce(defaultConfig);
    const options = service.createLoggerOptions();
    expect(options).toBeDefined();
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBe(1);
    expect(options[0]).toMatchObject({
      rootPath: 'testwwwroot',
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

import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock } from '@golevelup/ts-jest';
import { DirectoryJSON, fs, vol } from 'memfs';
import path from 'path';

import { ServeStaticDto } from 'src/infrastructure/serve-static';

import { HttpExceptionFilter } from '../http-exception.filter';
import { NotFoundExceptionFilter } from '../not-found-exception.filter';

jest.mock('fs');
jest.mock('../http-exception.filter.ts');

const volJson: DirectoryJSON = {
  './test/mockwwwroot/index.html': '<body>mock index html</body>',
};

vol.fromJSON(volJson);

const mockRedirect = jest.fn();
const mockStatus = jest.fn();
const mockSendFile = jest.fn();

const mockExecutionContext = createMock<ExecutionContext>({
  switchToHttp: () => ({
    getResponse: () => ({
      status: mockStatus,
      sendFile: mockSendFile,
      redirect: mockRedirect,
    }),
    getRequest: () => jest.fn(),
  }),
});

const mockConfigGet = jest.fn();
class MockConfigService {
  get = mockConfigGet;
}

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

const spyHttpException = jest.spyOn(HttpExceptionFilter.prototype, 'catch');

describe('NotFoundExceptionFilter', () => {
  const wwwroot = './test/mockwwwroot';
  let configService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useClass: MockConfigService,
        },
      ],
    }).compile();
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(configService).toBeDefined();
  });

  it('should properly initialize filter', () => {
    const filter = new NotFoundExceptionFilter(configService, wwwroot);
    expect(filter).toBeDefined();
  });

  it('properly serves 404 page', () => {
    const filter = new NotFoundExceptionFilter(configService, wwwroot);
    fs.writeFileSync(`${wwwroot}/404.html`, '404!');
    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockSendFile).toHaveBeenCalledTimes(1);
    expect(mockSendFile).toHaveBeenCalledWith(
      path.resolve(`${wwwroot}/404.html`),
    );
    fs.unlinkSync(`${wwwroot}/404.html`);
  });

  it('properly redirect to index html', () => {
    const filter = new NotFoundExceptionFilter(configService, wwwroot);
    mockConfigReturnValue({
      serveStatic: true,
      resolvePathRelativeToWwwroot: '/index.html',
      resolveUnmatchedPathsWithIndexHtml: true,
    });
    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith(303, '/');
  });

  it('calls super error filter when should not resolve index.html', () => {
    const filter = new NotFoundExceptionFilter(configService, wwwroot);
    const config = {
      serveStatic: true,
      resolvePathRelativeToWwwroot: '/index.html',
      resolveUnmatchedPathsWithIndexHtml: false,
    };
    mockConfigReturnValue(config);
    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });

  it("calls super error filter when index file doesn't exist", () => {
    const filter = new NotFoundExceptionFilter(configService, wwwroot);
    const config = {
      serveStatic: true,
      resolvePathRelativeToWwwroot: '/index1.html',
      resolveUnmatchedPathsWithIndexHtml: true,
    };
    mockConfigReturnValue(config);
    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });

  it('calls super error filter when serve static disabled', () => {
    const filter = new NotFoundExceptionFilter(configService, wwwroot);
    mockConfigReturnValue({
      serveStatic: false,
      resolvePathRelativeToWwwroot: '/index.html',
      resolveUnmatchedPathsWithIndexHtml: true,
    });
    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });

  it('calls super error filter when serve static undefined', () => {
    const filter = new NotFoundExceptionFilter(configService, wwwroot);
    mockConfigReturnValue(undefined);
    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });
});

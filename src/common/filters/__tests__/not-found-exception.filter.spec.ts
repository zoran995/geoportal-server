import { ExecutionContext, NotFoundException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-vitest';
import { DirectoryJSON, fs, vol } from 'memfs';
import path from 'path';

import { HttpExceptionFilter } from '../http-exception.filter.js';
import { NotFoundExceptionFilter } from '../not-found-exception.filter.js';

vi.mock('fs');
vi.mock(import('../http-exception.filter.js'));

const volJson: DirectoryJSON = {
  './test/mockwwwroot/index.html': '<body>mock index html</body>',
};

vol.fromJSON(volJson);

const mockRedirect = vi.fn();
const mockStatus = vi.fn();
const mockSendFile = vi.fn();

const mockExecutionContext = createMock<ExecutionContext>({
  switchToHttp: () => ({
    getResponse: () => ({
      status: mockStatus,
      sendFile: mockSendFile,
      redirect: mockRedirect,
    }),
    getRequest: () => vi.fn(),
  }),
});

describe('NotFoundExceptionFilter', () => {
  const wwwroot = './test/mockwwwroot';
  const spyHttpException = vi.spyOn(HttpExceptionFilter.prototype, 'catch');

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should properly initialize filter', () => {
    const filter = new NotFoundExceptionFilter(
      {
        serveStatic: true,
        resolvePathRelativeToWwwroot: '/index.html',
        resolveUnmatchedPathsWithIndexHtml: true,
      },
      wwwroot,
    );
    expect(filter).toBeDefined();
  });

  it('properly serves 404 page', () => {
    const filter = new NotFoundExceptionFilter(
      {
        serveStatic: true,
        resolvePathRelativeToWwwroot: '/index.html',
        resolveUnmatchedPathsWithIndexHtml: false,
      },
      wwwroot,
    );
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
    const filter = new NotFoundExceptionFilter(
      {
        serveStatic: true,
        resolvePathRelativeToWwwroot: '/index.html',
        resolveUnmatchedPathsWithIndexHtml: true,
      },
      wwwroot,
    );

    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith(303, '/');
  });

  it('calls super error filter when should not resolve index.html', () => {
    const filter = new NotFoundExceptionFilter(
      {
        serveStatic: true,
        resolvePathRelativeToWwwroot: '/index.html',
        resolveUnmatchedPathsWithIndexHtml: false,
      },
      wwwroot,
    );

    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });

  it("calls super error filter when index file doesn't exist", () => {
    const filter = new NotFoundExceptionFilter(
      {
        serveStatic: true,
        resolvePathRelativeToWwwroot: '/index1.html',
        resolveUnmatchedPathsWithIndexHtml: true,
      },
      wwwroot,
    );

    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });

  it('calls super error filter when serve static disabled', () => {
    const filter = new NotFoundExceptionFilter(
      {
        serveStatic: false,
        resolvePathRelativeToWwwroot: '/index.html',
        resolveUnmatchedPathsWithIndexHtml: true,
      },
      wwwroot,
    );

    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });

  it('calls super error filter when serve static undefined', () => {
    const filter = new NotFoundExceptionFilter(undefined as never, wwwroot);

    filter.catch(new NotFoundException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });
});

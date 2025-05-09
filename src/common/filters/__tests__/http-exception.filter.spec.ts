import {
  BadRequestException,
  ExecutionContext,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { createMock } from '@golevelup/ts-vitest';

import { ValidationException } from '../../exceptions/index.js';
import { GlobalExceptionFilter } from '../global-exception.filter.js';
import { HttpExceptionFilter } from '../http-exception.filter.js';

vi.mock(import('../global-exception.filter.js'));

const mockStatusJson = vi.fn();
const mockStatus = vi.fn().mockReturnValue({
  json: mockStatusJson,
});
const mockExecutionContext = createMock<ExecutionContext>({
  switchToHttp: () => ({
    getResponse: () => ({
      status: mockStatus,
    }),
    getRequest: () =>
      vi.fn().mockReturnValue({
        url: 'test-url',
      }),
  }),
});

const spyGlobalExceptionCatch = vi.spyOn(
  GlobalExceptionFilter.prototype,
  'catch',
);

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should properly initialize filter', () => {
    expect(filter).toBeDefined();
  });

  it('properly catch NotFoundException', () => {
    const exception = new NotFoundException('test-not-found');
    filter.catch(exception, mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(404);

    expect(mockStatusJson).toHaveBeenCalledTimes(1);
    expect(mockStatusJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: exception.message,
        context: undefined,
      }),
    );
  });

  it('properly catch InternalServerErrorException', () => {
    const exception = new InternalServerErrorException('test-internal-error');
    filter.catch(exception, mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(500);

    expect(mockStatusJson).toHaveBeenCalledTimes(1);
    expect(mockStatusJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: exception.message,
        context: undefined,
      }),
    );
  });

  it('properly catch BadRequestException', () => {
    const exception = new BadRequestException('test-bad-request');
    filter.catch(exception, mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(400);

    expect(mockStatusJson).toHaveBeenCalledTimes(1);
    expect(mockStatusJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: exception.message,
        context: undefined,
      }),
    );
  });

  it('properly handle ValidationException', () => {
    const exception = new ValidationException(new Error('test-bad-request'));
    filter.catch(exception, mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(400);

    expect(mockStatusJson).toHaveBeenCalledTimes(1);
    expect(mockStatusJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: exception.message,
        context: exception.getResponse(),
      }),
    );
  });

  it('calls super error filter when general error', () => {
    filter.catch(new Error('test') as never, mockExecutionContext);
    expect(spyGlobalExceptionCatch).toHaveBeenCalledTimes(1);
  });
});

import {
  BadRequestException,
  ExecutionContext,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { createMock } from '@golevelup/ts-jest';

import { ValidationException } from '../exceptions/validation.exception';
import { GlobalExceptionFilter } from './global-exception.filter';
import { HttpExceptionFilter } from './http-exception.filter';

jest.mock('./global-exception.filter.ts');

const mockStatusJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({
  json: mockStatusJson,
});
const mockExecutionContext = createMock<ExecutionContext>({
  switchToHttp: () => ({
    getResponse: () => ({
      status: mockStatus,
    }),
    getRequest: () =>
      jest.fn().mockReturnValue({
        url: 'test-url',
      }),
  }),
});

const spyGlobalExceptionCatch = jest.spyOn(
  GlobalExceptionFilter.prototype,
  'catch',
);

describe('GlobalExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should properly initialize filter', () => {
    expect(filter).toBeDefined();
  });

  it('properly catch NotFoundException', async () => {
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

  it('properly catch InternalServerErrorException', async () => {
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

  it('properly catch BadRequestException', async () => {
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

  it('properly handle ValidationException', async () => {
    const exception = new ValidationException('test-bad-request');
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

  it('calls super error filter when general error', async () => {
    filter.catch(new Error('test') as any, mockExecutionContext);
    expect(spyGlobalExceptionCatch).toHaveBeenCalledTimes(1);
  });
});

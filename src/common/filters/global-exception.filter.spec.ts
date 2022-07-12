import { ExecutionContext, NotFoundException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-jest';

import { GlobalExceptionFilter } from './global-exception.filter';

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

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should properly initialize filter', () => {
    expect(filter).toBeDefined();
  });

  it('returns 404 on NotFoundException', () => {
    const exception = new NotFoundException('test-not-found');
    filter.catch(exception, mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(404);

    expect(mockStatusJson).toHaveBeenCalledTimes(1);
    expect(mockStatusJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: exception.message,
      }),
    );
  });

  it('returns 404 when statusCode 404', () => {
    const exception = {
      statusCode: 404,
      message: 'test',
    };
    filter.catch(exception, mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(404);

    expect(mockStatusJson).toHaveBeenCalledTimes(1);
    expect(mockStatusJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: exception.message,
      }),
    );
  });

  it('returns 404 when response status 404', () => {
    const exception = {
      response: { status: 404 },
      message: 'test',
    };
    filter.catch(exception, mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(404);

    expect(mockStatusJson).toHaveBeenCalledTimes(1);
    expect(mockStatusJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: exception.message,
      }),
    );
  });

  it('returns 500 on general error', () => {
    filter.catch(new Error('test'), mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(500);

    expect(mockStatusJson).toHaveBeenCalledTimes(1);
    expect(mockStatusJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'test',
      }),
    );
  });
});

import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, NotFoundException } from '@nestjs/common';
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

  it('returns 404 on NotFoundException', async () => {
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

  it('returns 404 when statusCode 404', async () => {
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

  it('returns 404 when response status 404', async () => {
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

  it('returns 500 on general error', async () => {
    filter.catch(new Error('test') as any, mockExecutionContext);
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

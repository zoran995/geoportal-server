import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { DirectoryJSON, fs, vol } from 'memfs';
import path from 'path';
import { HttpExceptionFilter } from './http-exception.filter';
import { InternalServerErrorExceptionFilter } from './internal-server-error-exception.filter';
jest.mock('fs');
jest.mock('./http-exception.filter.ts');

const volJson: DirectoryJSON = {
  './test/mockwwwroot/index.html': '<body>mock index html</body>',
};

vol.fromJSON(volJson);

const mockStatus = jest.fn();
const mockSendFile = jest.fn();

const mockExecutionContext = createMock<ExecutionContext>({
  switchToHttp: () => ({
    getResponse: () => ({
      status: mockStatus,
      sendFile: mockSendFile,
    }),
    getRequest: () => jest.fn(),
  }),
});

const spyHttpException = jest.spyOn(HttpExceptionFilter.prototype, 'catch');

describe('InternalServerErrorExceptionFilter', () => {
  const wwwroot = './test/mockwwwroot';
  let filter: InternalServerErrorExceptionFilter;

  beforeEach(async () => {
    filter = new InternalServerErrorExceptionFilter(wwwroot);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should properly initialize filter', () => {
    expect(filter).toBeDefined();
  });

  it('properly serves 500 page', async () => {
    fs.writeFileSync(`${wwwroot}/500.html`, '500!');
    filter.catch(new InternalServerErrorException(), mockExecutionContext);
    expect(mockStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockSendFile).toHaveBeenCalledTimes(1);
    expect(mockSendFile).toHaveBeenCalledWith(
      path.resolve(`${wwwroot}/500.html`),
    );
    fs.unlinkSync(`${wwwroot}/500.html`);
  });

  it("calls super error filter when 500 page does't exist", async () => {
    filter.catch(new InternalServerErrorException(), mockExecutionContext);
    expect(spyHttpException).toHaveBeenCalledTimes(1);
  });
});

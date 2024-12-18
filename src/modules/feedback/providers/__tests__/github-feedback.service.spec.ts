import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-jest';
import { of, throwError } from 'rxjs';

import { CreateFeedbackDto } from '../../dto/create-feedback.dto';
import { githubFeedback } from '../../config/schema/github-feedback.schema';
import { GithubFeedbackService } from '../github-feedback.service';

describe('GithubFeedbackService', () => {
  const mockExecutionContext = createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({
        ip: '127.0.0.1',
        header: () => {
          return 'test';
        },
      }),
    }),
  });

  const req = mockExecutionContext.switchToHttp().getRequest();

  const githubFeedbackConfig = githubFeedback.parse({
    id: 'github',
    service: 'github',
    issuesUrl: 'http://example.co',
    accessToken: 'test',
  });

  it('should send post request', async () => {
    const httpPostMock = jest.fn();
    httpPostMock.mockReturnValue(
      of({ ok: true, status_code: 200, message: 'Successful' }),
    );
    const service = new GithubFeedbackService(
      githubFeedbackConfig,
      {
        post: httpPostMock,
      } as never,
      { error: jest.fn() } as never,
    );

    const headers = {
      'User-Agent': 'TerriaJS-Bot',
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Token ${githubFeedbackConfig.accessToken}`,
    };

    const payload: CreateFeedbackDto = {
      title: 'title',
      name: 'name',
      email: 'test',
      comment: 'test',
    };

    await service.post(payload, req as never);

    expect(httpPostMock).toHaveBeenCalledTimes(1);
    expect(httpPostMock).toHaveBeenCalledWith(
      githubFeedbackConfig.issuesUrl,
      expect.anything(),
      { headers },
    );
  });

  it('should throw an InternalServerErrorException', async () => {
    expect.assertions(3);
    const headers = {
      'User-Agent': 'TerriaJS-Bot',
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Token ${githubFeedbackConfig.accessToken}`,
    };
    const httpPostMock = jest.fn();
    httpPostMock.mockReturnValue(throwError(() => new Error('test error')));

    const service = new GithubFeedbackService(
      githubFeedbackConfig,
      {
        post: httpPostMock,
      } as never,
      { error: jest.fn() } as never,
    );

    try {
      await service.post({}, req as never);
    } catch (err) {
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(
        githubFeedbackConfig.issuesUrl,
        expect.anything(),
        { headers },
      );
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});

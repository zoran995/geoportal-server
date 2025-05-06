import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-vitest';

import { CreateFeedbackDto } from '../../dto/create-feedback.dto.js';
import { githubFeedback } from '../../config/schema/github-feedback.schema.js';
import { GithubFeedbackService } from '../github-feedback.service.js';

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
    const httpPostMock = vi.fn();
    httpPostMock.mockResolvedValue({
      ok: true,
      status_code: 200,
      message: 'Successful',
    });
    const service = new GithubFeedbackService(
      githubFeedbackConfig,
      {
        post: httpPostMock,
      } as never,
      { error: vi.fn() } as never,
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

    const response = await service.post(payload, req as never);

    expect(httpPostMock).toHaveBeenCalledTimes(1);
    expect(httpPostMock).toHaveBeenCalledWith(
      githubFeedbackConfig.issuesUrl,
      expect.anything(),
      { headers },
    );
    expect(response).toEqual({
      result: 'SUCCESS',
    });
  });

  it('should throw an InternalServerErrorException', async () => {
    expect.assertions(3);
    const headers = {
      'User-Agent': 'TerriaJS-Bot',
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Token ${githubFeedbackConfig.accessToken}`,
    };
    const httpPostMock = vi.fn();
    httpPostMock.mockRejectedValue(new Error('test error'));

    const service = new GithubFeedbackService(
      githubFeedbackConfig,
      {
        post: httpPostMock,
      } as never,
      { error: vi.fn() } as never,
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

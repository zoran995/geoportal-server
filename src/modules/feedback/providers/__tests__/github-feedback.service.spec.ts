import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-jest';
import { plainToClass } from 'class-transformer';
import { of, throwError } from 'rxjs';

import { CreateFeedbackDto } from '../../dto/create-feedback.dto';
import { GithubFeedbackDto } from '../../dto/github-feedback.dto';
import { GithubFeedbackService } from '../github-feedback.service';

const mockHttpPost = jest.fn();
const httpServiceMock = {
  post: mockHttpPost,
};

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

const githubFeedbackConfig = plainToClass(GithubFeedbackDto, {
  id: 'github',
  service: 'github',
  issuesUrl: 'http://example.co',
  accessToken: 'test',
});

describe('GithubFeedbackService', () => {
  let service: GithubFeedbackService;

  beforeEach(() => {
    service = new GithubFeedbackService(
      githubFeedbackConfig,
      httpServiceMock as any,
    );
  });

  afterEach(() => {
    mockHttpPost.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send post request', async () => {
    mockHttpPost.mockReturnValue(
      of({ ok: true, status_code: 200, message: 'Successful' }),
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
    expect(mockHttpPost).toBeCalledTimes(1);
    expect(mockHttpPost).toHaveBeenCalledWith(
      githubFeedbackConfig.issuesUrl,
      expect.anything(),
      { headers },
    );
  });

  it('should throw an InternalServerErrorException', async () => {
    expect.assertions(4);
    const headers = {
      'User-Agent': 'TerriaJS-Bot',
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Token ${githubFeedbackConfig.accessToken}`,
    };
    mockHttpPost.mockReturnValue(throwError(() => new Error('test error')));

    try {
      await service.post({}, req as never);
    } catch (err) {
      expect(mockHttpPost).toBeCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(
        githubFeedbackConfig.issuesUrl,
        expect.anything(),
        { headers },
      );
      expect(mockHttpPost).toBeCalledTimes(1);
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});

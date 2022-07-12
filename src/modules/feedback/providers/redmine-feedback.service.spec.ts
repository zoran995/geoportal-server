import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-jest';
import { of, throwError } from 'rxjs';

import { RedmineFeedbackDto } from '../dto/redmine-feedback.dto';
import { RedmineFeedbackService } from './redmine-feedback.service';

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

const redmineConf: RedmineFeedbackDto = {
  service: 'redmine',
  id: 'test-redmine',
  project_id: 12,
  issuesUrl: 'https://example.com',
  username: 'test',
  password: 'test',
};

describe('RedmineFeedbackService', () => {
  let service: RedmineFeedbackService;

  beforeEach(() => {
    service = new RedmineFeedbackService(redmineConf, httpServiceMock as never);
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
    const auth = {
      username: redmineConf.username,
      password: redmineConf.password,
    };

    await service.post({}, req as never);
    expect(mockHttpPost).toHaveBeenCalledTimes(1);
    expect(mockHttpPost).toHaveBeenCalledWith(
      redmineConf.issuesUrl,
      {
        issue: {
          project_id: redmineConf.project_id,
          subject: undefined,
          description: expect.anything(),
        },
      },
      { auth },
    );
  });

  it('should throw an InternalServerErrorException', async () => {
    expect.assertions(3);
    const auth = {
      username: redmineConf.username,
      password: redmineConf.password,
    };

    mockHttpPost.mockReturnValue(throwError(() => new Error('test error')));

    try {
      await service.post({}, req as never);
    } catch (err) {
      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(
        redmineConf.issuesUrl,
        {
          issue: {
            project_id: redmineConf.project_id,
            subject: undefined,
            description: expect.anything(),
          },
        },
        { auth },
      );
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});

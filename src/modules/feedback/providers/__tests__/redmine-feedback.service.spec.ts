import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-vitest';

import { redmineFeedback } from '../../config/schema/redmine-feedback.schema.js';
import { RedmineFeedbackService } from '../redmine-feedback.service.js';

describe('RedmineFeedbackService', () => {
  const redmineConf = redmineFeedback.parse({
    service: 'redmine',
    id: 'test-redmine',
    project_id: 12,
    issuesUrl: 'https://example.com',
    username: 'test',
    password: 'test',
  });

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

  it('should send post request', async () => {
    const httpPostMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status_code: 200, message: 'Successful' });

    const auth = {
      username: redmineConf.username,
      password: redmineConf.password,
    };

    const service = new RedmineFeedbackService(
      redmineConf,
      {
        post: httpPostMock,
      } as never,
      { error: vi.fn() } as never,
    );
    const result = await service.post({}, req as never);

    expect(httpPostMock).toHaveBeenCalledTimes(1);
    expect(httpPostMock).toHaveBeenCalledWith(
      redmineConf.issuesUrl,
      {
        issue: {
          project_id: redmineConf.project_id,
          subject: undefined,
          description: expect.anything(),
        },
      },
      { ...auth },
    );

    expect(result).toEqual({
      ok: true,
      status_code: 200,
      message: 'Successful',
    });
  });

  it('should throw an InternalServerErrorException', async () => {
    expect.assertions(3);
    const auth = {
      username: redmineConf.username,
      password: redmineConf.password,
    };

    const httpPostMock = vi.fn().mockRejectedValue(new Error('test error'));

    const service = new RedmineFeedbackService(
      redmineConf,
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
        redmineConf.issuesUrl,
        {
          issue: {
            project_id: redmineConf.project_id,
            subject: undefined,
            description: expect.anything(),
          },
        },
        { ...auth },
      );
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});

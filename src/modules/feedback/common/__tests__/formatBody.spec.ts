import { ExecutionContext } from '@nestjs/common';

import { createMock } from '@golevelup/ts-vitest';

import { CreateFeedbackDto } from '../../dto/create-feedback.dto.js';
import { formatBody } from '../formatBody.js';

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

const req: any = mockExecutionContext.switchToHttp().getRequest();

const feedbackPayload: CreateFeedbackDto = {
  title: 'feedback',
  name: 'test',
  email: 'info@geo.test',
  shareLink: 'https://geo.test/test-testid',
  comment: 'everything works correctly',
};

let expected = 'everything works correctly';
expected += '\n\n### User details\n';
expected += `* Name: ${feedbackPayload.name} \n`;
expected += `* Email: ${feedbackPayload.email}\n`;
expected += `* IP Address: ${req.ip}\n`;
expected += `* User Agent: ${req.header('User-Agent')}\n`;
expected += `* Referrer: ${req.header('Referrer')} \n`;
expected += `* Share URL: ${feedbackPayload.shareLink}\n`;

describe('formatBody', () => {
  it('correctly formats the body', () => {
    const result = formatBody(feedbackPayload, req, []);
    expect(result).toBe(expected);
  });
});

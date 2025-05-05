import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-vitest';

import { mailFeedback } from '../../config/schema/mail-feedback.schema.js';
import { MailFeedbackService } from '../mail-feedback.service.js';

describe('MailFeedbackService', () => {
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

  const mailConf = mailFeedback.parse({
    service: 'mail',
    id: 'test-mail',
    smtpHost: 'test',
    smtpPort: 25,
    secure: true,
    email: 'example@test.com',
  });

  it('should properly send feedback', async () => {
    const sendMailMock = vi
      .fn()
      .mockReturnValue(Promise.resolve('test mail success'));

    const service: MailFeedbackService = new MailFeedbackService(
      mailConf,
      { error: vi.fn() } as never,
      {
        sendMail: sendMailMock,
      } as never,
    );
    const result = await service.post({}, req as never);
    expect(result).toEqual('test mail success');
  });

  it('should throw an error InternalServerErrorException', async () => {
    expect.assertions(1);
    const sendMailMock = vi
      .fn()
      .mockReturnValue(Promise.reject('test sending email failed'));

    const service: MailFeedbackService = new MailFeedbackService(
      mailConf,
      { error: vi.fn() } as never,
      {
        sendMail: sendMailMock,
      } as never,
    );

    try {
      await service.post({}, req as never);
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});

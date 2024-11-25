import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { createMock } from '@golevelup/ts-jest';

import { MailFeedbackType } from '../../dto/mail-feedback.dto';
import { MailFeedbackService } from '../mail-feedback.service';

jest.mock('nodemailer');

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

const mailConf: MailFeedbackType = {
  service: 'mail',
  id: 'test-mail',
  smtpHost: 'test',
  smtpPort: 25,
  secure: true,
  email: 'example@test.com',
};

describe('MailFeedbackService', () => {
  const sendMailMock = jest.fn();
  const service: MailFeedbackService = new MailFeedbackService(mailConf, {
    sendMail: sendMailMock,
  } as never);

  it('should properly send feedback', async () => {
    const message = 'test mail success';
    sendMailMock.mockReturnValue(Promise.resolve(message));
    const result = await service.post({}, req as never);
    expect(result).toEqual(message);
  });

  it('should throw an error InternalServerErrorException', async () => {
    expect.assertions(1);
    sendMailMock.mockReturnValue(Promise.reject('test sending email failed'));
    try {
      await service.post({}, req as never);
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});

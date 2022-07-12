import { HttpModule } from '@nestjs/axios';
import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock } from '@golevelup/ts-jest';

import { MailFeedbackDto } from '../dto/mail-feedback.dto';
import { MailFeedbackService } from './mail-feedback.service';

import * as nodemailer from 'nodemailer';

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

const mailConf: MailFeedbackDto = {
  service: 'mail',
  id: 'test-mail',
  smtpHost: 'test',
  smtpPort: 25,
  secure: true,
  email: 'example@test.com',
};

describe('MailFeedbackService', () => {
  let service: MailFeedbackService;
  const sendMailMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: MailFeedbackDto, useValue: mailConf },
        MailFeedbackService,
      ],
    }).compile();
    service = module.get<MailFeedbackService>(MailFeedbackService);

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as never);
  });

  afterEach(() => {
    sendMailMock.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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

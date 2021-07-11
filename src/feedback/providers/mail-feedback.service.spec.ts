import { createMock } from '@golevelup/ts-jest';
import { HttpModule } from '@nestjs/axios';
import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MailFeedbackDto } from '../dto/mail-feedback.dto';
import { MailFeedbackService } from './mail-feedback.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require('nodemailer');
const sendMailMock = jest.fn();

jest.mock('nodemailer');
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: MailFeedbackDto, useValue: mailConf },
        MailFeedbackService,
      ],
    }).compile();
    service = module.get<MailFeedbackService>(MailFeedbackService);
  });

  afterEach(() => {
    sendMailMock.mockClear();
    nodemailer.createTransport.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should properly send feedback', async () => {
    const message = 'test mail success';
    sendMailMock.mockReturnValue(Promise.resolve(message));
    const result = await service.post({}, req as any);
    expect(result).toEqual(message);
  });

  it('should throw an error InternalServerErrorException', async () => {
    sendMailMock.mockReturnValue(Promise.reject('test sending email failed'));
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
    try {
      await service.post({}, req as any);
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
    }
  });
});

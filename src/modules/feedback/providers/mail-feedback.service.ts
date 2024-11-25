import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { Request } from 'express';
import nodemailer from 'nodemailer';

import { formatBody } from '../common/formatBody';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { MailFeedbackType } from '../dto/mail-feedback.dto';
import { AbstractFeedbackService } from './abstract-feedback.service';

@Injectable({})
export class MailFeedbackService extends AbstractFeedbackService<MailFeedbackType> {
  constructor(
    protected readonly options: MailFeedbackType,
    private readonly transporter = nodemailer.createTransport({
      host: options.smtpHost,
      port: options.smtpPort,
      secure: options.secure,
      auth: options.auth,
      tls: {
        rejectUnauthorized: false,
      },
    }),
  ) {
    super(options);
  }

  async post(feedback: CreateFeedbackDto, request: Request): Promise<unknown> {
    return this.transporter
      .sendMail({
        from: feedback.name,
        replyTo: feedback.email,
        to: this.options.email,
        subject: feedback.title,
        text: formatBody(feedback, request, this.options.additionalParameters),
      })
      .then((data) => data)
      .catch(() => {
        throw new InternalServerErrorException();
      });
  }
}

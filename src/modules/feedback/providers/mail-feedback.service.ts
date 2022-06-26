import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { Request } from 'express';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { formatBody } from '../common/formatBody';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { MailFeedbackDto } from '../dto/mail-feedback.dto';
import { AbstractFeedbackService } from './abstract-feedback.service';

@Injectable({})
export class MailFeedbackService extends AbstractFeedbackService<MailFeedbackDto> {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor(protected readonly options: MailFeedbackDto) {
    super(options);
    this.transporter = nodemailer.createTransport({
      host: this.options.smtpHost,
      port: this.options.smtpPort,
      secure: this.options.secure,
      auth: this.options.auth,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async post(feedback: CreateFeedbackDto, request: Request): Promise<any> {
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

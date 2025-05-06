import { Injectable, InternalServerErrorException } from '@nestjs/common';

import type { Request } from 'express';
import nodemailer from 'nodemailer';

import { formatBody } from '../common/formatBody.js';
import { CreateFeedbackDto } from '../dto/create-feedback.dto.js';
import { type MailFeedbackConfigType } from '../config/schema/mail-feedback.schema.js';
import { AbstractFeedbackService } from './abstract-feedback.service.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';

@Injectable({})
export class MailFeedbackService extends AbstractFeedbackService<MailFeedbackConfigType> {
  constructor(
    protected readonly options: MailFeedbackConfigType,
    private readonly logger: LoggerService,
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
      .catch((e: unknown) => {
        this.logger.error(`Creating feedback failed`, e as never);
        throw new InternalServerErrorException();
      });
  }
}

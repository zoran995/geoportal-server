import { Injectable, InternalServerErrorException } from '@nestjs/common';

import type { Request } from 'express';

import { AppHttpService } from 'src/infrastructure/http/app-http-service.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';

import { formatBody } from '../common/formatBody.js';
import { type RedmineFeedbackConfigType } from '../config/schema/redmine-feedback.schema.js';
import { CreateFeedbackDto } from '../dto/create-feedback.dto.js';
import { AbstractFeedbackService } from './abstract-feedback.service.js';

@Injectable()
export class RedmineFeedbackService extends AbstractFeedbackService<RedmineFeedbackConfigType> {
  constructor(
    protected readonly options: RedmineFeedbackConfigType,
    private readonly httpService: AppHttpService,
    private readonly logger: LoggerService,
  ) {
    super(options);
  }

  async post(feedback: CreateFeedbackDto, request: Request): Promise<unknown> {
    try {
      const response = await this.httpService.post(
        this.options.issuesUrl,
        {
          issue: {
            project_id: this.options.project_id,
            subject: feedback.title,
            description: formatBody(
              feedback,
              request,
              this.options.additionalParameters,
            ),
          },
        },
        {
          username: this.options.username,
          password: this.options.password,
        },
      );

      return response;
    } catch (e) {
      this.logger.error(`Creating feedback failed`, e as never);
      throw new InternalServerErrorException();
    }
  }
}

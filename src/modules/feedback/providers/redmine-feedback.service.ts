import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { LoggerService } from 'src/infrastructure/logger';

import { formatBody } from '../common/formatBody';
import { RedmineFeedbackConfigType } from '../config/schema/redmine-feedback.schema';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { AbstractFeedbackService } from './abstract-feedback.service';

@Injectable()
export class RedmineFeedbackService extends AbstractFeedbackService<RedmineFeedbackConfigType> {
  constructor(
    protected readonly options: RedmineFeedbackConfigType,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {
    super(options);
  }

  async post(feedback: CreateFeedbackDto, request: Request): Promise<unknown> {
    return lastValueFrom(
      this.httpService
        .post(
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
            auth: {
              username: this.options.username,
              password: this.options.password,
            },
          },
        )
        .pipe(
          map((res) => res.data as Record<string, unknown>),
          catchError((e) => {
            this.logger.error(`Creating feedback failed`, e as never);
            throw new InternalServerErrorException();
          }),
        ),
    );
  }
}

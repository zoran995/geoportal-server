import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { LoggerService } from 'src/common/logger/logger.service';

import { formatBody } from '../common/formatBody';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { RedmineFeedbackDto } from '../dto/redmine-feedback.dto';
import { AbstractFeedbackService } from './abstract-feedback.service';

@Injectable()
export class RedmineFeedbackService extends AbstractFeedbackService<RedmineFeedbackDto> {
  logger = new LoggerService(RedmineFeedbackService.name);

  constructor(
    protected readonly options: RedmineFeedbackDto,
    private readonly httpService: HttpService,
  ) {
    super(options);
  }

  async post(feedback: CreateFeedbackDto, request: Request): Promise<any> {
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
          map((res) => res.data),
          catchError((e) => {
            this.logger.error(`Creating feedback failed`, e);
            throw new InternalServerErrorException();
          }),
        ),
    );
  }
}

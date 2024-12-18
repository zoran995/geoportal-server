import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { LoggerService } from 'src/infrastructure/logger';

import { formatBody } from '../common/formatBody';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { GithubFeedbackConfigType } from '../config/schema/github-feedback.schema';
import { AbstractFeedbackService } from './abstract-feedback.service';

/**
 * Create a new issue on github.
 */
@Injectable()
export class GithubFeedbackService extends AbstractFeedbackService<GithubFeedbackConfigType> {
  constructor(
    protected readonly options: GithubFeedbackConfigType,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {
    super(options);
  }

  /**
   * Create new issue on github with specific comment
   */
  async post(feedback: CreateFeedbackDto, request: Request): Promise<unknown> {
    const headers = {
      'User-Agent': this.options.userAgent,
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Token ${this.options.accessToken}`,
    };
    return lastValueFrom(
      this.httpService
        .post(
          this.options.issuesUrl,
          {
            title: feedback.title,
            body: formatBody(
              feedback,
              request,
              this.options.additionalParameters,
            ),
          },
          { headers },
        )
        .pipe(
          map(() => {
            return {
              result: 'SUCCESS',
            };
          }),
          catchError((e) => {
            this.logger.error(`Creating feedback failed`, e as never);
            throw new InternalServerErrorException();
          }),
        ),
    );
  }
}

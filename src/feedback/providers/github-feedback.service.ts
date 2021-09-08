import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoggerService } from '../../common/logger/logger.service';
import { formatBody } from '../common/formatBody';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { GithubFeedbackDto } from '../dto/github-feedback.dto';
import { AbstractFeedbackService } from './abstract-feedback.service';

/**
 * Create a new issue on github.
 */
@Injectable()
export class GithubFeedbackService extends AbstractFeedbackService<GithubFeedbackDto> {
  logger = new LoggerService(GithubFeedbackService.name);

  constructor(
    protected readonly options: GithubFeedbackDto,
    private readonly httpService: HttpService,
  ) {
    super(options);
  }

  /**
   * Create new issue on github with specific comment
   */
  async post(feedback: CreateFeedbackDto, request: Request): Promise<any> {
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
            this.logger.error(`Creating feedback failed`, e);
            throw new InternalServerErrorException();
          }),
        ),
    );
  }
}

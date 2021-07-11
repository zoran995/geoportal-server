import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { formatBody } from '../common/formatBody';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { GithubFeedbackDto } from '../dto/github-feedback.dto';
import { AbstractFeedbackService } from './abstract-feedback.service';

/**
 * Create a new issue on github.
 */
@Injectable()
export class GithubFeedbackService extends AbstractFeedbackService<GithubFeedbackDto> {
  logger = new Logger(GithubFeedbackService.name);

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
      await this.httpService
        .post(
          this.options.issuesUrl,
          {
            title: feedback.title,
            body: formatBody(
              feedback,
              this.options.additionalParameters,
              request,
            ),
          },
          { headers },
        )
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            this.logger.error(`Creating feedback failed with: '${e.message}'`);
            throw new InternalServerErrorException();
          }),
        ),
    );
  }
}

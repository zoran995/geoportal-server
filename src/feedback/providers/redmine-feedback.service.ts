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
import { RedmineFeedbackDto } from '../dto/redmine-feedback.dto';
import { AbstractFeedbackService } from './abstract-feedback.service';

@Injectable()
export class RedmineFeedbackService extends AbstractFeedbackService<RedmineFeedbackDto> {
  logger = new Logger(RedmineFeedbackService.name);

  constructor(
    protected readonly options: RedmineFeedbackDto,
    private readonly httpService: HttpService,
  ) {
    super(options);
  }

  async post(feedback: CreateFeedbackDto, request: Request): Promise<any> {
    return lastValueFrom(
      await this.httpService
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
            this.logger.error(`Creating feedback failed with: '${e.message}'`);
            throw new InternalServerErrorException();
          }),
        ),
    );
  }
}

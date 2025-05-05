import { Injectable, InternalServerErrorException } from '@nestjs/common';

import type { Request } from 'express';

import { AppHttpService } from 'src/infrastructure/http/app-http-service.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';

import { formatBody } from '../common/formatBody.js';
import { type GithubFeedbackConfigType } from '../config/schema/github-feedback.schema.js';
import { CreateFeedbackDto } from '../dto/create-feedback.dto.js';
import { AbstractFeedbackService } from './abstract-feedback.service.js';

/**
 * Create a new issue on github.
 */
@Injectable()
export class GithubFeedbackService extends AbstractFeedbackService<GithubFeedbackConfigType> {
  constructor(
    protected readonly options: GithubFeedbackConfigType,
    private readonly httpService: AppHttpService,
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
    try {
      await this.httpService.post(
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
      );

      return {
        result: 'SUCCESS',
      };
    } catch (e) {
      this.logger.error(`Creating feedback failed`, e as never);
      throw new InternalServerErrorException();
    }
  }
}

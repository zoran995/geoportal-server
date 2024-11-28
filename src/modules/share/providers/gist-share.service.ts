import { HttpService } from '@nestjs/axios';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { combineURLs, isDefined } from 'src/common/helpers';
import { LoggerService } from 'src/infrastructure/logger';

import { ShareGistConfig } from '../schema/share-gist.schema';
import { ShareResult } from '../interfaces/save-share-response.interface';
import { AbstractShareService } from './abstract-share.service';
import type { Request } from 'express';

export class GistShareService extends AbstractShareService<ShareGistConfig> {
  constructor(
    protected readonly config: ShareGistConfig,
    private readonly httpService: HttpService,
    logger: LoggerService,
  ) {
    super(config, logger);
  }

  /**
   * Save share configuration using gist.
   */
  public async save(
    data: Record<string, unknown>,
    req: Request,
  ): Promise<ShareResult> {
    const gistFile: Record<string, unknown> = {};
    gistFile[this.config.fileName] = {
      content: JSON.stringify(data),
    };
    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/vnd.github.v3+json',
    };
    if (isDefined(this.config.accessToken)) {
      headers['Authorization'] = `Token ${this.config.accessToken}`;
    }
    return lastValueFrom(
      this.httpService
        .post<{ id: string }>(
          this.config.apiUrl,
          {
            files: gistFile,
            description: this.config.description,
            public: false,
          },
          { headers },
        )
        .pipe(
          map((res) => {
            if (!isDefined(res.data) || !isDefined(res.data.id)) {
              this.logger.error(
                `Got bad response from server: `,
                res.data as never,
              );
              throw new NotFoundException();
            }

            this.logger.verbose(`Created Gist with ID '${res.data.id}`);
            return this.buildResponse(res.data.id, req);
          }),
          catchError((e: unknown) => {
            console.log(e);
            this.logger.error(`Creating share url failed`, e as never);
            if (e instanceof NotFoundException) {
              throw e;
            }
            throw new InternalServerErrorException();
          }),
        ),
    );
  }

  /**
   * Resolve saved share configuration from gist using id.
   */
  public async resolve(id: string): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/vnd.github.v3+json',
    };
    if (this.config.accessToken !== undefined) {
      headers['Authorization'] = `Token ${this.config.accessToken}`;
    }
    const getUrl = combineURLs(this.config.apiUrl, id);
    return lastValueFrom(
      this.httpService
        .get<{
          files: Record<string, { content: Record<string, unknown> }>;
        }>(getUrl, { headers: headers })
        .pipe(
          map((res) => {
            if (
              !isDefined(res.data.files) ||
              Object.keys(res.data.files).length === 0
            ) {
              throw new NotFoundException();
            }
            this.logger.verbose(`Getting share url succeeded`);
            return res.data.files[Object.keys(res.data.files)[0]].content;
          }),
          catchError((e) => {
            this.logger.debug(`Getting share url failed with: '${e.message}'`);
            throw new NotFoundException();
          }),
        ),
    );
  }
}

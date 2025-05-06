import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { type Request } from 'express';

import { combineURLs, isDefined } from 'src/common/helpers/index.js';
import { AppHttpService } from 'src/infrastructure/http/index.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';

import { ShareResult } from '../interfaces/save-share-response.interface.js';
import { ShareGistConfig } from '../schema/share-gist.schema.js';
import { AbstractShareService } from './abstract-share.service.js';

export class GistShareService extends AbstractShareService<ShareGistConfig> {
  constructor(
    protected readonly config: ShareGistConfig,
    private readonly httpService: AppHttpService,
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
      headers.Authorization = `Token ${this.config.accessToken}`;
    }
    try {
      const respose = await this.httpService.post<{ id: string }>(
        this.config.apiUrl,
        {
          files: gistFile,
          description: this.config.description,
          public: false,
        },
        { headers },
      );

      if (!isDefined(respose.id)) {
        this.logger.error(`Got bad response from server: `, respose as never);
        throw new NotFoundException();
      }

      this.logger.verbose(`Created Gist with ID '${respose.id}`);
      return this.buildResponse(respose.id, req);
    } catch (e) {
      this.logger.error(`Creating share url failed`, e as never);
      if (e instanceof NotFoundException) {
        throw e;
      }
      throw new InternalServerErrorException();
    }
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
      headers.Authorization = `Token ${this.config.accessToken}`;
    }
    const getUrl = combineURLs(this.config.apiUrl, id);
    try {
      const response = await this.httpService.get<{
        files: Record<string, { content: Record<string, unknown> }>;
      }>(getUrl, { headers: headers });

      if (
        !isDefined(response.files) ||
        Object.keys(response.files).length === 0
      ) {
        throw new NotFoundException();
      }
      this.logger.verbose(`Getting share url succeeded`);
      return response.files[Object.keys(response.files)[0]].content;
    } catch (e) {
      this.logger.debug(
        `Getting share url failed with: '${(e as Error).message}'`,
      );
      throw new NotFoundException();
    }
  }
}

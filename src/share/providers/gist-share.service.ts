import { HttpService } from '@nestjs/axios';
import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isDefined } from 'class-validator';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { combineURLs } from 'src/common/helpers/combineURLs';
import { ShareGistDto } from '../dto/share-gist.dto';
import { AbstractShareService } from './abstract-share.service';

export class GistShareService extends AbstractShareService<ShareGistDto> {
  private readonly logger = new Logger(GistShareService.name);

  constructor(
    protected readonly config: ShareGistDto,
    private readonly httpService: HttpService,
  ) {
    super(config);
  }

  /**
   * Save share configuration using gist.
   * {@inheritdoc}
   */
  public async save(data: any): Promise<string> {
    const gistFile: any = {};
    gistFile[this.config.fileName] = {
      content: JSON.stringify(data),
    };
    const headers: any = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/vnd.github.v3+json',
    };
    if (isDefined(this.config.accessToken)) {
      headers['Authorization'] = `Token ${this.config.accessToken}`;
    }
    return lastValueFrom(
      this.httpService
        .post(
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
              this.logger.error(`Got bad response from server: '${res.data}'`);
              throw new NotFoundException();
            }
            this.logger.verbose(`Created Gist with ID '${res.data.id}`);
            return <string>res.data.id;
          }),
          catchError((e) => {
            this.logger.error(`Creating share url failed with: '${e.message}'`);
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
   * {@inheritdoc}
   */
  public async resolve(id: string): Promise<any> {
    const headers: any = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/vnd.github.v3+json',
    };
    if (this.config.accessToken !== undefined) {
      headers['Authorization'] = `Token ${this.config.accessToken}`;
    }
    const getUrl = combineURLs(this.config.apiUrl, id);
    return lastValueFrom(
      this.httpService.get(getUrl, { headers: headers }).pipe(
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

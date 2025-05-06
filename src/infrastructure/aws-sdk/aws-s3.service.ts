import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';

import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

import { LoggerService } from 'src/infrastructure/logger/index.js';

import { AWS_CONFIG_OPTIONS } from './aws-s3.contants.js';
import { streamToString } from './stream-to-string.js';

@Injectable()
export class AwsS3Service {
  private readonly _s3: S3Client;

  constructor(
    @Optional()
    @Inject(AWS_CONFIG_OPTIONS)
    private readonly options: S3ClientConfig,
    private readonly logger: LoggerService,
  ) {
    this._s3 = new S3Client(this.options);
    this.logger.setContext(AwsS3Service.name);
  }

  async save(params: PutObjectCommandInput) {
    try {
      const putObjectCommand = new PutObjectCommand(params);
      const info = await this._s3.send(putObjectCommand);

      this.logger.verbose(`Saved key in S3`);
      return info;
    } catch (err) {
      this.logger.error(
        'An error occured while saving to S3',
        JSON.stringify(err),
      );
      throw err;
    }
  }

  async resolveObject(params: GetObjectCommandInput) {
    const getObjectCommand = new GetObjectCommand(params);
    try {
      const { Body: body } = await this._s3.send(getObjectCommand);
      if (body instanceof Readable) {
        return await streamToString(body);
      }
      throw new InternalServerErrorException();
    } catch (err) {
      this.logger.error(
        'An error occured while resolving from S3',
        JSON.stringify(err),
      );
      throw err;
    }
  }
}

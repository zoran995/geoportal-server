import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectOutput,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { Readable } from 'stream';
import { AWS_CONFIG_OPTIONS } from './aws-s3.contants';
import { streamToString } from './stream-to-string';

@Injectable()
export class AwsS3Service {
  private readonly _s3: S3Client;
  private readonly logger = new LoggerService(AwsS3Service.name);

  constructor(
    @Optional()
    @Inject(AWS_CONFIG_OPTIONS)
    private readonly options: S3ClientConfig,
  ) {
    this._s3 = new S3Client(this.options);
  }

  async save(params: PutObjectCommandInput) {
    const putObjectCommand = new PutObjectCommand(params);
    return this._s3
      .send(putObjectCommand)
      .then((info: PutObjectOutput) => {
        this.logger.verbose(`Saved key in S3`);
        return info;
      })
      .catch((err) => {
        this.logger.error(
          'An error occured while saving to S3',
          JSON.stringify(err),
        );
        throw err;
      });
  }

  async resolveObject(params: GetObjectCommandInput) {
    const getObjectCommand = new GetObjectCommand(params);
    return this._s3
      .send(getObjectCommand)
      .then(({ Body: body }) => {
        if (body instanceof Readable) {
          return streamToString(body);
        }
        throw new InternalServerErrorException();
      })
      .catch((err) => {
        this.logger.error(
          'An error occured while resolving from S3',
          JSON.stringify(err),
        );
        throw err;
      });
  }
}

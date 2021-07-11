import { Inject, Injectable, Optional } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { LoggerService } from 'src/common/logger/logger.service';
import { AWS_CONFIG_OPTIONS } from './aws-s3.contants';

@Injectable()
export class AwsS3Service {
  private readonly _s3: AWS.S3;
  private readonly logger = new LoggerService(AwsS3Service.name);

  constructor(
    @Optional()
    @Inject(AWS_CONFIG_OPTIONS)
    private readonly options: AWS.S3.Types.ClientConfiguration,
  ) {
    this._s3 = new AWS.S3(this.options);
  }

  async save(
    params: AWS.S3.Types.PutObjectRequest,
  ): Promise<AWS.S3.PutObjectOutput | AWS.AWSError> {
    return this._s3
      .putObject(params)
      .promise()
      .then((info: AWS.S3.Types.PutObjectOutput) => {
        this.logger.verbose(`Saved key in S3`);
        return info;
      })
      .catch((err: AWS.AWSError) => {
        this.logger.error(err.message, `error[S3]: ${JSON.stringify(err)}`);
        throw err;
      });
  }

  async resolveObject(
    params: AWS.S3.Types.GetObjectRequest,
  ): Promise<string | AWS.AWSError> {
    return this._s3
      .getObject(params)
      .promise()
      .then((fileData) => {
        return fileData.Body.toString('utf-8');
      })
      .catch((err: AWS.AWSError) => {
        this.logger.error(err.message, `error[S3]: ${JSON.stringify(err)}`);
        throw err;
      });
  }
}

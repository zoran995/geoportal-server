import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Agent, { HttpsAgent } from 'agentkeepalive';
import baseX from 'base-x';
import * as crypto from 'crypto';
import { AwsS3Service } from 'src/aws-sdk/aws-s3.service';
import { ShareS3Dto } from '../dto/share-s3.dto';
import { AbstractShareService } from './abstract-share.service';

const agentConfig: Agent.HttpOptions = {
  keepAlive: true,
  maxSockets: 2,
  maxFreeSockets: 2,
  timeout: 60000,
};

@Injectable()
export class S3ShareService extends AbstractShareService<ShareS3Dto> {
  private readonly logger = new Logger(S3ShareService.name);
  private readonly awsS3Service: AwsS3Service;

  constructor(protected readonly config: ShareS3Dto) {
    super(config);
    this.awsS3Service = new AwsS3Service({
      credentials: config.credentials,
      region: config.region,
      httpOptions: {
        agent: new HttpsAgent(agentConfig),
      },
      logger: this.logger,
    });
  }

  /**
   * Save share configuration in s3 bucket
   * {@inheritdoc}
   */
  async save(data: any): Promise<string> {
    const id = shortId(data, this.config.keyLength);
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.config.bucket,
      Key: idToObject(id),
      Body: JSON.stringify(data),
    };
    return this.awsS3Service
      .save(params)
      .then((response: AWS.S3.Types.PutObjectOutput) => {
        this.logger.verbose(
          `Saved key ${id} to S3 bucket ${params.Bucket}: ${params.Key}. Etag: ${response.ETag}`,
        );
        return id;
      })
      .catch((err: AWS.AWSError) => {
        this.logger.error(
          `An error occurred while saving to S3 Bucket ${params.Bucket}: ${err.message}`,
          `[S3Share]: ${JSON.stringify(err.message)}`,
        );
        throw new InternalServerErrorException();
      });
  }

  /**
   * Resolve saved share configuration from s3 bucket
   * {@inheritdoc}
   */
  async resolve(id: string): Promise<string> {
    const params = {
      Bucket: this.config.bucket,
      Key: idToObject(id),
    };

    return this.awsS3Service
      .resolveObject(params)
      .then((data: string) => {
        return data;
      })
      .catch((err: AWS.AWSError) => {
        this.logger.error(err.message, `error[S3]: ${JSON.stringify(err)}`);
        throw new NotFoundException();
      });
  }
}

// We append some pseudo-dir prefixes into the actual object ID to avoid thousands of objects in a single pseudo-directory.
// MyRaNdoMkey => M/y/MyRaNdoMkey
export const idToObject = (id: string) => id.replace(/^(.)(.)/, '$1/$2/$1$2');

/*
  Generate short ID by hashing body, converting to base62 then truncating.
 */
export function shortId(body: any, length: number): string {
  const hmac = crypto.createHmac('sha1', JSON.stringify(body)).digest();
  const BASE62 =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bs62 = baseX(BASE62);
  const fullkey = bs62.encode(hmac);
  return fullkey.slice(0, length); // if length undefined, return the whole thing
}

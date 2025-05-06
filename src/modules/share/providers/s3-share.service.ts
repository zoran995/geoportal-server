import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import baseX from 'base-x';
import * as crypto from 'crypto';
import type { Request } from 'express';
import http from 'http';
import https from 'https';

import { AwsS3Service } from 'src/infrastructure/aws-sdk/aws-s3.service.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';

import { ShareS3Config } from '../schema/share-s3.schema.js';
import { ShareResult } from '../interfaces/save-share-response.interface.js';
import { AbstractShareService } from './abstract-share.service.js';

const agentConfig: https.AgentOptions = {
  keepAlive: true,
  maxSockets: 2,
  maxFreeSockets: 2,
  timeout: 60000,
};

// We append some pseudo-dir prefixes into the actual object ID to avoid thousands of objects in a single pseudo-directory.
// MyRaNdoMkey => M/y/MyRaNdoMkey
export const idToPath = (id: string) => `${id[0]}/${id[1]}/${id}`;

export const generateShareId = (
  data: Record<string, unknown>,
  keyLength = 58,
): string => {
  const hmac = crypto.createHmac('sha1', JSON.stringify(data)).digest();
  const BASE62 =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const bs62 = baseX(BASE62);
  const fullkey = bs62.encode(hmac);
  return fullkey.slice(0, keyLength); // if length undefined, return the whole thing
};

export class S3ShareService extends AbstractShareService<ShareS3Config> {
  private readonly awsS3Service: AwsS3Service;

  constructor(
    protected readonly config: ShareS3Config,
    protected readonly logger: LoggerService,
    awsLogger: LoggerService,
  ) {
    super(config, logger);
    this.awsS3Service = new AwsS3Service(
      {
        credentials: config.credentials ? { ...config.credentials } : undefined,
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: config.forcePathStyle,
        requestHandler: new NodeHttpHandler({
          httpsAgent: new https.Agent(agentConfig),
          httpAgent: new http.Agent(agentConfig),
        }),
      },
      awsLogger,
    );
  }

  /**
   * Save share configuration in s3 bucket
   */
  async save(
    data: Record<string, unknown>,
    req: Request,
  ): Promise<ShareResult> {
    const id = generateShareId(data, this.config.keyLength);
    const params: PutObjectCommandInput = {
      Bucket: this.config.bucket,
      Key: idToPath(id),
      Body: JSON.stringify(data),
    };
    return this.awsS3Service
      .save(params)
      .then((response) => {
        this.logger.verbose(
          `Saved key ${id} to S3 bucket ${params.Bucket}: ${params.Key}. Etag: ${response.ETag}`,
        );

        return this.buildResponse(id, req);
      })
      .catch((err: unknown) => {
        const error = err as Error;
        this.logger.error(
          `An error occurred while saving to S3 Bucket ${params.Bucket}: ${
            error.message as never
          }`,
          `[S3Share]: ${JSON.stringify(error.message)}`,
        );
        throw new InternalServerErrorException();
      });
  }

  /**
   * Resolve saved share configuration from s3 bucket
   */
  async resolve(id: string): Promise<Record<string, unknown>> {
    const params = {
      Bucket: this.config.bucket,
      Key: idToPath(id),
    };

    return this.awsS3Service
      .resolveObject(params)
      .then((data: string) => {
        return JSON.parse(data) as Record<string, unknown>;
      })
      .catch((err: unknown) => {
        const error = err as Error;
        this.logger.error(error.message, `error[S3]: ${JSON.stringify(error)}`);
        throw new NotFoundException();
      });
  }
}

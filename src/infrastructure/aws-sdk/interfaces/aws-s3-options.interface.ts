import { S3ClientConfig } from '@aws-sdk/client-s3';
import { ModuleMetadata } from '@nestjs/common';

export interface AwsS3ModuleAsyncOption
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<S3ClientConfig> | S3ClientConfig;
  inject?: any[];
}
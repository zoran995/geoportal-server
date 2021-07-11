import { Equals, IsOptional, IsString } from 'class-validator';
import { ShareType } from '../types/share.type';
import { ShareDto } from './share.dto';

export class ShareS3Dto extends ShareDto {
  @IsString()
  @Equals('s3')
  readonly service: ShareType = 's3';
  /**
   * The AWS region
   */
  @IsString()
  readonly region: string;

  /**
   * An existing S3 bucket in which to store objects
   */
  @IsString()
  readonly bucket: string;

  /**
   * Credentials of a user with S3 getObject and putObject permission on the above bucket.
   * If not provided here, you must ensure they're available as environment variables or in a shared credentials file.
   * See {@link http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html node configuring aws guide}.
   */
  @IsOptional()
  readonly credentials?: {
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
  };

  /**
   * The length of the random share key to generate (not including prefix), up to 54 characters. Defaults to the full length.
   */
  @IsString()
  @IsOptional()
  readonly keyLength?: number;
}

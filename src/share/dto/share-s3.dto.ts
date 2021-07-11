import { Equals, IsOptional, IsString } from 'class-validator';
import { ShareType } from '../types/share.type';
import { ShareDto } from './share.dto';

export class ShareS3Dto extends ShareDto {
  @IsString()
  @Equals('s3')
  readonly service: ShareType = 's3';

  @IsString()
  readonly region: string;

  @IsString()
  readonly bucket: string;

  @IsOptional()
  readonly credentials?: {
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
  };

  @IsString()
  @IsOptional()
  readonly keyLength?: number;
}

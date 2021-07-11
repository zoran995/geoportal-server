import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ArrayContainsObjectKey } from 'src/common/validators/array-contains-object-key.validator';
import { ShareGistDto } from './share-gist.dto';
import { ShareS3Dto } from './share-s3.dto';
import { ShareDto } from './share.dto';

export class ShareConfigDto {
  /**
   * Which service (of those defined in `availablePrefixes`) should be used when
   * new URLs are requested.
   */
  @IsAlphanumeric()
  @IsNotEmpty()
  newPrefix: string;

  /**
   * Max payload size for share in kb.
   */
  @IsNumber()
  @IsOptional()
  maxRequestSize = 200;

  /**
   * List of available configurations for share urls.
   */
  @IsDefined()
  @ArrayContainsObjectKey('newPrefix', 'prefix')
  @ValidateNested({ each: true })
  @Type(() => ShareDto, {
    discriminator: {
      property: 'service',
      subTypes: [
        { value: ShareGistDto, name: 'gist' },
        { value: ShareS3Dto, name: 's3' },
      ],
    },
  })
  availablePrefixes: (ShareGistDto | ShareS3Dto)[];
}

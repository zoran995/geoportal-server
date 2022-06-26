import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { JSONSchema } from 'class-validator-jsonschema';

import { ArrayContainsObjectKey, NotNull } from 'src/common/validators';

import { ShareGistDto } from './share-gist.dto';
import { ShareS3Dto } from './share-s3.dto';
import { ShareDto } from './share.dto';

export class ShareConfigDto {
  /**
   * Which service (of those defined in {@link ShareConfigDto.availablePrefixes}) should be used when
   * new URLs are requested.
   */
  @IsAlphanumeric()
  @IsNotEmpty()
  newPrefix?: string;

  /**
   * Max payload size for share in kb.
   */
  @IsNumber()
  @NotNull()
  maxRequestSize: number = 200;

  /**
   * List of available configurations for share urls.
   */
  @IsDefined()
  @IsArray()
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
  @JSONSchema({
    items: {
      oneOf: [
        { $ref: '#/definitions/ShareGistDto' },
        { $ref: '#/definitions/ShareS3Dto' },
      ],
    },
    type: 'array',
  })
  availablePrefixes!: (ShareGistDto | ShareS3Dto)[];
}

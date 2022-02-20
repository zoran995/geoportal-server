import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ArrayContainsObjectKey } from '../../common/validators/array-contains-object-key.validator';
import { NotNull } from '../../common/validators/not-null.validator';
import { ShareGistDto } from './share-gist.dto';
import { ShareS3Dto } from './share-s3.dto';
import { ShareDto } from './share.dto';
import { JSONSchema } from 'class-validator-jsonschema';

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
  maxRequestSize = 200;

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

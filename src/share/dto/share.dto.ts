import { IsAlphanumeric, IsDefined, IsIn, IsString } from 'class-validator';
import { ShareType, ShareTypeArr } from '../types/share.type';

export class ShareDto {
  /**
   * Identification of the service to be used
   */
  @IsString()
  @IsDefined()
  @IsIn(ShareTypeArr)
  service: ShareType;

  /**
   * Prefix for this service
   */
  @IsAlphanumeric()
  @IsDefined()
  prefix: string;
}

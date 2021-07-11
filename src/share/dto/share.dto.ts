import { IsAlphanumeric, IsDefined, IsIn, IsString } from 'class-validator';
import { ShareType, ShareTypeArr } from '../types/share.type';

export class ShareDto {
  @IsString()
  @IsDefined()
  @IsIn(ShareTypeArr)
  service: ShareType;

  @IsAlphanumeric()
  @IsDefined()
  prefix: string;
}

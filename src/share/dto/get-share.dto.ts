import { IsString } from 'class-validator';

export class GetShareDto {
  /**
   * Id of the share config
   */
  @IsString()
  id: string;
}

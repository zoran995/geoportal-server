import { IsNotEmpty, IsString } from 'class-validator';

export class GetShareDto {
  /**
   * Id of the share config
   */
  @IsString()
  @IsNotEmpty()
  id!: string;
}

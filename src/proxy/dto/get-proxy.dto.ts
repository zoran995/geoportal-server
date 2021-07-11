import { IsNotEmpty, IsUrl } from 'class-validator';

export class GetProxyDto {
  /**
   * Name of the requested file.
   */
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

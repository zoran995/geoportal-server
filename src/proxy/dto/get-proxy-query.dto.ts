import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetProxyQueryDto {
  /**
   * Name of the requested file.
   */

  @IsNotEmpty()
  target: string;

  @IsOptional()
  @IsString()
  duration?: string;
}

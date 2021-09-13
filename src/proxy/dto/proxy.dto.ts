import { ApiHideProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ProxyWithDurationDto {
  /**
   * The amount of time to cache for. This will override what the original server specified because we know better than they do.
   */
  @IsString()
  duration?: string;

  /**
   * An url to proxy to
   */
  @ApiHideProperty()
  @IsString()
  '0': string;
}

export class ProxyDto {
  /**
   * An url to proxy to
   */
  @ApiHideProperty()
  @IsString()
  '0': string;
}

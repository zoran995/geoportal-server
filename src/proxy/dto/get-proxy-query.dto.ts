import { IsNotEmpty, IsString } from 'class-validator';
import { NotNull } from 'src/common/validators/not-null.validator';

export class GetProxyQueryDto {
  /**
   * Target to proxy to
   */
  @IsString()
  @IsNotEmpty()
  target!: string;

  /**
   * Duration of the cache
   */
  @NotNull()
  @IsString()
  duration?: string;
}

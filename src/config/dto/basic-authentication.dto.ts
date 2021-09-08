import {
  IsAlphanumeric,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { NotNull } from '../../common/validators/not-null.validator';
import { RateLimitDto } from './rate-limit.dto';

export class BasicAuthenticationDto {
  /**
   * Username of the user that is used for login.
   */
  @IsAlphanumeric()
  @IsNotEmpty()
  username!: string;

  /**
   * Password of the user that is used for login.
   */
  @IsAlphanumeric()
  @IsNotEmpty()
  password!: string;

  /**
   * Rate limits basic authentication requests. Note that this uses simple
   * in-memory storage of requests, which means that the actual allowed rate
   * will be higher when multiple terriajs-server processes. The first two wait
   * times after `freeRetries` are `minWait`. Successive wait times are the sum
   * of the two previous wait times, up to `maxWait`.
   */
  @IsObject()
  @NotNull()
  @ValidateNested()
  rateLimit?: RateLimitDto;
}

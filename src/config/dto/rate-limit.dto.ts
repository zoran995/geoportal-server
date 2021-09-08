import { IsNumber } from 'class-validator';
import { NotNull } from '../../common/validators/not-null.validator';

export class RateLimitDto {
  /**
   * The number of retries the user gets before they need to start waiting.
   */
  @IsNumber()
  @NotNull()
  freeRetries = 2;

  /**
   * The initial wait time (in milliseconds) after the free retries above.
   */
  @IsNumber()
  @NotNull()
  minWait = 200;
  /**
   * The maximum time that the user will need to wait.
   */
  @IsNumber()
  @NotNull()
  maxWait = 6000;
}

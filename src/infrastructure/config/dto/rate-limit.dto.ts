import { IsInt } from 'class-validator';

import { NotNull } from 'src/common/validators/not-null.validator';

export class RateLimitDto {
  /**
   * The number of retries the user gets before they need to start waiting.
   */
  @IsInt()
  @NotNull()
  freeRetries = 2;

  /**
   * The initial wait time (in milliseconds) after the free retries above.
   */
  @IsInt()
  @NotNull()
  minWait = 200;
  /**
   * The maximum time that the user will need to wait.
   */
  @IsInt()
  @NotNull()
  maxWait = 6000;
}

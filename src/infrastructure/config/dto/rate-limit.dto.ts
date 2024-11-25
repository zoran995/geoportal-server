import { z } from 'zod';

export const rateLimit = z.object({
  /**
   * The number of retries the user gets before they need to start waiting.
   */
  freeRetries: z.number().int().min(0).default(2),
  /**
   * The initial wait time (in milliseconds) after the free retries above
   * have been used.
   */
  minWait: z.number().int().min(0).default(200),
  /**
   * The maximum time that the user will need to wait.
   */
  maxWait: z.number().int().min(0).default(6000),
});

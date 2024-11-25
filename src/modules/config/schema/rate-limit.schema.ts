import { z } from 'zod';

export const rateLimit = z.object({
  freeRetries: z
    .number()
    .int()
    .min(0)
    .default(2)
    .describe(
      'The number of retries the user gets before they need to start waiting.',
    ),

  minWait: z
    .number()
    .int()
    .min(0)
    .default(200)
    .describe(
      'The initial wait time (in milliseconds) after the free retries above have been used.',
    ),

  maxWait: z
    .number()
    .int()
    .min(0)
    .default(6000)
    .describe('The maximum time that the user will need to wait.'),
});

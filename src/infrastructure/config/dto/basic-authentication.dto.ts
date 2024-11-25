import { z } from 'zod';

import { rateLimit } from './rate-limit.dto';
import { createZodDto } from 'nestjs-zod';

export const basicAuthentication = z.object({
  username: z
    .string()
    .min(1)
    .describe('Username of the user that is used for login.'),
  password: z
    .string()
    .min(1)
    .describe('Password of the user that is used for login.'),
  /**
   * Rate limits basic authentication requests. Note that this uses simple
   * in-memory storage of requests, which means that the actual allowed rate
   * will be higher when multiple terriajs-server processes. The first two wait
   * times after `freeRetries` are `minWait`. Successive wait times are the sum
   * of the two previous wait times, up to `maxWait`.
   */
  rateLimit: rateLimit,
});

export type BasicAuthenticationType = z.infer<typeof basicAuthentication>;

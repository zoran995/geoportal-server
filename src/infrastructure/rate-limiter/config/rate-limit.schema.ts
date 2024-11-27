import { z } from 'zod';

export const rateLimit = z.object({
  points: z
    .number()
    .int()
    .min(0)
    .default(5)
    .describe('Maximum number of points can be consumed over duration.'),

  duration: z
    .number()
    .int()
    .min(0)
    .default(1)
    .describe(
      'Number of seconds before consumed points are reset, starting from the time of the first consumed point on a key. Points will be reset every second if the duration is set to 1 second.',
    ),

  blockDuration: z
    .number()
    .int()
    .min(0)
    .default(5)
    .describe(
      'If blockDuration is a positive number and more points are consumed than available, the limiter prolongs points lifetime for blockDuration seconds. It rejects further consume calls for that key during this blockDuration time.',
    ),
});

export type RateLimitConfigType = z.infer<typeof rateLimit>;

import { z } from 'zod';

export const contentSecurityPolicy = z.object({
  scriptSrc: z
    .array(z.string())
    .default(["'self'", "'unsafe-inline'", "'unsafe-eval'"]),
  connectSrc: z.array(z.string()).default(['*']),
  imgSrc: z.array(z.string()).default(["'self'", 'data:', '*']),
  frameSrc: z.array(z.string()).default([]),
  frameAncestors: z.array(z.string()).default([]),
});

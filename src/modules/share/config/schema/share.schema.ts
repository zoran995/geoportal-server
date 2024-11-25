import { z } from 'zod';

export const share = z.object({
  service: z.enum(['gist', 's3'] as const),
  prefix: z.string().min(1),
});

export type ShareType = z.infer<typeof share>;

import { z } from 'zod';

import { ShareType } from '../types/share.type';

export const share = z.object({
  service: z.enum(ShareType),
  prefix: z.string().min(1),
});

export type ShareType = z.infer<typeof share>;

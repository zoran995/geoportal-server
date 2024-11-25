import { z } from 'zod';

import { ShareTypeArr } from '../types/share.type';

export const share = z.object({
  service: z.enum(ShareTypeArr),
  prefix: z.string().min(1),
});

export type ShareType = z.infer<typeof share>;

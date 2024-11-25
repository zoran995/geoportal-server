import { z } from 'zod';

import { shareGist } from './share-gist.dto';
import { shareS3 } from './share-s3.dto';

export const shareConfig = z.object({
  newPrefix: z
    .string()
    .min(1)
    .optional()
    .describe('Which service should be used when new URLs are requested.'),
  maxRequestSize: z
    .number()
    .int()
    .positive()
    .default(200)
    .describe('Max payload size for share in kb.'),

  availablePrefixes: z
    .array(z.union([shareGist, shareS3]))
    .describe('List of available configurations for share urls.'),
});
export type ShareConfigType = z.infer<typeof shareConfig>;

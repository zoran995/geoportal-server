import { z } from 'zod';

import { share } from './share.schema';

export const shareGist = share.extend({
  service: z.literal('gist'),
  apiUrl: z
    .string()
    .url()
    .default('https://api.github.com/gists')
    .describe('Url of gist api.'),

  accessToken: z
    .string()
    .min(1)
    .optional()
    .describe('Github access token with access to create gist.'),

  userAgent: z
    .string()
    .optional()
    .default('TerriaJS-Server')
    .describe('User agent HTTP Header to set'),

  fileName: z
    .string()
    .optional()
    .default('usercatalog.json')
    .describe('The filename to give to the gist file'),

  description: z
    .string()
    .optional()
    .default('User-created catalog')
    .describe('The description attached to each Gist'),
});

export type ShareGistType = z.infer<typeof shareGist>;

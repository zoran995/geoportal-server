import { z } from 'zod';

import { baseFeedback } from './base-feedback.schema.js';

export const redmineFeedback = baseFeedback.extend({
  service: z.literal('redmine'),

  project_id: z.number().int().min(1).describe('Id of redmine project.'),

  issuesUrl: z
    .string()
    .url()
    .describe(
      'Redmine API url for creating issues. See https://www.redmine.org/projects/redmine/wiki/Rest_Issues for details',
    ),

  username: z
    .string()
    .min(1)
    .describe(
      'Username that will be used for authenticating on redmine and creating new issues.',
    ),

  password: z
    .string()
    .min(1)
    .describe('Password for authenticating on redmine.'),
});

export type RedmineFeedbackConfigType = z.infer<typeof redmineFeedback>;

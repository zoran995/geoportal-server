import { z } from 'zod';
import { baseFeedback } from './base-feedback.schema';

export const githubFeedback = baseFeedback.extend({
  service: z.literal('github'),

  issuesUrl: z
    .string()
    .url()
    .describe(
      'Github API issues url. See https://docs.github.com/en/rest/reference/issues#create-an-issue for details',
    ),

  accessToken: z
    .string()
    .min(1)
    .describe('Github access token with permission to create issue.'),

  userAgent: z
    .string()
    .optional()
    .default('TerriaJS-Bot')
    .describe('Http user agent.'),
});

export type GithubFeedbackConfigType = z.infer<typeof githubFeedback>;

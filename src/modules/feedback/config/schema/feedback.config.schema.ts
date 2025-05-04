import { z } from 'zod';

import { githubFeedback } from './github-feedback.schema.js';
import { mailFeedback } from './mail-feedback.schema.js';
import { redmineFeedback } from './redmine-feedback.schema.js';

export const DEFAULT_FEEDBACK_ID = '__default__';

export const feedbackConfig = z
  .object({
    primaryId: z
      .string()
      .min(1)
      .default(DEFAULT_FEEDBACK_ID)
      .describe(
        'Which service of those defined in the options will be used when sending new feedback.',
      ),

    options: z
      .array(z.union([githubFeedback, mailFeedback, redmineFeedback]))
      .optional(),
  })
  .refine(
    (data) => {
      return (
        data.primaryId === DEFAULT_FEEDBACK_ID ||
        data.options?.some((option) => option.id === data.primaryId)
      );
    },
    (data) => ({
      message: `Feedback options doesn't contain object with id ${data.primaryId}. ${data.options?.map((option) => option.id).join(', ')} are available.`,
    }),
  );

export type FeedbackConfigType = z.infer<typeof feedbackConfig>;

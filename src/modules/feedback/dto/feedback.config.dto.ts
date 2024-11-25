import { z } from 'zod';

import { githubFeedback } from './github-feedback.dto';
import { mailFeedback } from './mail-feedback.dto';
import { redmineFeedback } from './redmine-feedback.dto';

export const feedbackConfig = z
  .object({
    primaryId: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Which service of those defined in the options will be used when sending new feedback.',
      ),
    options: z.array(z.union([githubFeedback, mailFeedback, redmineFeedback])),
  })
  .refine(
    (data) =>
      !data.primaryId ||
      data.options.some((option) => option.id === data.primaryId),
    (data) => ({
      message: `Feedback options doesn't contain object with id ${data.primaryId}. ${data.options.map((option) => option.id).join(', ')} are available.`,
    }),
  );

export type FeedbackConfigType = z.infer<typeof feedbackConfig>;

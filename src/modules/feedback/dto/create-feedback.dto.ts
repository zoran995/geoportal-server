import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFeedback = z.object({
  /**
   * Title of the feedback.
   */
  title: z
    .string()
    .default('User feedback')
    .optional()
    .describe('Title of the feedback.'),
  /**
   * Name of the user sending the feedback.
   */
  name: z
    .string()
    .default('No name')
    .optional()
    .describe('Name of the user sending the feedback.'),
  /**
   * Email of the user sending the feedback.
   */
  email: z
    .string()
    .email()
    .default('No email')
    .optional()
    .describe('Email of the user sending the feedback.'),
  /**
   * Map share url.
   */
  shareLink: z.string().url().optional().describe('Map share url.'),
  /**
   * Actual feedback.
   */
  comment: z
    .string()
    .min(30)
    .default('No comment')
    .optional()
    .describe('Actual feedback.'),
});

export class CreateFeedbackDto extends createZodDto(createFeedback) {}

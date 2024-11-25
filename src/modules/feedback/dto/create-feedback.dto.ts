import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFeedback = z.object({
  /**
   * Title of the feedback.
   */
  title: z.string().default('User feedback').optional(),
  /**
   * Name of the user sending the feedback.
   */
  name: z.string().default('No name').optional(),
  /**
   * Email of the user sending the feedback.
   */
  email: z.string().email().default('No email').optional(),
  /**
   * Map share url.
   */
  shareLink: z.string().url().optional(),
  /**
   * Actual feedback.
   */
  comment: z.string().min(30).default('No comment').optional(),
});

export class CreateFeedbackDto extends createZodDto(createFeedback) {}

import { z } from 'zod';

import { FeedbackServiceType } from '../../types/feedback-service.type';
import { additionalParameters } from '../../dto/additional-parameters.dto';

export const baseFeedback = z.object({
  /**
   * Service to use.
   */
  service: z.enum(FeedbackServiceType),
  /**
   * Id of feedback service.
   */
  id: z.string().min(1),
  additionalParameters: z.array(additionalParameters).optional(),
});

export type BaseFeedbackType = z.infer<typeof baseFeedback>;

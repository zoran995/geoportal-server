import { z } from 'zod';

import { additionalParameters } from './additional-parameters.schema.js';

export const baseFeedback = z.object({
  /**
   * Id of feedback service.
   */
  id: z.string().min(1),
  additionalParameters: z.array(additionalParameters).optional(),
});

export type BaseFeedbackType = z.infer<typeof baseFeedback>;

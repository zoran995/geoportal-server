import { z } from 'zod';

export const additionalParameters = z.object({
  descriptiveLabel: z.string().min(1),
  name: z.string().min(1),
});

export type AdditionalParametersType = z.infer<typeof additionalParameters>;

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getShare = z.object({
  id: z.string().min(1).describe('Id of the share config'),
});

export class GetShareDto extends createZodDto(getShare) {}

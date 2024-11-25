import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getInit = z.object({
  fileName: z.string().min(1),
});

export class GetInitDto extends createZodDto(getInit) {}

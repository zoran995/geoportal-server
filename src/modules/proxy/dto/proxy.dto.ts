import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const proxy = z.object({
  '0': z.string(),
});

export const proxyWithDuration = proxy.extend({
  duration: z
    .string()
    .optional()
    .describe(
      'The amount of time to cache for. This will override what the original server specified because we know better than they do.',
    ),

  '0': z.string().describe('An url to proxy to'),
});

export class ProxyDto extends createZodDto(proxy) {}
export class ProxyWithDurationDto extends createZodDto(proxyWithDuration) {}

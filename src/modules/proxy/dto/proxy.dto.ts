import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const proxy = z.object({
  url: z
    .array(z.string())
    .describe('An url to proxy to')
    .transform((val) => val.join('/')),
});

export const proxyWithDuration = proxy.extend({
  duration: z
    .string()
    .optional()
    .describe(
      'The amount of time to cache for. This will override what the original server specified because we know better than they do.',
    ),
});

export class ProxyDto extends createZodDto(proxy) {}
export class ProxyWithDurationDto extends createZodDto(proxyWithDuration) {}

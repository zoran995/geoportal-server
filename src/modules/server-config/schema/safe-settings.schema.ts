import { z } from 'zod';

export const serverConfigResponse = z.object({
  version: z.string().optional(),
  allowProxyFor: z.array(z.string()).optional(),
  newShareUrlPrefix: z.string().optional(),
  proxyAllDomains: z.boolean().optional(),
});

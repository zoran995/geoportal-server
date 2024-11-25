import { z } from 'zod';

const proxyAuthHeaders = z.object({
  name: z.string(),
  value: z.string(),
});

export const proxyAuthConfig = z.object({
  headers: z.array(proxyAuthHeaders).optional(),
  authorization: z.string().optional(),
});

import { z } from 'zod';

export const basicAuthentication = z.object({
  username: z
    .string()
    .min(1)
    .describe('Username of the user that is used for login.'),

  password: z
    .string()
    .min(1)
    .describe('Password of the user that is used for login.'),
});

export type BasicAuthenticationOptions = z.infer<typeof basicAuthentication>;

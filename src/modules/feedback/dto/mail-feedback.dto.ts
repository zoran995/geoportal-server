import { z } from 'zod';

import { fqdnOrIp } from 'src/common/validators';

import { baseFeedback } from './base-feedback.dto';

export const mailFeedbackAuth = z.object({
  user: z
    .string()
    .min(1)
    .describe('Name of the user that will be used to connect to smtpServer.'),
  pass: z
    .string()
    .min(1)
    .describe(
      'Password of the user that will be used to connect to smtpServer.',
    ),
});

export const mailFeedback = baseFeedback.extend({
  service: z.literal('mail'),
  smtpHost: fqdnOrIp().describe(
    'Hostname or IP address of smtp server to connect to.',
  ),

  smtpPort: z.coerce
    .number()
    .min(0)
    .max(65535)
    .describe('Port of smtp server to connect to.'),

  secure: z
    .boolean()
    .default(false)
    .describe('Whether authentication should be done against SMPT server.'),

  auth: z.optional(mailFeedbackAuth).describe('Authentication data.'),

  email: z.string().email().describe('Email to which feedback will be sent.'),
});

export type MailFeedbackType = z.infer<typeof mailFeedback>;

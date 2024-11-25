import { z } from 'zod';

import { share } from './share.dto';

export const shareS3 = share.extend({
  service: z.literal('s3'),
  region: z.string().min(1).describe('The AWS region'),
  bucket: z
    .string()
    .min(1)
    .describe('An existing S3 bucket in which to store objects'),

  credentials: z
    .object({
      accessKeyId: z.string().min(1),
      secretAccessKey: z.string().min(1),
    })
    .readonly()
    .optional()
    .describe(`Credentials of a user with S3 getObject and putObject permission on the above bucket.
    If not provided here, you must ensure they're available as environment variables or in a shared credentials file.
    See http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html | node configuring aws guide.`),

  keyLength: z
    .number()
    .int()
    .min(0)
    .max(54)
    .default(54)
    .readonly()
    .describe(
      `The length of the random share key to generate (not including prefix), up to 54 characters. Defaults to the full length.`,
    ),
});

export type ShareS3Type = z.infer<typeof shareS3>;

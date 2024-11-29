import { z } from 'zod';

const httpsSchema = z
  .object({
    keyPath: z
      .string()
      .describe(
        'Private key in PEM format. PEM allows the option of private key being encrypted. Encrypted keys will be decrypted with passphrase if provided.',
      ),

    certPath: z.string().describe(''),

    passphrase: z
      .string()
      .optional()
      .describe(
        'Passphrase for the private key. If the key is encrypted, this option is required.',
      ),

    redirectToHttps: z
      .boolean()
      .default(false)
      .describe(
        'Redirect HTTP requests to HTTPS. This is useful when running behind a reverse proxy that handles HTTPS.',
      ),

    httpAllowedHosts: z
      .array(z.string())
      .default(['localhost'])
      .describe(
        'List of hosts that are allowed to make HTTP requests. This is mostly useful to allow non-https access to localhost in development.',
      ),

    strictTransportSecurity: z
      .string()
      .optional()
      .describe(
        'The value of the Strict-Transport-Security header. This header tells browsers to always use HTTPS when connecting to the server. This is useful when running behind a reverse proxy that handles HTTPS. Ignored if redirectToHttps is false.',
      ),
  })
  .refine((data) => {
    if (!data.redirectToHttps && data.strictTransportSecurity) {
      console.warn(
        'strictTransportSecurity is only useful when redirectToHttps is true',
      );
    }
    return true;
  });

type HttpsOptions = z.infer<typeof httpsSchema>;

export { httpsSchema, HttpsOptions };

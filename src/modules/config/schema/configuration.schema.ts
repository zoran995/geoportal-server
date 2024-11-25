import { z } from 'zod';

import { createZodDto } from 'nestjs-zod';

import { portSchema } from 'src/common/validators';

import { feedbackConfig } from '../../feedback/config/schema/feedback.config.schema';
import { proxyConfig } from '../../proxy';
import { serveStatic } from '../../serve-static';
import { shareConfig } from '../../share/config/schema/share.config.schema';

import { basicAuthentication } from './basic-authentication.schema';
import { contentSecurityPolicy } from './ContentSecurityPolicy.schema';

export const configuration = z.object({
  compressResponse: z.boolean().default(true).describe(`
    Use the compression middleware package to enable gzip compression of
    responses. For high-traffic websites in production, it is strongly
    recommended to offload compression from the application server typically in
    a reverse proxy (e.g., Nginx). In that case, you should not use compression
    middleware.`),

  basicAuthentication: z.optional(basicAuthentication),

  port: portSchema.default(3001).describe(`
    Port to listen on. Overridden by the --port command line setting.`),

  initPaths: z.array(z.string()).default([]).describe(`
    List of directories where init (catalog) files will be sought, before
    defaulting to wwwroot/init. This helps with managing catalog files
    separately from the main codebase.`),

  share: z
    .optional(shareConfig)
    .describe(
      'Configuration for the share service. If not defined share service will be disabled.',
    ),

  feedback: feedbackConfig
    .default(feedbackConfig.parse({}))
    .describe(
      `Configuration for the feedback service. If not defined feedback service will be disabled.`,
    ),

  proxy: proxyConfig
    .default(proxyConfig.parse({}))
    .describe('Configuration for the proxy service.'),

  trustProxy: z
    .union([z.boolean(), z.string(), z.array(z.string()), z.number()])
    .default(false).describe(`
    The value of the Express "trust proxy" application setting. Set this to
    true if you want to provide publicly usable URLs behind a reverse proxy
    For more details read
    http://expressjs.com/en/guide/behind-proxies.html
    http://expressjs.com/en/api.html#trust.proxy.options.table`),

  serveStatic: serveStatic
    .optional()
    .describe('Configuration for serving static files.'),

  csp: contentSecurityPolicy
    .describe('Configuration for the Content Security Policy.')
    .default(contentSecurityPolicy.parse({})),

  wwwroot: z.string().default('./wwwroot'),
});

export type ConfigurationType = z.infer<typeof configuration>;
export class ConfigurationDto extends createZodDto(configuration) {}

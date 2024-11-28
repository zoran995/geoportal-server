import { z } from 'zod';

import { createZodDto } from 'nestjs-zod';

import { portSchema } from 'src/common/validators';
import { serveStatic } from 'src/common/utils';

import { rateLimit } from 'src/infrastructure/rate-limiter';

import { basicAuthentication } from '../../basic-auth';
import { feedbackConfig } from '../../feedback/config/schema/feedback.config.schema';
import { proxyConfig } from '../../proxy';
import { shareConfig } from '../../share/schema/share.config.schema';

import { contentSecurityPolicy } from './ContentSecurityPolicy.schema';

export const configuration = z.object({
  compressResponse: z.boolean().default(true).describe(`
    Use the compression middleware package to enable gzip compression of
    responses. For high-traffic websites in production, it is strongly
    recommended to offload compression from the application server typically in
    a reverse proxy (e.g., Nginx). In that case, you should not use compression
    middleware.`),

  basicAuthentication: basicAuthentication
    .optional()
    .describe(
      'Configuration for basic authentication. If not defined basic authentication will be disabled.',
    ),

  /**
   * Rate limits basic authentication requests. Note that this uses simple
   * in-memory storage of requests, which means that the actual allowed rate
   * will be higher when multiple terriajs-server processes. The first two wait
   * times after `freeRetries` are `minWait`. Successive wait times are the sum
   * of the two previous wait times, up to `maxWait`.
   */
  rateLimit: rateLimit
    .optional()
    .default(rateLimit.parse({}))
    .describe(
      'Rate limits basic authentication requests. Note that this uses simple in-memory storage of requests, which means that the actual allowed rate will be higher when multiple terriajs-server processes. The first two wait times after `freeRetries` are `minWait`. Successive wait times are the sum of the two previous wait times, up to `maxWait`.',
    ),

  port: portSchema.default(3001).describe(`
    Port to listen on. Overridden by the --port command line setting.`),

  initPaths: z.array(z.string()).default([]).describe(`
    List of directories where init (catalog) files will be sought, before
    defaulting to wwwroot/init. This helps with managing catalog files
    separately from the main codebase.`),

  share: z
    .optional(shareConfig)
    .default(shareConfig.parse({}))
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
    .default(serveStatic.parse({}))
    .describe('Configuration for serving static files.'),

  csp: contentSecurityPolicy
    .describe('Configuration for the Content Security Policy.')
    .default(contentSecurityPolicy.parse({})),

  wwwroot: z.string().default('./wwwroot'),
});

export type ConfigurationType = z.infer<typeof configuration>;
export class ConfigurationDto extends createZodDto(configuration) {}

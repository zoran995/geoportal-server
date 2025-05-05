import { z } from 'zod';

import { fqdnOrIp } from 'src/common/validators/index.js';

import { DEFAULT_BLACKLIST, DEFAULT_MAX_SIZE } from '../../proxy.constants.js';
import { proxyAuthConfig } from './proxy-auth-config.dto.js';
import { createZodDto } from 'nestjs-zod';

const appendParamToQueryString = z.object({
  regexPattern: z
    .string()
    .describe(
      "A regex pattern used to test whether parameters should be attached. Set to '.' to match everything.",
    ),

  params: z
    .record(z.string())
    .describe('Parameters that should be appended to the request.'),
});

export const proxyConfig = z.object({
  postSizeLimit: z
    .number()
    .int()
    .min(0)
    .default(DEFAULT_MAX_SIZE)
    .describe(
      'The largest size, in bytes, of data that the proxy will send in a POST request.',
    ),

  proxyAllDomains: z
    .boolean()
    .default(false)
    .describe(
      'If this setting is true, the allowProxyFor list is ignored, and all requests are accepted.',
    ),

  allowProxyFor: z
    .array(fqdnOrIp())
    .optional()
    .default([])
    .describe(
      'List of domains which the server is willing to proxy for. Subdomains are included automatically. It will be ignored if whitelistPath is defined and file exists.',
    ),

  blacklistedAddresses: z
    .array(z.string())
    .default(DEFAULT_BLACKLIST)
    .describe(
      "IP addresses to refuse to proxy for, even if they're resolved from a hostname that we would ordinarily allow. It will be ignored if blacklistPath is defined and file exists.",
    ),

  whitelistPath: z
    .string()
    .optional()
    .describe(
      'Location of the file containing the list of domains which the server is willing to proxy for. Subdomains are included automatically. Each domain should be in its own row.',
    ),

  blacklistPath: z
    .string()
    .optional()
    .describe(
      "Location of the file containing the list of IP addresses to refuse to proxy for, even if they're resolved from a hostname that would ordinarily be proxied. Each IP address should be in its own row. If your server has access to an IP range that is not accessible to clients of the proxy, and you want to ensure that the client can't get access to it through the proxy, it is vital that you add that IP range to this list. Any change to file content will be picked up automatically without restarting server.",
    ),

  upstreamProxy: z
    .union([z.string().url(), fqdnOrIp()])
    .optional()
    .describe('Pass requests through to another proxy upstream.'),

  bypassUpstreamProxyHosts: z
    .record(z.string(), z.boolean())
    .optional()
    .describe('A list of hosts that should bypass the upstream proxy.'),

  appendParamToQueryString: z
    .record(z.string(), z.array(appendParamToQueryString))
    .optional()
    .describe(
      'An array of options which you to inform which additional parameters are appended to the url querystring.',
    ),

  proxyAuth: z
    .record(z.string(), proxyAuthConfig)
    .optional()
    .default({})
    .describe('A map of proxy authentication configurations.'),
});

export class AppendParamToQueryStringDto extends createZodDto(
  appendParamToQueryString,
) {}

export type ProxyConfigType = z.infer<typeof proxyConfig>;

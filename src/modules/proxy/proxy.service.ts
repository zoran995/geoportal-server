import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import type { Request } from 'express';
import { URL } from 'url';

import { isDefined } from 'src/common/helpers/index.js';
import { AppHttpService } from 'src/infrastructure/http/index.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';

import { AppendParamToQueryStringDto } from './config/schema/proxy-config.dto.js';
import type { ProxyOptions } from './proxy-options.js';
import {
  DEFAULT_MAX_AGE_SECONDS,
  PROTOCOL_REGEX,
  PROXY_OPTIONS,
} from './proxy.constants.js';
import { filterHeaders } from './utils/filterHeaders.js';
import { processDuration } from './utils/processDuration.js';
import { processHeaders } from './utils/processHeaders.js';
import { ProxyListService } from './utils/proxy-list.service.js';
import { urlValidator } from './utils/urlValidator.js';
import got, { Agents, HTTPError, PlainResponse, RequestError } from 'got';
import {
  HttpProxyAgent,
  HttpProxyAgentOptions,
  HttpsProxyAgent,
  HttpsProxyAgentOptions,
} from 'hpagent';

@Injectable({ scope: Scope.REQUEST })
export class ProxyService {
  private readonly logger = new LoggerService(ProxyService.name);

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(PROXY_OPTIONS) private readonly proxyOptions: ProxyOptions,
    private readonly httpService: AppHttpService,
    private readonly proxyListService: ProxyListService,
  ) {}

  /**
   *
   * @param target - URL to proxy
   * @param duration - Duration of the cache
   * @returns
   */
  async proxyRequest(target: string, duration?: string) {
    target = this.processTargetUrl(target);

    const remoteUrl = new URL(target);

    // Are we allowed to proxy for this host?
    this.proxyAllowedHost(remoteUrl.host);

    const maxAge = isDefined(duration)
      ? processDuration(duration)
      : DEFAULT_MAX_AGE_SECONDS;

    // Copy the query string
    remoteUrl.search = this.getQuery();

    if (this.proxyOptions.appendParamToQueryString) {
      const host = this.proxyOptions.appendParamToQueryString[remoteUrl.host];
      if (host) {
        this.appendParamToQuery(host, remoteUrl);
      }
    }

    let proxy: Agents | undefined;
    if (
      this.proxyOptions.upstreamProxy &&
      !this.proxyOptions.bypassUpstreamProxyHosts?.[remoteUrl.host]
    ) {
      const url = new URL(this.proxyOptions.upstreamProxy);
      const proxyOptions: HttpProxyAgentOptions | HttpsProxyAgentOptions = {
        port: url.port
          ? parseInt(url.port, 10)
          : url.protocol === 'https:'
            ? 443
            : 80,
        host: `${url.host}/`,
        proxy: url,
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: 'lifo',
      };
      proxy = {
        http: new HttpProxyAgent(proxyOptions),
        https: new HttpsProxyAgent(proxyOptions),
      };
    }

    const filteredReqHeaders = filterHeaders(
      this.request.headers,
      this.request.socket,
    );

    // Remove the Authorization header if we used it to authenticate the request
    // to terriajs-server. Keeping this here so we don't actually end up
    // removing authorization header specified from frontend for proxy request.
    if (this.proxyOptions.basicAuthentication) {
      this.deleteAuthorizationHeader(filteredReqHeaders);
    }

    return this.#performRequest(remoteUrl, filteredReqHeaders, maxAge, proxy);
  }

  /**
   * Performs the actual HTTP request to the remote URL, handling authentication retries.
   * Authentication retry strategy:
   * 1. Initial attemp: Uses user-provided Authorization header if present.
   *    If not, and proxy auth is configured for the host, uses proxy proxy auth.
   *    Otherwise, no auth.
   * 2. If the first attempt fails with 403:
   *    a. If initial attempt used user auth & proxy auth is defined: Retry with proxy auth.
   *    b. Else (initial was proxy auth, or user auth with no proxy auth option, or no auth): Retry with no auth.
   * 3. If first retry (now with proxy auth or no auth) results in 403: Retry with no auth.
   *
   * @param remoteUrl - URL to proxy to
   * @param headers - Original headers for the request
   * @param maxAge - Cache duration for the response
   * @param proxy - Upstream proxy agents, if any
   */
  async #performRequest(
    remoteUrl: URL,
    headers: Record<string, string>,
    maxAge: number,
    proxyAgents?: Agents,
  ): Promise<unknown> | never {
    const originalIncomingHeaders = { ...headers };
    const hostAuthOptions = this.proxyOptions.proxyAuth[remoteUrl.host];
    let initialAuthType: 'user' | 'proxy' | 'none' = 'none';
    const effectiveHeadersForFirstAttempt = { ...originalIncomingHeaders };

    // Determine auth strategy for the FIRST attempt
    if (originalIncomingHeaders.authorization) {
      initialAuthType = 'user';
    } else if (hostAuthOptions) {
      initialAuthType = 'proxy';
      if (hostAuthOptions.authorization) {
        effectiveHeadersForFirstAttempt.authorization =
          hostAuthOptions.authorization;
      }
      if (hostAuthOptions.headers) {
        hostAuthOptions.headers.forEach((header) => {
          effectiveHeadersForFirstAttempt[header.name] = header.value;
        });
      }
    } else {
      initialAuthType = 'none';
    }

    const baseHeadersWithoutAuth = (() => {
      const temp = { ...originalIncomingHeaders };
      delete temp.authorization;
      return temp;
    })();

    interface RequestContext {
      authTypeForThisAttempt: 'user' | 'proxy' | 'none';
      hostAuthOptions: ProxyOptions['proxyAuth'][string];
      baseHeadersWithoutAuth: Record<string, string>;
      remoteUrlString: string;
    }

    try {
      const response = await got(remoteUrl.href, {
        method: this.request.method === 'POST' ? 'POST' : 'GET',
        headers: effectiveHeadersForFirstAttempt,
        responseType: 'buffer',
        agent: proxyAgents,
        encoding: undefined,
        body: this.request.method === 'POST' ? this.request.body : undefined,
        followRedirect: (response: PlainResponse) => {
          return this.followRedirect(response.headers, remoteUrl);
        },
        throwHttpErrors: true,
        context: {
          authTypeForThisAttempt: initialAuthType,
          hostAuthOptions,
          baseHeadersWithoutAuth,
          remoteUrlString: remoteUrl.href,
        } satisfies RequestContext,
        retry: {
          limit: 2,
          methods: ['GET', 'POST'],
          statusCodes: [403],
          calculateDelay: (retryObject) => {
            const requestOptions = retryObject.error.options;
            const context = requestOptions.context as never as RequestContext;

            // attemptCount is the number of the failed attempt.
            // If the 2nd attempt (1st retry) just failed (attemptCount === 2),
            // and it was made with 'none' auth, then do not proceed to the 3rd attempt (2nd retry).
            if (
              retryObject.attemptCount === 2 &&
              context.authTypeForThisAttempt === 'none'
            ) {
              this.logger.debug(
                `Cancelling further retries for ${context.remoteUrlString} as the previous retry was already without authentication.`,
              );
              return 0; // Cancel retry
            }

            // For other cases, retry immediately (or after a very short delay)
            return 1; // Minimal delay for retry to proceed
          },
        },
        hooks: {
          beforeRequest: [
            (options) => {
              const context = options.context as never as RequestContext;
              this.logger.debug(
                `Making request to ${context.remoteUrlString} with auth type: ${context.authTypeForThisAttempt}`,
              );
            },
          ],
          beforeRetry: [
            (error, retryCount) => {
              const requestOptions = error.options;
              const context = requestOptions.context as never as RequestContext;

              this.logger.debug(
                `Attempting retry ${retryCount} for status ${
                  error.response?.statusCode ?? 'N/A'
                } on ${context.remoteUrlString}.`,
              );

              const failedAttemptAuthType = context.authTypeForThisAttempt;
              const currentHostAuthOptions = context.hostAuthOptions;
              const currentBaseHeadersWithoutAuth =
                context.baseHeadersWithoutAuth;

              let nextAuthType: 'proxy' | 'none' = 'none';
              requestOptions.headers = { ...currentBaseHeadersWithoutAuth };

              if (retryCount === 1) {
                if (
                  failedAttemptAuthType === 'user' &&
                  currentHostAuthOptions
                ) {
                  this.logger.debug('Retrying with proxy auth.');
                  if (currentHostAuthOptions.authorization) {
                    requestOptions.headers.authorization =
                      currentHostAuthOptions.authorization;
                  }
                  if (currentHostAuthOptions.headers) {
                    currentHostAuthOptions.headers.forEach((header) => {
                      requestOptions.headers[header.name] = header.value;
                    });
                  }
                  nextAuthType = 'proxy';
                } else {
                  this.logger.debug(
                    'Retrying without authentication (1st retry).',
                  );
                  nextAuthType = 'none';
                }
              } else if (retryCount === 2) {
                // This will only be reached if calculateDelay allowed it (i.e., previous attempt was not 'none')
                this.logger.debug(
                  'Retrying without authentication (2nd retry).',
                );
                nextAuthType = 'none';
              }
              context.authTypeForThisAttempt = nextAuthType;
            },
          ],
        },
      }).on('request', (req) => {
        req.on('socket', (socket) => {
          this.logger.debug(
            'Socket assigned to request for: ' + remoteUrl.href,
          );

          socket.once('lookup', (_err, address: string) => {
            if (this.proxyListService.addressBlacklisted(address)) {
              // ip address is blacklisted so emit an error to abort request
              socket.emit(
                'error',
                new ForbiddenException(`IP address is not allowed: ${address}`),
              );
            }
          });
        });
      });

      const maxAgeSeconds = response.statusCode >= 400 ? undefined : maxAge;

      this.request.res?.writeHead(
        response.statusCode,
        response.statusMessage,
        processHeaders(response.headers, maxAgeSeconds),
      );

      this.request.res?.status(response.statusCode);
      this.request.res?.write(response.body);

      return response;
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      // before redirect may throw BadRequestException we catch it here
      // and throw instance of it
      this.logger.error(
        `An error occurred during proxy request to ${remoteUrl.href}`,
        err as never,
      );

      if (
        err instanceof RequestError &&
        err.cause instanceof ForbiddenException
      ) {
        throw new ForbiddenException(err.cause.message);
      }
      if (err instanceof HTTPError) {
        if (err.response.statusCode === 403) {
          this.logger.warn(
            `All authentication retries failed for ${remoteUrl.href}, final status 403.`,
          );
          throw new HttpException(
            `Response code ${err.response.statusCode} (${err.response.statusMessage})`,
            err.response.statusCode,
          );
        }
        // Attempt to parse body if it's JSON, otherwise use statusMessage or default
        let messageBody: string = err.response.body;
        if (Buffer.isBuffer(messageBody)) {
          try {
            const bodyStr = messageBody.toString();
            // Check if it's a JSON string before parsing
            if (bodyStr.startsWith('{') && bodyStr.endsWith('}')) {
              messageBody = JSON.parse(bodyStr);
            } else {
              messageBody = bodyStr; // Use string if not JSON
            }
          } catch {
            this.logger.debug(
              'Failed to parse error response body as JSON, using as string.',
            );
            messageBody = JSON.stringify(messageBody);
          }
        }

        throw new HttpException(
          messageBody ?? err.response.statusMessage ?? 'Proxy request failed',
          err.response.statusCode,
        );
      } else if (err.code === 'ECONNREFUSED') {
        throw new BadGatewayException();
      }
      if (
        (err.response?.status in HttpStatus ||
          err.response?.statusCode in HttpStatus) &&
        err.message
      ) {
        throw new HttpException(
          err.message as never,
          (err.response?.status as never) ||
            (err.response?.statusCode as never),
        );
      }

      if (err instanceof HttpException) {
        // Re-throw if already a NestJS HttpException
        throw err;
      }

      if (err.code === 'ECONNREFUSED') {
        throw new BadGatewayException(
          `Connection refused for ${remoteUrl.href}`,
        );
      }

      throw new InternalServerErrorException('Proxy error');
    }
  }

  private followRedirect(headers: PlainResponse['headers'], remoteUrl: URL) {
    // Before redirect check if we are allowed to proxy that host
    const location = headers.location;
    if (location && location.length > 0) {
      const url = new URL(location);
      // location header can be a relative URL with no host name. In that case,
      // we default to the remote url host.
      const redirectHost =
        typeof url.host === 'string' ? url.host : remoteUrl.host;
      this.proxyAllowedHost(redirectHost);
      return true;
    }

    return false;
  }

  /**
   * Extracts search query from request.
   * @returns the search query
   */
  private getQuery() {
    const baseURL = `${this.request.protocol}://${this.request.headers.host}/`;
    const reqUrl = new URL(this.request.url, baseURL);
    return reqUrl.search;
  }

  /**
   * Append search params to proxied url
   * @param options - search params to be appended
   * @param remoteUrl - url to be proxied
   */
  private appendParamToQuery(
    options: AppendParamToQueryStringDto[],
    remoteUrl: URL,
  ) {
    for (const option of options) {
      if (!option.regexPattern || !option.params) {
        continue;
      }
      const re = new RegExp(option.regexPattern, 'g');
      const params = option.params;
      if (re.test(remoteUrl.href)) {
        const paramsString = Object.keys(params)
          .map((key) => key + '=' + params[key])
          .join('&');
        if (remoteUrl.search === null || remoteUrl.search === '') {
          remoteUrl.search = paramsString;
        } else {
          const joiner = remoteUrl.search.includes('?') ? '&' : '?';
          remoteUrl.search += joiner + paramsString;
        }
      }
    }
  }

  /**
   * Deletes authorization header from header object
   * @param headers - request headers
   */
  private deleteAuthorizationHeader(headers: Record<string, unknown>) {
    delete headers.authorization;
    return headers;
  }

  /**
   * Check if the target url is correct and apply fix for only one slash.
   * @param target - proxy target url
   * @returns - fixed and validated target url
   * @throws {@link BadRequestException} - When target URL is not valid.
   */
  private processTargetUrl(target: string): string | never {
    const match = PROTOCOL_REGEX.exec(target);
    let resultUrl: string = target;
    if (!match || match.length < 1) {
      resultUrl = `http://${target}`;
    } else {
      const matchedPart = match[0];
      // If the protocol portion of the URL only has a single slash after it,
      // the extra slash was probably stripped off by someone along the way
      // (NGINX will do this).  Add it back.
      if (target[matchedPart.length] !== '/') {
        resultUrl = `${matchedPart}/${target.substring(matchedPart.length)}`;
      }
    }
    if (urlValidator(resultUrl)) {
      return resultUrl;
    }
    throw new BadRequestException('No URL or specifed URL is not correct');
  }

  /**
   * Check if we are allowed to proxy the given host. If host is not allowed not
   * throws a ForbiddenException.
   * @param host - Host to be proxied
   * @throws {@link ForbiddenException} Host is not in list of allowed hosts
   */
  private proxyAllowedHost(host: string): void | never {
    // Exclude hosts that are really IP addresses and are in our blacklist.
    if (this.proxyListService.addressBlacklisted(host)) {
      throw new ForbiddenException(
        `Host is not in list of allowed hosts: ${host}`,
      );
    }

    if (this.proxyOptions.proxyAllDomains) {
      return;
    }

    if (!this.proxyListService.isWhitelisted(host.toLowerCase()))
      throw new ForbiddenException(
        `Host is not in list of allowed hosts: ${host}`,
      );
  }
}

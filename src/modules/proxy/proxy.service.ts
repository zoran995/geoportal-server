import { HttpService } from '@nestjs/axios';
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

import { AxiosProxyConfig } from 'axios';
import type { Request } from 'express';
import * as http from 'http';
import { catchError, lastValueFrom, map } from 'rxjs';
import { URL } from 'url';

import { isDefined } from 'src/common/helpers/index.js';
import { LoggerService } from 'src/infrastructure/logger/index.js';

import { AppendParamToQueryStringDto } from './config/schema/proxy-config.dto.js';
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
import type { ProxyOptions } from './proxy-options.js';

@Injectable({ scope: Scope.REQUEST })
export class ProxyService {
  private readonly logger = new LoggerService(ProxyService.name);

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(PROXY_OPTIONS) private readonly proxyOptions: ProxyOptions,
    private readonly httpService: HttpService,
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
      host && this.appendParamToQuery(host, remoteUrl);
    }

    let proxy: AxiosProxyConfig | undefined;
    if (
      this.proxyOptions.upstreamProxy &&
      (!this.proxyOptions.bypassUpstreamProxyHosts ||
        !this.proxyOptions.bypassUpstreamProxyHosts[remoteUrl.host])
    ) {
      const url = new URL(this.proxyOptions.upstreamProxy);
      proxy = {
        port: url.port
          ? parseInt(url.port, 10)
          : url.protocol === 'https:'
            ? 443
            : 80,
        host: `${url.host}/`,
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
   * Each request will be proxied with authentication header in following order,
   * the first successfull breaks the chain.
   * - Send the request with authorization header provided by user unless we use
   *   basic authentication.
   * - Send the request with authorization header specified in proxyAuth.
   * - Send the request without authentication.
   * @param remoteUrl - URL to proxy to
   * @param headers - headers to be issued with request
   * @param maxAge - for how long to cache the response
   * @param proxy - Upstream proxy definition
   * @param retryWithoutAuth - Should we retry request without auth
   * @param proxyAuthCredentials - Are we using the proxyAuthCredentials in this
   * request.
   */
  async #performRequest(
    remoteUrl: URL,
    headers: Record<string, string>,
    maxAge: number,
    proxy?: AxiosProxyConfig,
    retryWithoutAuth = false,
    proxyAuthCredentials = false,
  ): Promise<unknown> | never {
    const proxyHeaders = { ...headers };
    const authRequired = this.proxyOptions.proxyAuth[remoteUrl.host];

    if (!retryWithoutAuth && authRequired && !headers['authorization']) {
      // identify that we tried using proxy auth headers
      proxyAuthCredentials = true;
      if (authRequired.authorization) {
        // http basic auth.
        proxyHeaders['authorization'] = authRequired.authorization;
      }
      if (authRequired.headers) {
        // a mechanism to pass arbitrary headers.
        authRequired.headers.forEach(function (header) {
          proxyHeaders[header.name] = header.value;
        });
      }
    } else if (
      !retryWithoutAuth &&
      !headers['authorization'] &&
      !authRequired
    ) {
      retryWithoutAuth = true;
    }

    return lastValueFrom(
      this.httpService
        .request({
          method: this.request.method === 'POST' ? 'POST' : 'GET',
          url: `${remoteUrl.href}`,
          headers: proxyHeaders,
          responseType: 'arraybuffer',
          proxy,
          data: this.request.method === 'POST' ? this.request.body : undefined,
          maxBodyLength: this.proxyOptions.postSizeLimit,
          beforeRedirect: (options, { headers }) =>
            this.beforeRedirect(headers, remoteUrl),
          onHttpSocketEvent: (config: NodeJS.Socket) =>
            this.onHttpSocketEvent(config),
        })
        .pipe(
          map((response) => {
            const maxAgeSeconds = response.status >= 400 ? undefined : maxAge;
            this.request.res?.writeHead(
              response.status,
              processHeaders(response.headers, maxAgeSeconds),
            );

            // have to go this way since express will add charset Content-Type
            // which will make some responses not working (image/png)
            this.request.res?.status(response.status);
            this.request.res?.write(response.data);
          }),
          catchError((err) => {
            // before redirect may throw BadRequestException we catch it here
            // and throw instance of it
            this.logger.error('An error occurred', err as never);
            if (
              !retryWithoutAuth &&
              (err.status === 403 ||
                err.response?.status === 403 ||
                err.response?.statusCode === 403)
            ) {
              if (
                authRequired &&
                headers['authorization'] &&
                !proxyAuthCredentials
              ) {
                // User specified an authentication header to this request which
                // failed with 403, indicating credentials didn't authorize
                // access to this resource. We have credentials for this host
                // specified in proxy auth so try again with them.
                this.deleteAuthorizationHeader(headers);
                return this.#performRequest(
                  remoteUrl,
                  headers,
                  maxAge,
                  proxy,
                  false,
                  true,
                );
              } else if ('authorization' in proxyHeaders) {
                // We automatically added an authentication header to this
                // request (e.g. from proxyauth.json), but got back a 403,
                // indicating our credentials didn't authorize access to this
                // resource. Try again without credentials.
                this.deleteAuthorizationHeader(headers);
                return this.#performRequest(
                  remoteUrl,
                  headers,
                  maxAge,
                  proxy,
                  true,
                );
              }
            }
            if (err instanceof HttpException) {
              if (Object.prototype.hasOwnProperty.call(err, 'toJSON')) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
                const errJson = (err as any)?.toJSON();
                throw Object.create(err, {
                  response: { value: errJson.message as never },
                });
              } else if (err.getResponse) {
                throw Object.create(err, {
                  response: { value: err.getResponse().toString() },
                });
              }
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
            //throw err;
            throw new InternalServerErrorException('Proxy error');
          }),
        ),
    );
  }

  private beforeRedirect(headers: http.IncomingHttpHeaders, remoteUrl: URL) {
    // Before redirect check if we are allowed to proxy that host
    const location = headers.location;
    if (location && location.length > 0) {
      const url = new URL(location);
      // location header can be a relative URL with no host name. In that case,
      // we default to the remote url host.
      const redirectHost =
        typeof url.host === 'string' ? url.host : remoteUrl.host;
      return this.proxyAllowedHost(redirectHost);
    }
    // redirect could not be completed
    throw new InternalServerErrorException();
  }

  private onHttpSocketEvent(socket: NodeJS.Socket) {
    socket.once('lookup', (err, address: string) => {
      if (this.proxyListService.addressBlacklisted(address)) {
        // ip address is blacklisted so emit an error to abort request
        socket.emit(
          'error',
          new ForbiddenException(`IP address is not allowed: ${address}`),
        );
      }
    });
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
          const joiner = remoteUrl.search.indexOf('?') >= 0 ? '&' : '?';
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
    delete headers['authorization'];
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

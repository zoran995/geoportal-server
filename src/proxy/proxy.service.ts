import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpService,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AxiosProxyConfig } from 'axios';
import { Request } from 'express';
import { inRange } from 'range_check';
import { LoggerService } from 'src/common/logger/logger.service';
import { format, URL } from 'url';
import { ProxyConfigService } from './config/proxy-config.service';
import { AppendParamToQueryStringDto } from './dto/proxy-config.dto';
import { PROTOCOL_REGEX } from './proxy.constants';
import { Blacklist } from './utils/blacklist';
import { filterHeaders } from './utils/filterHeaders';
import { processDuration } from './utils/processDuration';
import { urlValidator } from './utils/urlValidator';

@Injectable()
export class ProxyService {
  logger = new LoggerService();

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly proxyConfigService: ProxyConfigService,
    private readonly httpService: HttpService,
  ) {
    this.logger.setContext(ProxyService.name);
  }

  /**
   *
   * @param target - URL to proxy
   * @param duration - Duration of the cache
   * @returns
   */
  async proxyRequest(target: string, duration?: string) {
    target = this.processTargetUrl(target);

    //store maxAge in request so we can access it in interceptor and assign to
    //response
    (this.request as any).maxAge = duration && processDuration(duration);

    const remoteUrl = new URL(target);

    // Copy the query string
    remoteUrl.search = this.getQuery();

    if (this.proxyConfigService.appendParamToQueryString[remoteUrl.hostname]) {
      this.appendParamToQuery(
        this.proxyConfigService.appendParamToQueryString[remoteUrl.hostname],
        remoteUrl,
      );
    }

    if (!remoteUrl.protocol) {
      remoteUrl.protocol = 'http:';
    }

    let proxy;
    if (
      this.proxyConfigService.upstreamProxy &&
      !this.proxyConfigService.bypassUpstreamProxyHosts[remoteUrl.hostname]
    ) {
      proxy = this.proxyConfigService.upstreamProxy;
    }

    // Are we allowed to proxy for this host?
    this.proxyAllowedHost(remoteUrl.hostname);
    const filteredReqHeaders = filterHeaders(
      this.request.headers,
      this.request.socket,
    );

    // Remove the Authorization header if we used it to authenticate the request
    // to terriajs-server. Keeping this here so we don't actually end up
    // removing authorization header specified from frontend for proxy request.
    if (
      this.proxyConfigService.basicAuthentication &&
      this.proxyConfigService.basicAuthentication.username &&
      this.proxyConfigService.basicAuthentication.password
    ) {
      this.deleteAuthorizationHeader(filteredReqHeaders);
    }

    return this.performRequest(remoteUrl, filteredReqHeaders, proxy);
  }

  private async performRequest(
    remoteUrl: URL,
    headers: Record<string, unknown>,
    proxy: AxiosProxyConfig,
    retryWithoutAuth = false,
    proxyAuthCredentials = false,
  ): Promise<any> | never {
    const proxyHeaders = { ...headers };
    const proxyAuth = this.proxyConfigService.proxyAuth;
    const authRequired = proxyAuth[remoteUrl.hostname];
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
    }

    return await this.httpService
      .request({
        method: this.request.method === 'POST' ? 'POST' : 'GET',
        url: format(remoteUrl),
        headers: proxyHeaders,
        //responseType: 'arraybuffer', //encoding: null,
        proxy,
        data: this.request.body,
        maxBodyLength: this.proxyConfigService.postSizeLimit,
        beforeRedirect: (options, { headers }) => {
          const location = headers.location;
          if (location && location.length > 0) {
            const url = new URL(location);
            return this.proxyAllowedHost(url.hostname);
          }
          // redirect could not be completed
          throw new InternalServerErrorException();
        },
        onHttpSocketEvent: (socket: NodeJS.Socket) => {
          socket.once('lookup', function (err, address) {
            if (addressBlacklisted(address)) {
              // ip address is blacklisted so emit an error to abort request
              socket.emit(
                'error',
                new ForbiddenException(`IP address is not allowed: ${address}`),
              );
            }
          });
        },
      })
      .toPromise()
      .then((response) => {
        return response.data;
      })
      .catch((err: any) => {
        // before redirect may throw BadRequestException we catch it here and
        // throw instance of it
        this.logger.verbose(JSON.stringify(err.message || err));
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
            // failed with 403, indicating credentials didn't authorize access to
            // this resource. We have credentials for this host specified in
            // proxy auth so try again with them.
            this.deleteAuthorizationHeader(headers);
            return this.performRequest(remoteUrl, headers, proxy, false, true);
          } else {
            // We automatically added an authentication header to this request
            // (e.g. from proxyauth.json), but got back a 403, indicating our
            // credentials didn't authorize access to this resource. Try again
            // without credentials.
            this.deleteAuthorizationHeader(headers);
            return this.performRequest(remoteUrl, headers, proxy, true);
          }
        }
        if (err instanceof HttpException) {
          if ((err as any).toJSON) {
            const errJson = (err as any).toJSON();
            throw Object.create(err, { response: { value: errJson.message } });
          } else if (err.getResponse) {
            throw Object.create(err, {
              response: { value: err.getResponse().toString() },
            });
          }
        }
        //throw err;
        throw new InternalServerErrorException('Proxy error');
      });
  }

  /**
   * Extracts search query from request.
   * @returns the search query
   */
  private getQuery() {
    const baseURL =
      this.request.protocol + '://' + this.request.headers.hostname + '/';
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
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
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
  private proxyAllowedHost(host): void | never {
    // Exclude hosts that are really IP addresses and are in our blacklist.
    if (addressBlacklisted(host)) {
      throw new ForbiddenException(
        `Host is not in list of allowed hosts: ${host}`,
      );
    }

    if (this.proxyConfigService.proxyAllDomains) {
      return;
    }

    host = host.toLowerCase();
    const proxyDomains = this.proxyConfigService.proxyDomains;
    //check that host is from one of these domains
    for (let i = 0; i < proxyDomains.length; i++) {
      if (
        host.indexOf(proxyDomains[i], host.length - proxyDomains[i].length) !==
        -1
      ) {
        return;
      }
    }
    throw new ForbiddenException(
      `Host is not in list of allowed hosts: ${host}`,
    );
  }
}

/**
 * Check if address is blacklisted
 */
function addressBlacklisted(address) {
  return !!inRange(address, Blacklist.list);
}

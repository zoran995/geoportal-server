import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IConfigurationType } from '../../config';

@Injectable()
export class ProxyConfigService {
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
  ) {}

  /**
   * {@link ProxyConfigType.postSizeLimit}
   */
  get postSizeLimit() {
    return this.proxyConfig?.postSizeLimit;
  }

  /**
   * {@link ProxyConfigType.proxyAllDomains}
   */
  get proxyAllDomains() {
    return this.proxyConfig?.proxyAllDomains;
  }

  /**
   * {@link ProxyConfigType.allowProxyFor}
   */
  get proxyDomains() {
    return this.proxyConfig?.allowProxyFor;
  }

  /**
   * {@link ProxyConfigType.blacklistedAddresses}
   */
  get blacklist() {
    return this.proxyConfig?.blacklistedAddresses;
  }

  get blacklistPath() {
    return this.proxyConfig?.blacklistPath;
  }

  get whitelistPath() {
    return this.proxyConfig?.whitelistPath;
  }

  /**
   * {@link ProxyConfigType.upstreamProxy}
   */
  get upstreamProxy() {
    return this.proxyConfig?.upstreamProxy;
  }

  /**
   * {@link ProxyConfigType.bypassUpstreamProxyHosts}
   */
  get bypassUpstreamProxyHosts() {
    return this.proxyConfig?.bypassUpstreamProxyHosts;
  }

  /**
   * {@link ProxyConfigType.appendParamToQueryString}
   */
  get appendParamToQueryString() {
    return this.proxyConfig?.appendParamToQueryString;
  }

  get basicAuthentication() {
    return this.configService.get('basicAuthentication', { infer: true });
  }

  get proxyAuth() {
    return this.proxyConfig?.proxyAuth || {};
  }

  private get proxyConfig() {
    return this.configService.get('proxy', { infer: true });
  }
}

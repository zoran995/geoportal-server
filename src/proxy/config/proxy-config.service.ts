import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConfigurationType } from 'src/config/configurator';
import { BasicAuthenticationDto } from 'src/config/dto/basic-authentication.dto';
import { ProxyConfigDto } from '../dto/proxy-config.dto';

@Injectable()
export class ProxyConfigService {
  constructor(
    private readonly configService: ConfigService<IConfigurationType>,
  ) {}

  /**
   * {@link ProxyConfigDto.postSizeLimit}
   */
  get postSizeLimit() {
    return this.proxyConfig?.postSizeLimit;
  }

  /**
   * {@link ProxyConfigDto.proxyAllDomains}
   */
  get proxyAllDomains() {
    return this.proxyConfig?.proxyAllDomains;
  }

  /**
   * {@link ProxyConfigDto.allowProxyFor}
   */
  get proxyDomains() {
    return this.proxyConfig?.allowProxyFor;
  }

  /**
   * {@link ProxyConfigDto.blacklistedAddresses}
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
   * {@link ProxyConfigDto.upstreamProxy}
   */
  get upstreamProxy() {
    return this.proxyConfig?.upstreamProxy;
  }

  /**
   * {@link ProxyConfigDto.bypassUpstreamProxyHosts}
   */
  get bypassUpstreamProxyHosts() {
    return this.proxyConfig?.bypassUpstreamProxyHosts;
  }

  /**
   * {@link ProxyConfigDto.appendParamToQueryString}
   */
  get appendParamToQueryString() {
    return this.proxyConfig?.appendParamToQueryString;
  }

  get basicAuthentication() {
    return this.configService.get<BasicAuthenticationDto>(
      'basicAuthentication',
    );
  }

  get proxyAuth() {
    return this.proxyConfig?.proxyAuth || {};
  }

  private get proxyConfig() {
    return this.configService.get<ProxyConfigDto>('proxy');
  }
}

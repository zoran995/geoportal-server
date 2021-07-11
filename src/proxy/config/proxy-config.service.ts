import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasicAuthenticationDto } from 'src/config/validators/config.validator';
import { ProxyConfigDto } from '../dto/proxy-config.dto';
import { Blacklist } from '../utils/blacklist';

@Injectable()
export class ProxyConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * {@link ProxyConfigDto.postSizeLimit}
   */
  get postSizeLimit() {
    return this.proxyConfig.postSizeLimit;
  }

  /**
   * {@link ProxyConfigDto.proxyAllDomains}
   */
  get proxyAllDomains() {
    return this.proxyConfig.proxyAllDomains;
  }

  /**
   * {@link ProxyConfigDto.allowProxyFor}
   */
  get proxyDomains() {
    return this.proxyConfig.allowProxyFor || [];
  }

  /**
   * {@link ProxyConfigDto.upstreamProxy}
   */
  get upstreamProxy(): string | undefined {
    return this.proxyConfig.upstreamProxy;
  }

  /**
   * {@link ProxyConfigDto.bypassUpstreamProxyHosts}
   */
  get bypassUpstreamProxyHosts() {
    return this.proxyConfig.bypassUpstreamProxyHosts || {};
  }

  /**
   * {@link ProxyConfigDto.appendParamToQueryString}
   */
  get appendParamToQueryString() {
    return this.proxyConfig.appendParamToQueryString || {};
  }

  /**
   * {@link Blacklist.list}
   */
  get blacklist() {
    return Blacklist.list;
  }

  get basicAuthentication() {
    return this.configService.get<BasicAuthenticationDto>(
      'basicAuthentication',
    );
  }

  get proxyAuth() {
    return this.proxyConfig.proxyAuth || {};
  }

  private get proxyConfig(): ProxyConfigDto {
    return this.configService.get('proxy');
  }
}

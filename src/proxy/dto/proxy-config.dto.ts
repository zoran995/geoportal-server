import {
  IsArray,
  IsBoolean,
  IsFQDN,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';
import { NotNull } from '../../common/validators/not-null.validator';
import { DEFAULT_BLACKLIST } from '../proxy.constants';

export class ProxyConfigDto {
  /**
   * The largest size, in bytes, of data that the proxy will send in a POST
   * request.
   */
  @IsNumber()
  @NotNull()
  postSizeLimit = 102400;

  /**
   * If this setting is true, the allowProxyFor list is ignored, and all
   * requests are accepted.
   */
  @IsBoolean()
  @NotNull()
  proxyAllDomains = false;

  /**
   * List of domains which the server is willing to proxy for. Subdomains are
   * included automatically.
   * It will be ignored if {@link ProxyConfigDto.whitelistPath} is defined and file exists.
   */
  @IsArray()
  @IsString({ each: true })
  //@IsFQDN({ allow_underscores: true }, { each: true })
  @NotNull()
  allowProxyFor: string[] = [];

  /**
   * IP addresses to refuse to proxy for, even if they're resolved from a hostname that we would ordinarily allow.
   * It will be ignored if {@link ProxyConfigDto.blacklistPath} is defined and file exists.
   */
  @IsArray()
  @IsString({ each: true })
  @NotNull()
  blacklistedAddresses: string[] = DEFAULT_BLACKLIST;

  /**
   * Location of the file containing the list of domains which the server is
   * willing to proxy for. Subdomains are included automatically. Each domain
   * should be in its own row.
   */
  @IsString()
  @NotNull()
  whitelistPath?: string;

  /**
   * Location of the file containing the list of IP addresses to refuse to proxy
   * for, even if they're resolved from a hostname that would ordinarily be
   * proxied. Each IP address should be in its own row. If your server has
   * access to an IP range that is not accessible to clients of the proxy, and
   * you want to ensure that the client can't get access to it through the
   * proxy, it is vital that you add that IP range to this list. Any change to
   * file content will be picked up automatically without restarting server.
   */
  @IsString()
  @NotNull()
  blacklistPath?: string;

  /**
   * Pass requests through to another proxy upstream.
   */
  @IsFQDN()
  @NotNull()
  upstreamProxy?: string;

  @IsObject()
  @NotNull()
  bypassUpstreamProxyHosts?: { [key: string]: boolean } = {};

  /**
   * An array of options which you to inform which additional parameters are
   * appended to the url querystring.
   */
  @IsObject()
  @NotNull()
  appendParamToQueryString?: { [key: string]: AppendParamToQueryStringDto[] } =
    {};

  @IsObject()
  @NotNull()
  proxyAuth?: { [key: string]: any };
}

export class AppendParamToQueryStringDto {
  /**
   * A regex pattern used to test whether parameters should be attached. Set to
   * '.' to match everything.
   */
  @IsString()
  regexPattern: string;

  /**
   * Parameters that should be appended to the request.
   */
  @IsObject()
  params: { [key: string]: string };
}

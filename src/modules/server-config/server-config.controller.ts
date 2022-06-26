import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProxyListService } from '../proxy/utils/proxy-list.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires

export interface ISafeSettings {
  version?: string;
  allowProxyFor?: string[];
  newShareUrlPrefix: string;
  proxyAllDomains: boolean;
}

@Controller('serverConfig')
@ApiTags('serverConfig')
export class ServerConfigController {
  constructor(
    private readonly configService: ConfigService,
    private readonly proxyListService: ProxyListService,
  ) {}

  /**
   * Retrieve (safe) information about how the server is configured
   * @returns safe informations from server configuration
   */
  @ApiOperation({
    summary: 'Retrieve (safe) information about how the server is configured',
  })
  @Get()
  serverConfig() {
    const allowProxyFor = this.proxyListService.whitelist;
    const newShareUrlPrefix = this.configService.get('share.newPrefix');
    const proxyAllDomains = this.configService.get('proxy.proxyAllDomains');
    const safeSettings: ISafeSettings = {
      newShareUrlPrefix,
      proxyAllDomains,
    };
    if (!proxyAllDomains) {
      safeSettings.allowProxyFor = allowProxyFor;
    }
    safeSettings.version = process.env.npm_package_version;
    return safeSettings;
  }
}

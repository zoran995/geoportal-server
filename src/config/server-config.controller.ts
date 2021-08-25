import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyListService } from '../proxy/utils/proxy-list.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');

export interface ISafeSettings {
  version?: string;
  allowProxyFor?: string[];
  newShareUrlPrefix: string;
  proxyAllDomains: boolean;
}

@Controller('serverConfig')
export class ServerConfigController {
  constructor(
    private readonly configService: ConfigService,
    private readonly proxyListService: ProxyListService,
  ) {}

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
    if (version) {
      safeSettings.version = version;
    }
    return safeSettings;
  }
}

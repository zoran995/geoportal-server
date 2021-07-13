import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyListService } from '../proxy/utils/proxy-list.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');

@Controller('serverConfig')
export class ServerConfigController {
  constructor(
    private readonly configService: ConfigService,
    private readonly proxyListService: ProxyListService,
  ) {}

  @Get()
  serverConfig() {
    const safeSettings: any = {};
    safeSettings.allowProxyFor = this.proxyListService.whitelist;
    safeSettings.newShareUrlPrefix = this.configService.get('share.newPrefix');
    safeSettings.proxyAllDomains = this.configService.get(
      'proxy.proxyAllDomains',
    );
    if (version) {
      safeSettings.version = version;
    }
    return safeSettings;
  }
}

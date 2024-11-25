import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { z } from 'zod';

import type { ConfigurationType } from '../config';
import { ProxyListService } from '../proxy';
import { serverConfigResponse } from './schema/safe-settings.schema';

type SafeSettings = z.infer<typeof serverConfigResponse>;

@Controller('serverConfig')
@ApiTags('serverConfig')
export class ServerConfigController {
  constructor(
    private readonly configService: ConfigService<ConfigurationType, true>,
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
    const newShareUrlPrefix = this.configService.get('share', {
      infer: true,
    })?.newPrefix;
    const proxyAllDomains = this.configService.get('proxy.proxyAllDomains', {
      infer: true,
    });
    const safeSettings: SafeSettings = {
      newShareUrlPrefix,
      proxyAllDomains,
    };
    if (!proxyAllDomains) {
      safeSettings.allowProxyFor = allowProxyFor;
    }
    safeSettings.version = process.env.npm_package_version;

    return serverConfigResponse.strip().parse(safeSettings);
  }
}

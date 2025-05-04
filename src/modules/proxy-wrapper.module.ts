import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ConfigurationType } from './config/index.js';
import { ProxyModule } from './proxy/proxy.module.js';

@Module({
  imports: [
    ProxyModule.forRoot({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        const proxyConf = configService.get('proxy', { infer: true });
        return {
          ...proxyConf,
          basicAuthentication: configService.get('basicAuthentication', {
            infer: true,
          }),
        };
      },
    }),
  ],
  exports: [ProxyModule],
})
export class ProxyWrapperModule {}

import { Module } from '@nestjs/common';
import { POST_SIZE_LIMIT } from '../common/interceptor/payload-limit.interceptor';
import { ProxyConfigService } from './config/proxy-config.service';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ProxyListService } from './utils/proxy-list.service';

@Module({
  controllers: [ProxyController],
  providers: [
    ProxyService,
    ProxyConfigService,
    {
      provide: POST_SIZE_LIMIT,
      useFactory: (configService: ProxyConfigService) => {
        return configService.postSizeLimit;
      },
      inject: [ProxyConfigService],
    },
    ProxyListService,
  ],
  exports: [ProxyListService, ProxyConfigService],
})
export class ProxyModule {}

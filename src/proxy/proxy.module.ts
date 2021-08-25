import { Module } from '@nestjs/common';
import { POST_SIZE_LIMIT } from 'src/common/interceptor/payload-limit.interceptor';
import { HttpModule } from 'src/http/http.module';
import { ProxyConfigService } from './config/proxy-config.service';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ProxyListService } from './utils/proxy-list.service';

@Module({
  imports: [HttpModule],
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

import { Module } from '@nestjs/common';
import { HttpModule } from 'src/http/http.module';
import { ProxyConfigService } from './config/proxy-config.service';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ProxyListService } from './utils/proxy-list.service';

@Module({
  imports: [HttpModule],
  controllers: [ProxyController],
  providers: [ProxyService, ProxyConfigService, ProxyListService],
  exports: [ProxyListService, ProxyConfigService],
})
export class ProxyModule {}

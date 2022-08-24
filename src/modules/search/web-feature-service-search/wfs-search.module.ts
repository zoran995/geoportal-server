import { Module } from '@nestjs/common';

import { WfsSearchConfigService } from './config/wfs-search-config.service';
import { WfsSearchController } from './wfs-search.controller';
import { WfsSearchService } from './wfs-search.service';

@Module({
  controllers: [WfsSearchController],
  providers: [WfsSearchConfigService, WfsSearchService],
})
export class WfsSearchModule {}

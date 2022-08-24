import { Module } from '@nestjs/common';

import { WfsSearchModule } from './web-feature-service-search/wfs-search.module';

@Module({
  imports: [WfsSearchModule],
})
export class SearchModule {}

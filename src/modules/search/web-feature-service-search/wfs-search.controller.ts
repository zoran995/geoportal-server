import { Controller, Get, Param, Query } from '@nestjs/common';

import { SearchRequestParams } from './dto/request/search-params';
import { SearchRequestQueryParams } from './dto/request/search-query-params';
import { ISearchResponse } from './dto/response/search-response';
import { WfsSearchService } from './wfs-search.service';

@Controller({
  path: '/search/wfs',
})
export class WfsSearchController {
  constructor(private readonly _wfsSearchService: WfsSearchService) {}

  @Get(':id')
  search(
    @Param() params: SearchRequestParams,
    @Query() query: SearchRequestQueryParams,
  ): Promise<ISearchResponse | undefined> {
    return this._wfsSearchService.search(
      params.id,
      query.searchText,
      query.sortBy,
      query.propertyName,
      query.maxFeatures,
    );
  }
}

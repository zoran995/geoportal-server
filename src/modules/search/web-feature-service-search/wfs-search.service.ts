import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';

import { lastValueFrom } from 'rxjs';

import { WfsSearchConfigService } from './config/wfs-search-config.service';
import { ISearchResponse } from './dto/response/search-response';
import { IWfs1_1_0Response, IWfs2_0_0Response } from './dto/wfs-response';
import { WfsSearchLayerDto } from './dto/wfs-search-layer.dto';
import { xml2json } from './util/xml2json';

@Injectable()
export class WfsSearchService {
  constructor(
    private readonly _httpService: HttpService,
    private readonly wfsConfigService: WfsSearchConfigService,
  ) {}

  async search(
    id: string,
    searchText: string | undefined,
    sortBy: string | undefined,
    propertyName: string | undefined,
    maxFeatures: number | undefined,
    bbox: string | undefined,
  ): Promise<ISearchResponse | undefined> {
    if (!searchText) {
      throw new BadRequestException('Search text is required');
    }

    const layer = this.wfsConfigService.getWfsSearchLayer(id);
    if (!layer) {
      throw new BadRequestException('Layer not found');
    }

    return this.doSearch(
      layer,
      searchText,
      sortBy,
      propertyName,
      maxFeatures,
      bbox,
    );
  }

  private async doSearch(
    wfsLayer: WfsSearchLayerDto,
    searchText: string,
    sortBy: string | undefined,
    propertyName: string | undefined,
    maxFeatures: number | undefined,
    bbox: string | undefined,
  ): Promise<ISearchResponse | undefined> {
    const result: ISearchResponse = {
      count: 0,
      features: [],
    };
    if (searchText.length < wfsLayer.minCharacters) {
      return undefined;
    }

    const url = this.prepareUrl(
      wfsLayer,
      searchText,
      sortBy,
      propertyName,
      maxFeatures,
      bbox,
    );

    const xml = await lastValueFrom(this._httpService.get<string>(url.href));
    const json: IWfs1_1_0Response | IWfs2_0_0Response = xml2json(xml.data);

    result.count = json.numberOfFeatures;
    if (wfsLayer.version === '1.1.0') {
      result.features = (json as IWfs1_1_0Response).featureMember;
    } else if (wfsLayer.version === '2.0.0') {
      result.features = (json as IWfs2_0_0Response).member;
    }

    if (result.features && !Array.isArray(result.features)) {
      result.features = [result.features];
    }

    return result;
  }

  private prepareUrl(
    wfsLayer: WfsSearchLayerDto,
    searchText: string,
    sortBy: string | undefined = undefined,
    propertyName: string | undefined = undefined,
    maxFeatures: number | undefined = undefined,
    bbox: string | undefined = undefined,
  ) {
    const url = new URL(wfsLayer.url);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('version', wfsLayer.version);
    url.searchParams.set('srsName', wfsLayer.srsName);
    if (wfsLayer.version === '1.1.0') {
      url.searchParams.set('typeName', wfsLayer.searchPropertyTypeName);
      url.searchParams.set(
        'maxFeatures',
        `${maxFeatures || wfsLayer.maxFeatures}`,
      );
    } else if (wfsLayer.version === '2.0.0') {
      url.searchParams.set('typeNames', wfsLayer.searchPropertyTypeName);
      url.searchParams.set('count', `${wfsLayer.maxFeatures}`);
    }

    const propertyNames = this.processPropertyNames(
      wfsLayer.propertyNames,
      propertyName,
    );
    if (propertyNames) {
      url.searchParams.set('propertyName', propertyNames);
    }

    if (sortBy) {
      url.searchParams.set('sortBy', sortBy);
    }

    if (bbox) {
      url.searchParams.set('bbox', bbox);
    }

    const filter = this.prepareFilter(wfsLayer.searchPropertyName, searchText);
    url.searchParams.set('filter', filter);

    return url;
  }

  private processPropertyNames(
    configPropertyNames?: string[],
    propertyName?: string,
  ) {
    if (propertyName && !configPropertyNames) {
      return propertyName;
    }

    if (propertyName && configPropertyNames) {
      return propertyName
        .split(',')
        .filter((name) => configPropertyNames.includes(name))
        .join(',');
    }

    return configPropertyNames?.join(',');
  }

  private prepareFilter(searchPropertyName: string, searchText: string) {
    return `<ogc:Filter>
      <ogc:PropertyIsLike wildCard="*" matchCase="false">
        <ogc:ValueReference>${searchPropertyName}</ogc:ValueReference>
        <ogc:Literal>*${searchText}*</ogc:Literal>
      </ogc:PropertyIsLike>
    </ogc:Filter>`;
  }
}

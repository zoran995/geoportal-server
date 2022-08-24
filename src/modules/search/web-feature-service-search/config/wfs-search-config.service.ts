import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IConfigurationType } from 'src/infrastructure/config';

import { WfsSearchLayerDto } from '../dto/wfs-search-layer.dto';
import { WfsSearchConfigDto } from '../dto/wfs-search.dto';

@Injectable()
export class WfsSearchConfigService {
  private readonly wfsSearchConfig: WfsSearchConfigDto | undefined;
  constructor(
    private readonly _configService: ConfigService<IConfigurationType>,
  ) {
    this.wfsSearchConfig =
      this._configService.get<WfsSearchConfigDto>('wfsSearch');
  }

  getWfsSearchLayer(id: string): WfsSearchLayerDto | undefined {
    return this.wfsSearchConfig?.wfsLayers.get(id);
  }
}

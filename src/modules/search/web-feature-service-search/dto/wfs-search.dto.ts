import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';

import { NotNull } from 'src/common/validators';

import { WfsSearchLayerDto } from './wfs-search-layer.dto';

export class WfsSearchConfigDto {
  @IsObject()
  @NotNull()
  @ValidateNested({ each: true })
  @Type(() => WfsSearchLayerDto)
  wfsLayers!: Map<string, WfsSearchLayerDto>;
}

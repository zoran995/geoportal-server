import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class WfsSearchLayerDto {
  /**
   * URL of the WFS service.
   */
  @IsDefined()
  @IsString()
  url!: string;

  /**
   * Which property to look for the search text in.
   */
  @IsString()
  @IsNotEmpty()
  searchPropertyName!: string;

  /**
   * Type of the properties to search
   */
  @IsString()
  @IsNotEmpty()
  searchPropertyTypeName!: string;

  /**
   * Maximum number of features to request.
   */
  @IsNumber()
  @Min(1)
  maxFeatures = 10;

  /**
   * BBox of the search area.
   */
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsOptional()
  bbox?: [number, number, number, number];

  /**
   * Properties to search for.
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  propertyNames?: string[];

  /**
   * Name of the coordinate system.
   */
  @IsString()
  @IsNotEmpty()
  srsName = 'urn:ogc:def:crs:EPSG::4326';

  /**
   * Version of the WFS service.
   */
  @IsString()
  @IsNotEmpty()
  @IsIn(['1.1.0', '2.0.0'])
  version: '1.1.0' | '2.0.0' = '2.0.0';

  /**
   * Minimum number of characters to search for.
   */
  @IsNumber()
  @Min(0)
  minCharacters = 2;
}

import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class SearchRequestQueryParams {
  @IsNotEmpty()
  @IsString()
  searchText!: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  propertyName?: string;

  @IsString()
  @Matches(
    /^((-)?\d+(\.\d+)?),((-)?\d+(\.\d+)?),((-)?\d+(\.\d+)?),((-)?\d+(\.\d+)?)$/,
  )
  @IsOptional()
  bbox?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxFeatures?: number;
}

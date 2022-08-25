import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxFeatures?: number;
}
